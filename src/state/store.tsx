import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { loadedAudioEngine } from '../audio/loader'
import type { BackingStyle } from '../audio/backing'
import { setCustomPattern, type StrumId } from '../audio/strums'
import type { PlayPattern, TimbreId } from '../audio/types'
import { translate, type Lang, type TKey } from '../i18n'
import { parseChord } from '../music/parseChord'
import {
  moveStep as reorderSteps,
  nextChordSuggestions,
  PROGRESSIONS,
  resolveProgression,
  Suggestion,
} from '../music/progressions'
import { Mode } from '../music/scales'
import {
  analyzeChord,
  analyzeTransition,
  detectProgressionKey,
  suggestNextChords,
} from '../music/analysis'
import { clampCapo, withCapo } from '../music/capo'
import { resolveStepFrets, type StepVoicingRef } from '../music/stepVoicing'
import { STANDARD_TUNING, TUNINGS } from '../music/voicings'
import { playhead } from './playhead'
import { chainVoicings, recommendCapo, type CapoOption } from '../music/playability'
import { voicingLabel } from '../music/stepVoicing'
import { appendStep, applyStepVoicing, MAX_STEPS, removeStep, stepId, transposeSteps } from './progressionOps'
import { createHistory, pushHistory, redoHistory, undoHistory, type History } from './history'
import type { LibraryEntry } from './library'
import { emitPluck } from './pluck'
import { loadSessionSteps, saveSessionSteps } from './session'
import { decodeShare, shareUrl, type SharedProgression } from './share'
import { flattenSong, type Song, type SongStep } from './songs'
import { loadSettings, saveSettings, type Notation, type PersistedSettings, type SuggestFrom } from './settings'

import type { ProgressionAnalysis, ProgressionStep, StoreValue, ViewId } from './storeTypes'
import { useAudio } from './useAudio'
import { useChordChart } from './useChordChart'
import { useCollections } from './useCollections'

