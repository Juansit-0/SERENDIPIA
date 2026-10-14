import type { StrumId } from '../audio/strums'
import type { PlayPattern, TimbreId } from '../audio/types'
import type { Lang, TKey } from '../i18n'
import type { ChordAnalysis, DetectedKey, TransitionAnalysis } from '../music/analysis'
import type { QualityId } from '../music/chords'
import type { DetectionResult } from '../music/detectChord'
import type { ParsedChord } from '../music/parseChord'
import type { CapoOption } from '../music/playability'
import type { Suggestion } from '../music/progressions'
import type { Mode } from '../music/scales'
import type { StepVoicingRef, StepVoicingSource } from '../music/stepVoicing'
import type { Voicing } from '../music/voicings'
import type { LibraryEntry } from './library'
import type { Notation, SuggestFrom } from './settings'
import type { Song } from './songs'

/* Everything the app reads from the store: the shape of `useStore()`. */

export type { Notation } from './settings'
export type ViewId = 'chord' | 'theory' | 'practice'

/** Where the Acorde fretboard reads its notes from: the selected voicing, or the user's own marks. */
export type ChartSource = 'voicing' | 'marks'

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

export interface StoreValue {
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
  /** «Mi patrón», e.g. "D.DU.UDU". */
  customStrum: string
  setCustomStrum: (pattern: string) => void
  /** Plays one bar of a strum pattern on the chord in view, at the current tempo. */
  previewStrum: (strum: StrumId) => void
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
  songs: Song[]
  saveSong: (song: Song) => void
  deleteSong: (id: string) => void
  /** Plays a song section after section (the strip shows the section playing); stopping restores the progression. */
  playSong: (song: Song) => void
  /** Which song, section and repeat is playing; null when no song is. */
  songPlay: { songId: string; section: number; pass: number } | null
  /** False when the library is full and `name` is new. */
  saveToLibrary: (name: string) => boolean
  /** Merges a backup file; null when it is not one. */
  importLibrary: (text: string) => { added: number; skipped: number; songsAdded: number } | null
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
  /** The step a pedal or the arrow keys point at while stopped (-1: none). */
  stepCursor: number
  /** Moves the cursor to the next/previous step, shows that chord and strums it. */
  moveStepCursor: (delta: number) => void
  voicings: Voicing[]
  selectedVoicing: number
  selectVoicing: (index: number, play?: boolean) => void
  playVoicing: (index?: number, pattern?: PlayPattern) => void
  playFrets: (frets: (number | null)[], pattern?: PlayPattern) => void
  /** The open string's target pitch in the chosen tuning (no capo): the tuner's reference tone. */
  playOpenString: (stringIndex: number) => void
  /** Plays any notes (ear training): together, or one after another. */
  playNotes: (midi: number[], arpeggio?: boolean) => void
  /** Moves the whole progression (and a fixed key) by semitones; one undo step. */
  transposeProgression: (semitones: number) => void
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
  /** Acorde view: one fretboard, two sources (see ChartSource). */
  chartSource: ChartSource
  /** Shape frets currently drawn on the Acorde fretboard. */
  chartFrets: (number | null)[]
  /** Detection of the user's marks (null while the chart shows a catalogue voicing). */
  detection: DetectionResult | null
  /** Toggle a fret on the Acorde fretboard: switches to marks, detects and names the chord. */
  toggleChartFret: (stringIndex: number, fret: number) => void
  /** Pick one of the detector's alternative names, keeping the marks. */
  pickDetectedName: (anglo: string) => void
  /** Empty the user's marks ("Borrar marcas"). */
  clearChartMarks: () => void
  /** The Acorde input reports focus so detection never rewrites what the user is typing. */
  setChordInputFocused: (focused: boolean) => void
}

export interface ProgressionAnalysis {
  chords: ChordAnalysis[]
  transitions: TransitionAnalysis[]
}

