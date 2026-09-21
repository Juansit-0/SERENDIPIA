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
import { QualityId, qualityById } from '../music/chords'
import { ParsedChord, parseChord } from '../music/parseChord'
import { Suggestion, nextChordSuggestions, PROGRESSIONS, resolveProgression } from '../music/progressions'
import { Mode } from '../music/scales'
import { STANDARD_TUNING, TUNINGS, Voicing, voicingsFor } from '../music/voicings'

export type Notation = 'anglo' | 'latin' | 'both'
export type ViewId = 'dictionary' | 'detector' | 'theory'

export interface ProgressionStep {
  id: string
  rootPc: number
  qualityId: QualityId
  anglo: string
  latin: string
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
  removeFromProgression: (index: number) => void
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
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      return
    }
  }, [lang, notation, tuningId, tempo, volume, keyRootPc, keyMode, loop, beatsPerChord, timbre])

  useEffect(() => {
    audioEngine.setVolume(volume)
  }, [volume])

  const tuning = useMemo(
    () => TUNINGS.find((item) => item.id === tuningId)?.midi ?? STANDARD_TUNING,
    [tuningId],
  )

  const voicings = useMemo(
    () => voicingsFor(chord.rootPc, chord.quality, tuning, { bassPc: chord.bassPc, limit: 9 }),
    [chord, tuning],
  )

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
        audioEngine.playFrets(target.frets, tuning, pattern)
      })
    },
    [voicings, selectedVoicing, tuning, enableAudio],
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
        audioEngine.playFrets(frets, tuning, pattern)
      })
    },
    [enableAudio, tuning],
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
      const options = voicingsFor(step.rootPc, qualityById(step.qualityId), tuning, { limit: 1 })
      return options[0]?.frets ?? null
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
        tuning,
        getFrets: getFretsForStep,
        onStep: (index) => setActiveStep(index),
        onEnd: () => {
          setPlaying(false)
          setActiveStep(-1)
        },
      })
      setPlaying(true)
    })
  }, [playing, progression.length, enableAudio, tempo, loop, beatsPerChord, tuning, getFretsForStep])

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

  const addSuggestion = useCallback(
    (suggestion: Suggestion) => {
      addToProgression({
        rootPc: suggestion.rootPc,
        qualityId: suggestion.qualityId,
        anglo: suggestion.anglo,
        latin: suggestion.latin,
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
    removeFromProgression,
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
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used inside StoreProvider')
  return context
}
