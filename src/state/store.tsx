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
import { loadAudioEngine, loadedAudioEngine, prefetchAudioEngine } from '../audio/loader'
import type { StrumId } from '../audio/strums'
import type { PlayPattern, TimbreId } from '../audio/types'
import { translate, type Lang, type TKey } from '../i18n'
import { QualityId } from '../music/chords'
import { ParsedChord, parseChord } from '../music/parseChord'
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
  type ChordAnalysis,
  type DetectedKey,
  type TransitionAnalysis,
} from '../music/analysis'
import { clampCapo, withCapo } from '../music/capo'
import { resolveStepFrets, type StepVoicingRef, type StepVoicingSource } from '../music/stepVoicing'
import { STANDARD_TUNING, TUNINGS, Voicing, voicingFromFrets, voicingsFor } from '../music/voicings'
import { playhead } from './playhead'
import { chainVoicings, recommendCapo, type CapoOption } from '../music/playability'
import { voicingLabel } from '../music/stepVoicing'
import { appendStep, applyStepVoicing, MAX_STEPS, removeStep, stepId, toggleDetectorFret } from './progressionOps'
import { createHistory, pushHistory, redoHistory, undoHistory, type History } from './history'
import { loadLibrary, removeFromLibrary, saveToLibrary as storeInLibrary, type LibraryEntry } from './library'
import { decodeShare, shareUrl, type SharedProgression } from './share'
import { loadSettings, saveSettings, type Notation, type PersistedSettings, type SuggestFrom } from './settings'

export type { Notation } from './settings'
export type ViewId = 'dictionary' | 'detector' | 'theory' | 'practice'

export interface ProgressionStep {
  id: string
  rootPc: number
  qualityId: QualityId
  anglo: string
  latin: string
  bassPc?: number | null
  frets?: (number | null)[] | null
  voicingLabel?: string
  voicingSource?: StepVoicingSource
  /** Strumming pattern for this step; follows the global one when absent. */
  strum?: StrumId
}

export interface MarkedVoicing {
  rootPc: number
  qualityId: QualityId
  frets: (number | null)[]
  label: string
  capo: number
}

interface StoreValue {
  t: (key: TKey) => string
  lang: Lang
  setLang: (lang: Lang) => void
  notation: Notation
  setNotation: (notation: Notation) => void
  view: ViewId
  setView: (view: ViewId) => void
  tuningId: string
  setTuningId: (id: string) => void
  tuning: number[]
  soundingTuning: number[]
  capo: number
  setCapo: (capo: number) => void
  tempo: number
  setTempo: (tempo: number) => void
  volume: number
  setVolume: (volume: number) => void
  loop: boolean
  setLoop: (loop: boolean) => void
  metronome: boolean
  setMetronome: (metronome: boolean) => void
  beatsPerChord: number
  setBeatsPerChord: (beats: number) => void
  timbre: TimbreId
  setTimbre: (timbre: TimbreId) => void
  strum: StrumId
  setStrum: (strum: StrumId) => void
  setStepStrum: (index: number, strum: StrumId | null) => void
  stopPlayback: () => void
  keyRootPc: number
  setKeyRootPc: (pc: number) => void
  keyMode: Mode
  setKeyMode: (mode: Mode) => void
  /** When true the key follows the progression (once it has two or more chords). */
  keyAuto: boolean
  setKeyAuto: (auto: boolean) => void
  detectedKey: DetectedKey | null
  analysis: ProgressionAnalysis
  /** Next-chord ideas from the last chords of the progression (or the selected chord when empty). */
  nextSteps: Suggestion[]
  /** What the "Puede seguir" panels follow: the progression's last chords or the selected chord. */
  suggestFrom: SuggestFrom
  setSuggestFrom: (from: SuggestFrom) => void
  /** Suggestions for the panels, honouring `suggestFrom` (falls back to the chord with no progression). */
  panelSuggestions: Suggestion[]
  panelFollowsProgression: boolean
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  /** A link that opens this progression (with tempo, beats, capo and strum). */
  shareLink: () => string
  library: LibraryEntry[]
  saveToLibrary: (name: string) => void
  loadFromLibrary: (entry: LibraryEntry) => void
  deleteFromLibrary: (id: string) => void
  /** Re-voice every step to minimise hand movement across the progression. */
  chainProgression: () => void
  capoSuggestion: CapoOption | null
  applyCapoSuggestion: (option: CapoOption) => void
  chord: ParsedChord
  chordInput: string
  chordError: boolean
  setChordInput: (value: string) => void
  setChord: (chord: ParsedChord) => void
  voicings: Voicing[]
  selectedVoicing: number
  selectVoicing: (index: number, play?: boolean) => void
  playVoicing: (index?: number, pattern?: PlayPattern) => void
  playFrets: (frets: (number | null)[], pattern?: PlayPattern) => void
  progression: ProgressionStep[]
  loadProgression: (steps: Array<Omit<ProgressionStep, 'id'>>) => void
  addToProgression: (step: Omit<ProgressionStep, 'id'>) => void
  moveStep: (from: number, to: number) => void
  setStepVoicing: (index: number, voicing: StepVoicingRef | null) => void
  removeFromProgression: (index: number) => void
  markedVoicing: MarkedVoicing | null
  setMarkedVoicing: (voicing: MarkedVoicing | null) => void
  clearProgression: () => void
  playing: boolean
  togglePlay: () => void
  audioReady: boolean
  audioLoading: TimbreId | null
  audioFallback: boolean
  enableAudio: () => Promise<void>
  suggestions: Suggestion[]
  addSuggestion: (suggestion: Suggestion) => void
  detectorFrets: (number | null)[]
  setDetectorFrets: (frets: (number | null)[]) => void
  toggleDetectorString: (stringIndex: number, fret: number) => void
}

