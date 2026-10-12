import { TIMBRES, type TimbreId } from '../audio/types'
import type { Lang } from '../i18n'
import { MAX_CAPO } from '../music/capo'
import type { Mode } from '../music/scales'
import { TUNINGS } from '../music/voicings'

export type Notation = 'anglo' | 'latin' | 'both'

export interface PersistedSettings {
  lang: Lang
  notation: Notation
  tuningId: string
  tempo: number
  volume: number
  keyRootPc: number
  keyMode: Mode
  keyAuto: boolean
  loop: boolean
  metronome: boolean
  beatsPerChord: number
  timbre: TimbreId
  capo: number
}

export const STORAGE_KEY = 'serendipia.settings.v2'
const LEGACY_KEY = 'serendipia.settings.v1'

export const TEMPO_MIN = 40
export const TEMPO_MAX = 208
export const BEAT_OPTIONS = [1, 2, 4, 8]

export const DEFAULT_SETTINGS: PersistedSettings = {
  lang: 'es',
  notation: 'both',
  tuningId: 'standard',
  tempo: 92,
  volume: 0.8,
  keyRootPc: 0,
  keyMode: 'major',
  keyAuto: true,
  loop: true,
  metronome: false,
  beatsPerChord: 4,
  timbre: 'nylon',
  capo: 0,
}

function oneOf<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function intIn(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : fallback
}

export function sanitizeSettings(raw: unknown): PersistedSettings {
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const d = DEFAULT_SETTINGS
  return {
    lang: oneOf(input.lang, ['es', 'en'] as Lang[], d.lang),
    notation: oneOf(input.notation, ['anglo', 'latin', 'both'] as Notation[], d.notation),
    tuningId: oneOf(input.tuningId, TUNINGS.map((tuning) => tuning.id), d.tuningId),
    tempo: intIn(input.tempo, TEMPO_MIN, TEMPO_MAX, d.tempo),
    volume: typeof input.volume === 'number' && input.volume >= 0 && input.volume <= 1 ? input.volume : d.volume,
    keyRootPc: intIn(input.keyRootPc, 0, 11, d.keyRootPc),
    keyMode: oneOf(input.keyMode, ['major', 'minor'] as Mode[], d.keyMode),
    keyAuto: typeof input.keyAuto === 'boolean' ? input.keyAuto : d.keyAuto,
    loop: typeof input.loop === 'boolean' ? input.loop : d.loop,
    metronome: typeof input.metronome === 'boolean' ? input.metronome : d.metronome,
    beatsPerChord: oneOf(input.beatsPerChord, BEAT_OPTIONS, d.beatsPerChord),
    timbre: oneOf(input.timbre, TIMBRES.map((timbre) => timbre.id), d.timbre),
    capo: intIn(input.capo, 0, MAX_CAPO, d.capo),
  }
}

export function loadSettings(): PersistedSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY)
    return raw ? sanitizeSettings(JSON.parse(raw)) : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: PersistedSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    return
  }
}
