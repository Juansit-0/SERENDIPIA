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
import { audioEngine, type PlayPattern, type TimbreId } from '../audio/engine'
import { translate, type Lang, type TKey } from '../i18n'
import { QualityId } from '../music/chords'
import { ParsedChord, parseChord } from '../music/parseChord'
import { Suggestion, nextChordSuggestions, PROGRESSIONS, resolveProgression } from '../music/progressions'
import { Mode } from '../music/scales'
import { clampCapo, withCapo } from '../music/capo'
import { resolveStepFrets, type StepVoicingRef, type StepVoicingSource } from '../music/stepVoicing'
import { STANDARD_TUNING, TUNINGS, Voicing, voicingFromFrets, voicingsFor } from '../music/voicings'

export type Notation = 'anglo' | 'latin' | 'both'
export type ViewId = 'dictionary' | 'detector' | 'theory'

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
  beatsPerChord: number
  setBeatsPerChord: (beats: number) => void
  timbre: TimbreId
  setTimbre: (timbre: TimbreId) => void
  keyRootPc: number
  setKeyRootPc: (pc: number) => void
  keyMode: Mode
  setKeyMode: (mode: Mode) => void
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
  setStepVoicing: (index: number, voicing: StepVoicingRef | null) => void
  removeFromProgression: (index: number) => void
  markedVoicing: MarkedVoicing | null
  setMarkedVoicing: (voicing: MarkedVoicing | null) => void
  clearProgression: () => void
  playing: boolean
  activeStep: number
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

const StoreContext = createContext<StoreValue | null>(null)

const STORAGE_KEY = 'serendipia.settings.v2'

interface PersistedSettings {
  lang: Lang
  notation: Notation
  tuningId: string
  tempo: number
  volume: number
  keyRootPc: number
  keyMode: Mode
  loop: boolean
  beatsPerChord: number
  timbre: TimbreId
  capo: number
}

const DEFAULTS: PersistedSettings = {
  lang: 'es',
  notation: 'both',
  tuningId: 'standard',
  tempo: 92,
  volume: 0.8,
  keyRootPc: 0,
  keyMode: 'major',
  loop: true,
  beatsPerChord: 4,
  timbre: 'nylon',
  capo: 0,
}

