export interface PracticeRecord {
  best: number
  at: string
}

export interface RampOptions {
  start: number
  step: number
  every: number
  max: number
}

export const DEFAULT_RAMP: RampOptions = { start: 60, step: 4, every: 8, max: 200 }

/** Practice records are kept per pair of chords, regardless of order. */
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join('↔')
}

/** Tempo after `changes` clean changes: up `step` bpm every `every` changes, capped at `max`. */
export function rampTempo(changes: number, options: RampOptions = DEFAULT_RAMP): number {
  const raised = options.start + Math.floor(Math.max(0, changes) / options.every) * options.step
  return Math.min(options.max, raised)
}

export function changesPerMinute(changes: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0
  return Math.round((changes * 60000) / elapsedMs)
}

const STORAGE_KEY = 'serendipia.practice.v1'

export function loadRecords(): Record<string, PracticeRecord> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const records: Record<string, PracticeRecord> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const record = value as Partial<PracticeRecord> | null
      if (record && typeof record.best === 'number' && Number.isFinite(record.best) && typeof record.at === 'string') {
        records[key] = { best: record.best, at: record.at }
      }
    }
    return records
  } catch {
    return {}
  }
}

/** Stores the score if it beats the record; returns true for a new best. */
export function saveRecord(key: string, score: number, now = new Date()): boolean {
  const records = loadRecords()
  if (score <= (records[key]?.best ?? 0)) return false
  records[key] = { best: score, at: now.toISOString() }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    return true
  }
  return true
}