export interface ProgressionAnalysis {
  chords: ChordAnalysis[]
  transitions: TransitionAnalysis[]
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadSettings)
  // A shared link (?p=…) opens its progression and settings instead of the saved ones.
  const [shared] = useState(() => (typeof window === 'undefined' ? null : decodeShare(window.location.search)))
  const [lang, setLang] = useState<Lang>(initial.lang)
  const [notation, setNotation] = useState<Notation>(initial.notation)
  const [view, setViewState] = useState<ViewId>(() => {
    if (typeof window === 'undefined') return 'dictionary'
    const hash = window.location.hash.replace('#', '')
    return hash === 'detector' || hash === 'theory' || hash === 'practice' ? hash : 'dictionary'
  })
  const [tuningId, setTuningIdState] = useState(initial.tuningId)
  const [tempo, setTempo] = useState(shared?.tempo ?? initial.tempo)
  const [volume, setVolume] = useState(initial.volume)
  const [loop, setLoop] = useState(initial.loop)
  const [metronome, setMetronomeState] = useState(initial.metronome)
  const [beatsPerChord, setBeatsPerChord] = useState(shared?.beatsPerChord ?? initial.beatsPerChord)
  const [timbre, setTimbreState] = useState<TimbreId>(initial.timbre)
  const [strum, setStrum] = useState<StrumId>(shared?.strum ?? initial.strum)
  const [suggestFrom, setSuggestFrom] = useState<SuggestFrom>(initial.suggestFrom)
  const [capo, setCapoState] = useState(shared?.capo ?? initial.capo)
  const [manualKeyRootPc, setManualKeyRootPc] = useState(initial.keyRootPc)
  const [manualKeyMode, setManualKeyMode] = useState<Mode>(initial.keyMode)
  const [keyAuto, setKeyAuto] = useState(initial.keyAuto)
  const [chordInput, setChordInputState] = useState('Am7')
  const [chord, setChordState] = useState<ParsedChord>(() => parseChord('Am7')!)
  const [chordError, setChordError] = useState(false)
  const [selectedVoicing, setSelectedVoicing] = useState(0)
  const [history, setHistory] = useState<History<ProgressionStep[]>>(() =>
    createHistory(
      shared
        ? shared.steps.map((step, index) => ({ ...step, id: `shared-${index}` }))
        : resolveProgression(PROGRESSIONS[0], initial.keyRootPc).map((step, index) => ({
            rootPc: step.rootPc,
            qualityId: step.qualityId,
            anglo: step.anglo,
            latin: step.latin,
            id: `seed-${index}`,
          })),
    ),
  )
  const progression = history.present
  // Every progression edit goes through the undo history.
  const setProgression = useCallback(
    (next: ProgressionStep[] | ((current: ProgressionStep[]) => ProgressionStep[])) =>
      setHistory((current) => pushHistory(current, typeof next === 'function' ? next(current.present) : next)),
    [],
  )
  const undo = useCallback(() => setHistory(undoHistory), [])
  const redo = useCallback(() => setHistory(redoHistory), [])

  // Once a shared link is opened, drop ?p=… so a reload keeps the player's own edits.
  useEffect(() => {
    if (shared) window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`)
  }, [shared])

  const [library, setLibrary] = useState<LibraryEntry[]>(loadLibrary)
  const [playing, setPlaying] = useState(false)
  const [detectorFrets, setDetectorFrets] = useState<(number | null)[]>([0, 0, 0, 0, 0, 0])
  const [markedVoicing, setMarkedVoicingState] = useState<MarkedVoicing | null>(null)
  const [audioReady, setAudioReady] = useState(false)
  const [audioLoading, setAudioLoading] = useState<TimbreId | null>(null)
  const [audioFallback, setAudioFallback] = useState(false)

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

  const volumeRef = useRef(volume)

  useEffect(() => {
    prefetchAudioEngine()
    return () => {
      const engine = loadedAudioEngine()
      if (engine) {
        engine.onLoadingChange = null
        engine.onFallback = null
      }
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
      suggestFrom,
      capo,
    }
    saveSettings(payload)
  }, [lang, notation, tuningId, tempo, volume, manualKeyRootPc, manualKeyMode, keyAuto, loop, metronome, beatsPerChord, timbre, strum, suggestFrom, capo])

  useEffect(() => {
    volumeRef.current = volume
    loadedAudioEngine()?.setVolume(volume)
  }, [volume])

  const tuning = useMemo(
    () => TUNINGS.find((item) => item.id === tuningId)?.midi ?? STANDARD_TUNING,
    [tuningId],
  )

  const soundingTuning = useMemo(() => withCapo(tuning, capo), [tuning, capo])

  const setCapo = useCallback((next: number) => {
    setCapoState(clampCapo(next))
  }, [])

  const voicings = useMemo(() => {
    const shapes = voicingsFor(chord.rootPc, chord.quality, tuning, { bassPc: chord.bassPc, limit: 9 })
    const shift = (voicing: Voicing): Voicing =>
      capo === 0 ? voicing : { ...voicing, midi: voicing.midi.map((midi) => midi + capo) }
    if (!markedVoicing || markedVoicing.rootPc !== chord.rootPc || markedVoicing.qualityId !== chord.quality.id) {
      return shapes.map(shift)
    }
    const marked = voicingFromFrets(markedVoicing.frets, tuning, chord.rootPc, chord.quality, 'marked')
    if (!marked) return shapes.map(shift)
    return [shift(marked), ...shapes.filter((voicing) => voicing.signature !== marked.signature).map(shift)]
  }, [chord, tuning, capo, markedVoicing])

  const setTuningId = useCallback((id: string) => {
    setTuningIdState(id)
    setSelectedVoicing(0)
  }, [])

  const enableAudio = useCallback(async () => {
    try {
      const engine = await loadAudioEngine()
      engine.onLoadingChange = setAudioLoading
      engine.onFallback = setAudioFallback
      engine.setVolume(volumeRef.current)
      await engine.start()
      setAudioReady(engine.isStarted)
      await engine.setTimbre(timbre)
    } catch {
      setAudioReady(false)
    }
  }, [timbre])

  useEffect(() => {
    if (audioReady) void loadedAudioEngine()?.setTimbre(timbre)
  }, [timbre, audioReady])

  const setTimbre = useCallback((next: TimbreId) => {
    setTimbreState(next)
  }, [])

  const playVoicing = useCallback(
    (index?: number, pattern: PlayPattern = 'strum-down') => {
      const target = voicings[index ?? selectedVoicing]
      if (!target) return
      void enableAudio().then(() => {
        loadedAudioEngine()?.playFrets(target.frets, soundingTuning, pattern)
      })
    },
    [voicings, selectedVoicing, soundingTuning, enableAudio],
  )

  const selectVoicing = useCallback(
    (index: number, play = true) => {
      setSelectedVoicing(index)
      if (play) playVoicing(index)
    },
    [playVoicing],
  )

  const playFrets = useCallback(
    (frets: (number | null)[], pattern: PlayPattern = 'strum-down') => {
      void enableAudio().then(() => {
        loadedAudioEngine()?.playFrets(frets, soundingTuning, pattern)
      })
    },
    [enableAudio, soundingTuning],
  )

  const setChordInput = useCallback((value: string) => {
    setChordInputState(value)
    const parsed = parseChord(value)
    if (parsed) {
      setChordState(parsed)
      setSelectedVoicing(0)
      setChordError(false)
    } else {
      setChordError(value.trim().length > 0)
    }
  }, [])

  const setMarkedVoicing = useCallback((voicing: MarkedVoicing | null) => {
    setMarkedVoicingState(voicing)
  }, [])

  const setChord = useCallback((next: ParsedChord) => {
    setChordState(next)
    setSelectedVoicing(0)
    setChordInputState(next.anglo)
    setChordError(false)
  }, [])

  const addToProgression = useCallback((step: Omit<ProgressionStep, 'id'>) => {
    setProgression((current) => appendStep(current, step, stepId()))
  }, [setProgression])

  const stopPlayback = useCallback(() => {
    loadedAudioEngine()?.stopProgression()
    setPlaying(false)
    playhead.reset()
  }, [])

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
  ])

  useEffect(() => {
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
    })
  }, [playing, progression.length, metronome, tempo, loop, beatsPerChord, soundingTuning, getFretsForStep, getStrumForStep])

  const toggleDetectorString = useCallback((stringIndex: number, fret: number) => {
    setDetectorFrets((previous) => toggleDetectorFret(previous, stringIndex, fret, capo))
  }, [capo])

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
    }),
    [progression, tempo, beatsPerChord, capo, strum],
  )

  const shareLink = useCallback(() => shareUrl(snapshot(), window.location), [snapshot])

  const saveProgressionToLibrary = useCallback((name: string) => setLibrary(storeInLibrary(name, snapshot())), [snapshot])

  const loadFromLibrary = useCallback(
    (entry: LibraryEntry) => {
      stopPlayback()
      const { steps, tempo: savedTempo, beatsPerChord: savedBeats, capo: savedCapo, strum: savedStrum } = entry.progression
      setProgression(steps.map((step, index) => ({ ...step, id: stepId(`lib-${index}`) })))
      if (savedTempo !== undefined) setTempo(savedTempo)
      if (savedBeats !== undefined) setBeatsPerChord(savedBeats)
      if (savedCapo !== undefined) setCapoState(savedCapo)
      if (savedStrum !== undefined) setStrum(savedStrum)
    },
    [stopPlayback, setProgression],
  )

  const deleteFromLibrary = useCallback((id: string) => setLibrary(removeFromLibrary(id)), [])

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
    saveToLibrary: saveProgressionToLibrary,
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
    voicings,
    selectedVoicing,
    selectVoicing,
    playVoicing,
    playFrets,
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
  }), [
    t, lang, notation, view, setView, tuningId, setTuningId, tuning, soundingTuning, capo, setCapo, tempo, volume, loop,
    metronome, setMetronome, beatsPerChord, timbre, setTimbre, strum, setStepStrum, stopPlayback, keyRootPc, setKeyRootPc, keyMode, setKeyMode, keyAuto,
    detectedKey, analysis, nextSteps, suggestFrom, panelSuggestions, panelFollowsProgression, undo, redo, history.past.length, history.future.length, shareLink, library,
    saveProgressionToLibrary, loadFromLibrary, deleteFromLibrary, chainProgression, capoSuggestion, applyCapoSuggestion, chord, chordInput, chordError, setChordInput,
    setChord, voicings, selectedVoicing, selectVoicing, playVoicing, playFrets, progression, loadProgression,
    addToProgression, moveStep, setStepVoicing, removeFromProgression, markedVoicing, setMarkedVoicing,
    clearProgression, playing, togglePlay, audioReady, audioLoading, audioFallback, enableAudio, suggestions,
    addSuggestion, detectorFrets, toggleDetectorString,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used inside StoreProvider')
  return context
}