function loadSettings(): PersistedSettings {
  if (typeof localStorage === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('serendipia.settings.v1')
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<PersistedSettings>) }
  } catch {
    return DEFAULTS
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useRef(loadSettings())
  const [lang, setLang] = useState<Lang>(initial.current.lang)
  const [notation, setNotation] = useState<Notation>(initial.current.notation)
  const [view, setViewState] = useState<ViewId>(() => {
    if (typeof window === 'undefined') return 'dictionary'
    const hash = window.location.hash.replace('#', '')
    return hash === 'detector' || hash === 'theory' ? hash : 'dictionary'
  })
  const [tuningId, setTuningId] = useState(initial.current.tuningId)
  const [tempo, setTempo] = useState(initial.current.tempo)
  const [volume, setVolume] = useState(initial.current.volume)
  const [loop, setLoop] = useState(initial.current.loop)
  const [beatsPerChord, setBeatsPerChord] = useState(initial.current.beatsPerChord)
  const [timbre, setTimbreState] = useState<TimbreId>(initial.current.timbre)
  const [capo, setCapoState] = useState(initial.current.capo)
  const [keyRootPc, setKeyRootPc] = useState(initial.current.keyRootPc)
  const [keyMode, setKeyMode] = useState<Mode>(initial.current.keyMode)
  const [chordInput, setChordInputState] = useState('Am7')
  const [chord, setChordState] = useState<ParsedChord>(() => parseChord('Am7')!)
  const [chordError, setChordError] = useState(false)
  const [selectedVoicing, setSelectedVoicing] = useState(0)
  const [progression, setProgression] = useState<ProgressionStep[]>(() =>
    resolveProgression(PROGRESSIONS[0], initial.current.keyRootPc).map((step, index) => ({
      rootPc: step.rootPc,
      qualityId: step.qualityId,
      anglo: step.anglo,
      latin: step.latin,
      id: `seed-${index}`,
    })),
  )
  const [playing, setPlaying] = useState(false)
  const [activeStep, setActiveStep] = useState(-1)
  const [detectorFrets, setDetectorFrets] = useState<(number | null)[]>([0, 0, 0, 0, 0, 0])
  const [markedVoicing, setMarkedVoicingState] = useState<MarkedVoicing | null>(null)
  const [audioReady, setAudioReady] = useState(false)
  const [audioLoading, setAudioLoading] = useState<TimbreId | null>(null)
  const [audioFallback, setAudioFallback] = useState(false)

  const t = useCallback((key: TKey) => translate(lang, key), [lang])

  const setView = useCallback((next: ViewId) => {
    setViewState(next)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${next}`)
    }
  }, [])

  useEffect(() => {
    audioEngine.onLoadingChange = (value) => setAudioLoading(value)
    audioEngine.onFallback = (value) => setAudioFallback(value)
    return () => {
      audioEngine.onLoadingChange = null
      audioEngine.onFallback = null
    }
  }, [])

  useEffect(() => {
    const payload: PersistedSettings = {
      lang,
      notation,
      tuningId,
      tempo,
      volume,
      keyRootPc,
      keyMode,
      loop,
      beatsPerChord,
      timbre,
      capo,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      return
    }
  }, [lang, notation, tuningId, tempo, volume, keyRootPc, keyMode, loop, beatsPerChord, timbre, capo])

  useEffect(() => {
    audioEngine.setVolume(volume)
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

  useEffect(() => {
    setSelectedVoicing(0)
  }, [chord, tuningId])

  const enableAudio = useCallback(async () => {
    try {
      await audioEngine.start()
      setAudioReady(audioEngine.isStarted)
      await audioEngine.setTimbre(timbre)
    } catch {
      setAudioReady(false)
    }
  }, [timbre])

  useEffect(() => {
    if (audioReady) void audioEngine.setTimbre(timbre)
  }, [timbre, audioReady])

  const setTimbre = useCallback((next: TimbreId) => {
    setTimbreState(next)
  }, [])

  const playVoicing = useCallback(
    (index?: number, pattern: PlayPattern = 'strum-down') => {
      const target = voicings[index ?? selectedVoicing]
      if (!target) return
      void enableAudio().then(() => {
        audioEngine.playFrets(target.frets, soundingTuning, pattern)
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
        audioEngine.playFrets(frets, soundingTuning, pattern)
      })
    },
    [enableAudio, soundingTuning],
  )

  const setChordInput = useCallback((value: string) => {
    setChordInputState(value)
    const parsed = parseChord(value)
    if (parsed) {
      setChordState(parsed)
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
    setChordInputState(next.anglo)
    setChordError(false)
  }, [])

  const addToProgression = useCallback((step: Omit<ProgressionStep, 'id'>) => {
    setProgression((current) => {
      if (current.length >= 16) return current
      return [...current, { ...step, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }]
    })
  }, [])

  const loadProgression = useCallback((steps: Array<Omit<ProgressionStep, 'id'>>) => {
    audioEngine.stopProgression()
    setPlaying(false)
    setActiveStep(-1)
    setProgression(
      steps.slice(0, 16).map((step, index) => ({
        ...step,
        id: `loaded-${index}-${Math.random().toString(36).slice(2, 7)}`,
      })),
    )
  }, [])

  const setStepVoicing = useCallback((index: number, voicing: StepVoicingRef | null) => {
    setProgression((current) =>
      current.map((step, position) =>
        position === index
          ? {
              ...step,
              frets: voicing?.frets ?? null,
              voicingLabel: voicing?.label,
              voicingSource: voicing?.source,
            }
          : step,
      ),
    )
  }, [])

  const removeFromProgression = useCallback((index: number) => {
    setProgression((current) => current.filter((_, position) => position !== index))
  }, [])

  const clearProgression = useCallback(() => {
    setProgression([])
    audioEngine.stopProgression()
    setPlaying(false)
    setActiveStep(-1)
  }, [])

  const getFretsForStep = useCallback(
    (index: number): (number | null)[] | null => {
      const step = progression[index]
      if (!step) return null
      return resolveStepFrets(step, tuning)
    },
    [progression, tuning],
  )

  const togglePlay = useCallback(() => {
    if (playing) {
      audioEngine.stopProgression()
      setPlaying(false)
      setActiveStep(-1)
      return
    }
    if (progression.length === 0) return
    void enableAudio().then(() => {
      audioEngine.playProgression({
        stepCount: progression.length,
        tempo,
        loop,
        beatsPerChord,
        tuning: soundingTuning,
        getFrets: getFretsForStep,
        onStep: (index) => setActiveStep(index),
        onEnd: () => {
          setPlaying(false)
          setActiveStep(-1)
        },
      })
      setPlaying(true)
    })
  }, [playing, progression.length, enableAudio, tempo, loop, beatsPerChord, soundingTuning, getFretsForStep])

  useEffect(() => {
    if (!playing) return
    audioEngine.updateProgression({ tempo, loop, beatsPerChord })
  }, [tempo, loop, beatsPerChord, playing])

  useEffect(() => {
    if (!playing) return
    if (progression.length === 0) {
      audioEngine.stopProgression()
      setPlaying(false)
      setActiveStep(-1)
      return
    }
    audioEngine.updateProgression({ stepCount: progression.length, getFrets: getFretsForStep })
  }, [progression, playing, getFretsForStep])

  const toggleDetectorString = useCallback((stringIndex: number, fret: number) => {
    setDetectorFrets((previous) => {
      const next = [...previous]
      next[stringIndex] = fret < 0 ? null : Math.max(0, fret - capo)
      return next
    })
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

  const suggestions = useMemo(
    () => nextChordSuggestions(chord.rootPc, keyRootPc, keyMode),
    [chord.rootPc, keyRootPc, keyMode],
  )

  const value: StoreValue = {
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
    beatsPerChord,
    setBeatsPerChord,
    timbre,
    setTimbre,
    keyRootPc,
    setKeyRootPc,
    keyMode,
    setKeyMode,
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
    setStepVoicing,
    removeFromProgression,
    markedVoicing,
    setMarkedVoicing,
    clearProgression,
    playing,
    activeStep,
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
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used inside StoreProvider')
  return context
}