export type { ChartSource, MarkedVoicing, Notation, ProgressionAnalysis, ProgressionStep, StoreValue, ViewId } from './storeTypes'
export { resetSongLinkForTests } from './songLink'

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadSettings)
  // A shared link (?p=…) opens its progression and settings instead of the saved ones.
  const [shared] = useState(() => (typeof window === 'undefined' ? null : decodeShare(window.location.search)))
  const [lang, setLang] = useState<Lang>(initial.lang)
  const [notation, setNotation] = useState<Notation>(initial.notation)
  const [view, setViewState] = useState<ViewId>(() => {
    if (typeof window === 'undefined') return 'chord'
    const hash = window.location.hash.replace('#', '')
    // Old links (#dictionary, #detector) land on the merged Acorde view.
    return hash === 'theory' || hash === 'practice' ? hash : 'chord'
  })
  const [tuningId, setTuningIdState] = useState(initial.tuningId)
  const [tempo, setTempo] = useState(shared?.tempo ?? initial.tempo)
  const [volume, setVolume] = useState(initial.volume)
  const [loop, setLoop] = useState(initial.loop)
  const [metronome, setMetronomeState] = useState(initial.metronome)
  const [beatsPerChord, setBeatsPerChord] = useState(shared?.beatsPerChord ?? initial.beatsPerChord)
  const [timbre, setTimbreState] = useState<TimbreId>(initial.timbre)
  const [strum, setStrum] = useState<StrumId>(shared?.strum ?? initial.strum)
  const [customStrum, setCustomStrumState] = useState(() => {
    const pattern = shared?.customStrum ?? initial.customStrum
    setCustomPattern(pattern)
    return pattern
  })
  const setCustomStrum = useCallback((pattern: string) => {
    setCustomPattern(pattern)
    setCustomStrumState(pattern)
  }, [])
  const [backing, setBacking] = useState<BackingStyle>(initial.backing)
  // The engine asks for the style at every step, so a change applies from the next chord on.
  const backingRef = useRef(backing)
  useEffect(() => {
    backingRef.current = backing
  }, [backing])
  const getBacking = useCallback(() => backingRef.current, [])
  const [suggestFrom, setSuggestFrom] = useState<SuggestFrom>(initial.suggestFrom)
  const [capo, setCapoState] = useState(shared?.capo ?? initial.capo)
  const [manualKeyRootPc, setManualKeyRootPc] = useState(initial.keyRootPc)
  const [manualKeyMode, setManualKeyMode] = useState<Mode>(initial.keyMode)
  const [keyAuto, setKeyAuto] = useState(initial.keyAuto)
  const [history, setHistory] = useState<History<ProgressionStep[]>>(() =>
    createHistory(
      shared
        ? shared.steps.map((step, index) => ({ ...step, id: `shared-${index}` }))
        : (loadSessionSteps()?.map((step, index) => ({ ...step, id: `kept-${index}` })) ??
          resolveProgression(PROGRESSIONS[0], initial.keyRootPc).map((step, index) => ({
            rootPc: step.rootPc,
            qualityId: step.qualityId,
            anglo: step.anglo,
            latin: step.latin,
            id: `seed-${index}`,
          }))),
    ),
  )
  const progression = history.present
  // Every progression edit goes through the undo history.
  const setProgression = useCallback(
    (next: ProgressionStep[] | ((current: ProgressionStep[]) => ProgressionStep[])) =>
      setHistory((current) => pushHistory(current, typeof next === 'function' ? next(current.present) : next)),
    [],
  )
  // While a song plays, the strip shows its current section; the player's own progression waits here.
  const songRef = useRef<{ flat: SongStep[]; saved: ProgressionStep[] } | null>(null)
  const [songPlay, setSongPlay] = useState<{ songId: string; section: number; pass: number } | null>(null)
  const undo = useCallback(() => setHistory(undoHistory), [])
  const redo = useCallback(() => setHistory(redoHistory), [])

  // Once a shared link is opened, drop ?p=… so a reload keeps the player's own edits.
  useEffect(() => {
    if (shared) window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`)
  }, [shared])


  // Keep the progression being worked on, so a reload (or a crash) never loses it.
  useEffect(() => {
    if (!songRef.current) saveSessionSteps(progression.map(({ id: _id, ...step }) => step))
  }, [progression])
  const [playing, setPlaying] = useState(false)

  const { audioReady, audioLoading, audioFallback, enableAudio } = useAudio(volume, timbre)
  const t = useCallback((key: TKey) => translate(lang, key), [lang])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = translate(lang, 'app.title')
  }, [lang])

  const setView = useCallback((next: ViewId) => {
    setViewState(next)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${next}`)
    }
  }, [])


  useEffect(() => {
    const payload: PersistedSettings = {
      lang,
      notation,
      tuningId,
      tempo,
      volume,
      keyRootPc: manualKeyRootPc,
      keyMode: manualKeyMode,
      keyAuto,
      loop,
      metronome,
      beatsPerChord,
      timbre,
      strum,
      customStrum,
      backing,
      suggestFrom,
      capo,
    }
    saveSettings(payload)
  }, [lang, notation, tuningId, tempo, volume, manualKeyRootPc, manualKeyMode, keyAuto, loop, metronome, beatsPerChord, timbre, strum, customStrum, backing, suggestFrom, capo])


  const tuning = useMemo(
    () => TUNINGS.find((item) => item.id === tuningId)?.midi ?? STANDARD_TUNING,
    [tuningId],
  )

  const soundingTuning = useMemo(() => withCapo(tuning, capo), [tuning, capo])

  const {
    chord,
    chordInput,
    chordError,
    setChordInput,
    setChord,
    voicings,
    selectedVoicing,
    setSelectedVoicing,
    selectVoicing,
    playVoicing,
    markedVoicing,
    setMarkedVoicing,
    detectorFrets,
    setDetectorFrets,
    toggleDetectorString,
    chartSource,
    chartFrets,
    detection,
    toggleChartFret,
    pickDetectedName,
    clearChartMarks,
    setChordInputFocused,
  } = useChordChart({ tuning, capo, soundingTuning, enableAudio })

  const setCapo = useCallback((next: number) => {
    setCapoState(clampCapo(next))
  }, [])


  const setTuningId = useCallback(
    (id: string) => {
      setTuningIdState(id)
      setSelectedVoicing(0)
    },
    [setSelectedVoicing],
  )


  const setTimbre = useCallback((next: TimbreId) => {
    setTimbreState(next)
  }, [])



  const playFrets = useCallback(
    (frets: (number | null)[], pattern: PlayPattern = 'strum-down') => {
      emitPluck(frets)
      void enableAudio().then(() => {
        loadedAudioEngine()?.playFrets(frets, soundingTuning, pattern)
      })
    },
    [enableAudio, soundingTuning],
  )

  const transposeProgression = useCallback(
    (semitones: number) => {
      if (semitones === 0) return
      setProgression((current) => transposeSteps(current, semitones))
      if (!keyAuto) setManualKeyRootPc((current) => (((current + semitones) % 12) + 12) % 12)
    },
    [setProgression, keyAuto],
  )

  const previewStrum = useCallback(
    (pattern: StrumId) => {
      const frets = voicings[selectedVoicing]?.frets ?? (progression[0] ? resolveStepFrets(progression[0], tuning) : null)
      if (!frets) return
      emitPluck(frets)
      void enableAudio().then(() => loadedAudioEngine()?.previewStrum(frets, soundingTuning, pattern, tempo))
    },
    [voicings, selectedVoicing, progression, tuning, soundingTuning, tempo, enableAudio],
  )

  const playNotes = useCallback(
    (midi: number[], arpeggio = false) => {
      void enableAudio().then(() => loadedAudioEngine()?.playNotes(midi, arpeggio))
    },
    [enableAudio],
  )

  const playOpenString = useCallback(
    (stringIndex: number) => {
      void enableAudio().then(() => loadedAudioEngine()?.playString(stringIndex, tuning[stringIndex]))
    },
    [enableAudio, tuning],
  )




  const [stepCursor, setStepCursor] = useState(-1)
  const moveStepCursor = useCallback(
    (delta: number) => {
      if (progression.length === 0) return
      const next = stepCursor < 0 ? (delta > 0 ? 0 : progression.length - 1) : (stepCursor + delta + progression.length) % progression.length
      setStepCursor(next)
      const step = progression[next]
      const parsed = parseChord(step.anglo)
      if (parsed) setChord(parsed)
      const frets = resolveStepFrets(step, tuning)
      if (frets) {
        emitPluck(frets)
        void enableAudio().then(() => loadedAudioEngine()?.playFrets(frets, soundingTuning, 'strum-down'))
      }
    },
    [progression, stepCursor, setChord, tuning, soundingTuning, enableAudio],
  )

  const addToProgression = useCallback((step: Omit<ProgressionStep, 'id'>) => {
    setProgression((current) => appendStep(current, step, stepId()))
  }, [setProgression])

  /** Back from a song to the player's own progression (outside the undo history: the song never edited it). */
  const endSong = useCallback(() => {
    const song = songRef.current
    if (!song) return
    songRef.current = null
    setSongPlay(null)
    setHistory((current) => ({ ...current, present: song.saved }))
  }, [])

  const stopPlayback = useCallback(() => {
    loadedAudioEngine()?.stopProgression()
    setPlaying(false)
    playhead.reset()
    endSong()
  }, [endSong])

  const loadProgression = useCallback(
    (steps: Array<Omit<ProgressionStep, 'id'>>) => {
      stopPlayback()
      setProgression(steps.slice(0, MAX_STEPS).map((step, index) => ({ ...step, id: stepId(`loaded-${index}`) })))
    },
    [stopPlayback, setProgression],
  )

  const moveStep = useCallback((from: number, to: number) => {
    setProgression((current) => reorderSteps(current, from, to))
  }, [setProgression])

  const setStepVoicing = useCallback((index: number, voicing: StepVoicingRef | null) => {
    setProgression((current) => applyStepVoicing(current, index, voicing))
  }, [setProgression])

  const removeFromProgression = useCallback(
    (index: number) => {
      setProgression((current) => removeStep(current, index))
      if (progression.length <= 1 && !metronome) stopPlayback()
    },
    [progression.length, metronome, stopPlayback, setProgression],
  )

  const setMetronome = useCallback(
    (next: boolean) => {
      setMetronomeState(next)
      if (!next && progression.length === 0) stopPlayback()
    },
    [progression.length, stopPlayback],
  )

  const clearProgression = useCallback(() => {
    setProgression([])
    stopPlayback()
  }, [stopPlayback, setProgression])

  const getFretsForStep = useCallback(
    (index: number): (number | null)[] | null => {
      const step = progression[index]
      if (!step) return null
      return resolveStepFrets(step, tuning)
    },
    [progression, tuning],
  )

  const getStrumForStep = useCallback((index: number): StrumId => progression[index]?.strum ?? strum, [progression, strum])

  const getBassForStep = useCallback(
    (index: number): number | null => {
      const step = progression[index]
      return step ? (step.bassPc ?? step.rootPc) : null
    },
    [progression],
  )

  const setStepStrum = useCallback((index: number, next: StrumId | null) => {
    setProgression((current) =>
      current.map((step, position) => (position === index ? { ...step, strum: next ?? undefined } : step)),
    )
  }, [setProgression])

  const togglePlay = useCallback(() => {
    if (playing) {
      stopPlayback()
      return
    }
    if (progression.length === 0 && !metronome) return
    void enableAudio().then(() => {
      const engine = loadedAudioEngine()
      if (!engine?.isStarted) return
      engine.playProgression({
        stepCount: progression.length,
        tempo,
        loop,
        beatsPerChord,
        tuning: soundingTuning,
        metronome,
        getFrets: getFretsForStep,
        getStrum: getStrumForStep,
        getBass: getBassForStep,
        getBacking,
        onStep: playhead.setStep,
        onBeat: playhead.setBeat,
        onEnd: () => {
          setPlaying(false)
          playhead.reset()
        },
      })
      setPlaying(true)
    })
  }, [
    playing,
    stopPlayback,
    progression.length,
    metronome,
    enableAudio,
    tempo,
    loop,
    beatsPerChord,
    soundingTuning,
    getFretsForStep,
    getStrumForStep,
    getBassForStep,
    getBacking,
  ])

  useEffect(() => {
    if (playing && songRef.current) {
      // A song keeps its own steps; only the shared settings follow along.
      loadedAudioEngine()?.updateProgression({ tempo, loop, beatsPerChord, metronome })
      return
    }
    if (!playing || (progression.length === 0 && !metronome)) return
    loadedAudioEngine()?.updateProgression({
      tempo,
      loop,
      beatsPerChord,
      metronome,
      tuning: soundingTuning,
      stepCount: progression.length,
      getFrets: getFretsForStep,
      getStrum: getStrumForStep,
      getBass: getBassForStep,
    })
  }, [playing, progression.length, metronome, tempo, loop, beatsPerChord, soundingTuning, getFretsForStep, getStrumForStep, getBassForStep])



  const addSuggestion = useCallback(
    (suggestion: Suggestion) => {
      addToProgression({
        rootPc: suggestion.rootPc,
        qualityId: suggestion.qualityId,
        anglo: suggestion.anglo,
        latin: suggestion.latin,
        voicingSource: 'auto',
      })
    },
    [addToProgression],
  )

  const detectedKey = useMemo(
    () => (progression.length >= 2 ? detectProgressionKey(progression) : null),
    [progression],
  )
  const keyRootPc = keyAuto && detectedKey ? detectedKey.rootPc : manualKeyRootPc
  const keyMode = keyAuto && detectedKey ? detectedKey.mode : manualKeyMode

  const setKeyRootPc = useCallback(
    (pc: number) => {
      setManualKeyRootPc(pc)
      setManualKeyMode(keyMode)
      setKeyAuto(false)
    },
    [keyMode],
  )
  const setKeyMode = useCallback(
    (mode: Mode) => {
      setManualKeyRootPc(keyRootPc)
      setManualKeyMode(mode)
      setKeyAuto(false)
    },
    [keyRootPc],
  )

  const analysis = useMemo<ProgressionAnalysis>(() => {
    const key = { rootPc: keyRootPc, mode: keyMode }
    // Explanations name the chords in the notation the player reads.
    const named = progression.map((step) => (notation === 'latin' ? { ...step, anglo: step.latin } : step))
    return {
      chords: named.map((step) => analyzeChord(step, key)),
      transitions: named.slice(1).map((step, index) => analyzeTransition(named[index], step, key)),
    }
  }, [progression, keyRootPc, keyMode, notation])

  const snapshot = useCallback(
    (): SharedProgression => ({
      steps: progression.map(({ id: _id, ...step }) => step),
      tempo,
      beatsPerChord,
      capo,
      strum,
      // «Mi patrón» travels only when something uses it.
      ...(strum === 'custom' || progression.some((step) => step.strum === 'custom') ? { customStrum } : {}),
    }),
    [progression, tempo, beatsPerChord, capo, strum, customStrum],
  )

  const shareLink = useCallback(() => shareUrl(snapshot(), window.location), [snapshot])

  const {
    library,
    songs,
    saveToLibrary: saveProgressionToLibrary,
    importLibrary,
    deleteFromLibrary,
    saveSong: saveSongToList,
    deleteSong,
  } = useCollections(initial.lang, snapshot)



  const loadFromLibrary = useCallback(
    (entry: LibraryEntry) => {
      stopPlayback()
      const { steps, tempo: savedTempo, beatsPerChord: savedBeats, capo: savedCapo, strum: savedStrum } = entry.progression
      setProgression(steps.map((step, index) => ({ ...step, id: stepId(`lib-${index}`) })))
      if (savedTempo !== undefined) setTempo(savedTempo)
      if (savedBeats !== undefined) setBeatsPerChord(savedBeats)
      if (savedCapo !== undefined) setCapoState(savedCapo)
      if (savedStrum !== undefined) setStrum(savedStrum)
      if (entry.progression.customStrum) setCustomStrum(entry.progression.customStrum)
    },
    [stopPlayback, setProgression, setCustomStrum],
  )



  const playSong = useCallback(
    (song: Song) => {
      // Switching songs: the player's progression is the one the first song set aside.
      const saved = songRef.current?.saved ?? progression
      stopPlayback()
      const flat = flattenSong(song)
      if (flat.length === 0) return
      const showSection = (index: number) =>
        setHistory((current) => ({
          ...current,
          present: song.sections[index].progression.steps.map((step, position) => ({ ...step, id: `song-${index}-${position}` })),
        }))
      void enableAudio().then(() => {
        const engine = loadedAudioEngine()
        if (!engine?.isStarted) return
        songRef.current = { flat, saved }
        showSection(0)
        setSongPlay({ songId: song.id, section: 0, pass: 0 })
        let shown = 0
        engine.playProgression({
          stepCount: flat.length,
          tempo,
          loop,
          beatsPerChord,
          tuning: soundingTuning,
          metronome,
          getFrets: (index) => (flat[index] ? resolveStepFrets(flat[index].step, tuning) : null),
          getStrum: (index) => flat[index]?.step.strum ?? strum,
          getBass: (index) => (flat[index] ? (flat[index].step.bassPc ?? flat[index].step.rootPc) : null),
          getBacking,
          onStep: (index) => {
            const item = flat[index]
            if (!item || !songRef.current) return
            if (item.section !== shown) {
              shown = item.section
              showSection(item.section)
            }
            setSongPlay({ songId: song.id, section: item.section, pass: item.pass })
            playhead.setStep(item.local)
          },
          onBeat: playhead.setBeat,
          onEnd: () => {
            setPlaying(false)
            playhead.reset()
            endSong()
          },
        })
        setPlaying(true)
      })
    },
    [stopPlayback, progression, enableAudio, tempo, loop, beatsPerChord, soundingTuning, metronome, tuning, strum, endSong, getBacking],
  )

  const chainProgression = useCallback(() => {
    setProgression((current) => {
      const chained = chainVoicings(current, tuning)
      return current.map((step, index) => {
        const frets = chained[index]
        return frets ? { ...step, frets, voicingLabel: voicingLabel(frets), voicingSource: 'proof' as const } : step
      })
    })
  }, [tuning, setProgression])

  const capoSuggestion = useMemo(
    () => (progression.length >= 2 ? recommendCapo(progression, capo, tuning) : null),
    [progression, capo, tuning],
  )

  const applyCapoSuggestion = useCallback((option: CapoOption) => {
    setCapoState(option.capo)
    setProgression((current) =>
      current.map((step, index) => {
        const shape = option.shapes[index]
        if (!shape) return step
        // New shapes: drop any pinned voicing so each step picks its easiest form again.
        return { id: step.id, rootPc: shape.rootPc, qualityId: shape.qualityId, bassPc: shape.bassPc, anglo: shape.anglo, latin: shape.latin, strum: step.strum }
      }),
    )
  }, [setProgression])

  const suggestions = useMemo(
    () => nextChordSuggestions(chord.rootPc, keyRootPc, keyMode),
    [chord.rootPc, keyRootPc, keyMode],
  )

  const nextSteps = useMemo(
    () => (progression.length > 0 ? suggestNextChords(progression, { rootPc: keyRootPc, mode: keyMode }) : suggestions),
    [progression, keyRootPc, keyMode, suggestions],
  )

  const panelFollowsProgression = suggestFrom === 'progression' && progression.length > 0
  const panelSuggestions = panelFollowsProgression ? nextSteps : suggestions

  const value = useMemo<StoreValue>(() => ({
    t,
    lang,
    setLang,
    notation,
    setNotation,
    view,
    setView,
    tuningId,
    setTuningId,
    tuning,
    soundingTuning,
    capo,
    setCapo,
    tempo,
    setTempo,
    volume,
    setVolume,
    loop,
    setLoop,
    metronome,
    setMetronome,
    beatsPerChord,
    setBeatsPerChord,
    timbre,
    setTimbre,
    strum,
    setStrum,
    setStepStrum,
    stopPlayback,
    keyRootPc,
    setKeyRootPc,
    keyMode,
    setKeyMode,
    keyAuto,
    setKeyAuto,
    detectedKey,
    analysis,
    nextSteps,
    suggestFrom,
    setSuggestFrom,
    panelSuggestions,
    panelFollowsProgression,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    shareLink,
    library,
    songs,
    saveSong: saveSongToList,
    deleteSong,
    playSong,
    songPlay,
    saveToLibrary: saveProgressionToLibrary,
    importLibrary,
    loadFromLibrary,
    deleteFromLibrary,
    chainProgression,
    capoSuggestion,
    applyCapoSuggestion,
    chord,
    chordInput,
    chordError,
    setChordInput,
    setChord,
    stepCursor: stepCursor < progression.length ? stepCursor : -1,
    moveStepCursor,
    voicings,
    selectedVoicing,
    selectVoicing,
    playVoicing,
    playFrets,
    playOpenString,
    playNotes,
    previewStrum,
    customStrum,
    setCustomStrum,
    backing,
    setBacking,
    transposeProgression,
    progression,
    loadProgression,
    addToProgression,
    moveStep,
    setStepVoicing,
    removeFromProgression,
    markedVoicing,
    setMarkedVoicing,
    clearProgression,
    playing,
    togglePlay,
    audioReady,
    audioLoading,
    audioFallback,
    enableAudio,
    suggestions,
    addSuggestion,
    detectorFrets,
    setDetectorFrets,
    toggleDetectorString,
    chartSource,
    chartFrets,
    detection,
    toggleChartFret,
    pickDetectedName,
    clearChartMarks,
    setChordInputFocused,
  }), [
    t, lang, notation, view, setView, tuningId, setTuningId, tuning, soundingTuning, capo, setCapo, tempo, volume, loop,
    metronome, setMetronome, beatsPerChord, timbre, setTimbre, strum, setStepStrum, stopPlayback, keyRootPc, setKeyRootPc, keyMode, setKeyMode, keyAuto,
    detectedKey, analysis, nextSteps, suggestFrom, panelSuggestions, panelFollowsProgression, undo, redo, history.past.length, history.future.length, shareLink, library,
    saveProgressionToLibrary, importLibrary, songs, saveSongToList, deleteSong, playSong, songPlay, loadFromLibrary, deleteFromLibrary, chainProgression, capoSuggestion, applyCapoSuggestion, chord, chordInput, chordError, setChordInput,
    setChord, stepCursor, moveStepCursor, voicings, selectedVoicing, selectVoicing, playVoicing, playFrets, playOpenString, playNotes, previewStrum, customStrum, setCustomStrum, backing, transposeProgression, progression, loadProgression,
    addToProgression, moveStep, setStepVoicing, removeFromProgression, markedVoicing, setMarkedVoicing,
    clearProgression, playing, togglePlay, audioReady, audioLoading, audioFallback, enableAudio, suggestions,
    addSuggestion, detectorFrets, setDetectorFrets, toggleDetectorString, chartSource, chartFrets, detection, toggleChartFret,
    pickDetectedName, clearChartMarks, setChordInputFocused,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used inside StoreProvider')
  return context
}
