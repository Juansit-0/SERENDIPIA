/*
 * Practice history: time practised per day, chord-change scores per pair and ear-training answers.
 * Kept in this browser; travels in the library backup like the rest of the player's data.
 */

export interface DayLog {
  seconds: number
  rounds: number
  earRight: number
  earTotal: number
}

export interface Score {
  at: string
  score: number
}

export interface History {
  days: Record<string, DayLog>
  /** Changes-per-minute rounds per chord pair (one-minute mode), oldest first. */
  pairs: Record<string, Score[]>
}

const STORAGE_KEY = 'serendipia.history.v1'
const SCORES_KEPT = 30
const EMPTY_DAY: DayLog = { seconds: 0, rounds: 0, earRight: 0, earTotal: 0 }

/** A calendar day in local time, as YYYY-MM-DD. */
export function dayKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function loadHistory(): History {
  try {
    return parseHistory(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<History> | null)
  } catch {
    return { days: {}, pairs: {} }
  }
}

function parseHistory(parsed: Partial<History> | null): History {
  const days: Record<string, DayLog> = {}
  for (const [key, value] of Object.entries(parsed?.days ?? {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !value) continue
    const day = value as Partial<DayLog>
    days[key] = {
      seconds: Math.max(0, Number(day.seconds) || 0),
      rounds: Math.max(0, Number(day.rounds) || 0),
      earRight: Math.max(0, Number(day.earRight) || 0),
      earTotal: Math.max(0, Number(day.earTotal) || 0),
    }
  }
  const pairs: Record<string, Score[]> = {}
  for (const [key, value] of Object.entries(parsed?.pairs ?? {})) {
    if (!Array.isArray(value)) continue
    pairs[key] = value.filter((item): item is Score => !!item && typeof item.at === 'string' && Number.isFinite(item.score))
  }
  return { days, pairs }
}

/**
 * Brings in the history of a backup without counting anything twice: per day the larger figures win,
 * and pair scores are joined by their time.
 */
export function mergeHistory(raw: unknown): History {
  const incoming = parseHistory(raw as Partial<History>)
  const history = loadHistory()
  for (const [key, day] of Object.entries(incoming.days)) {
    const mine = history.days[key] ?? EMPTY_DAY
    history.days[key] = {
      seconds: Math.max(mine.seconds, day.seconds),
      rounds: Math.max(mine.rounds, day.rounds),
      earRight: Math.max(mine.earRight, day.earRight),
      earTotal: Math.max(mine.earTotal, day.earTotal),
    }
  }
  for (const [pair, scores] of Object.entries(incoming.pairs)) {
    const byTime = new Map([...(history.pairs[pair] ?? []), ...scores].map((score) => [score.at, score]))
    history.pairs[pair] = [...byTime.values()].sort((a, b) => a.at.localeCompare(b.at)).slice(-SCORES_KEPT)
  }
  save(history)
  return history
}

function save(history: History): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // storage unavailable: today's practice is still shown this visit
  }
}

export interface PracticeEntry {
  seconds: number
  /** A finished chord-change round, with its pair and score when it was a one-minute round. */
  round?: { pair: string; score: number } | true
  /** One ear-training answer. */
  ear?: { right: boolean }
}

export function logPractice(entry: PracticeEntry, now = new Date()): History {
  const history = loadHistory()
  const key = dayKey(now)
  const day = { ...EMPTY_DAY, ...history.days[key] }
  day.seconds += Math.max(0, Math.round(entry.seconds))
  if (entry.round) day.rounds += 1
  if (entry.ear) {
    day.earTotal += 1
    if (entry.ear.right) day.earRight += 1
  }
  history.days[key] = day
  if (entry.round && entry.round !== true) {
    const scores = [...(history.pairs[entry.round.pair] ?? []), { at: now.toISOString(), score: entry.round.score }]
    history.pairs[entry.round.pair] = scores.slice(-SCORES_KEPT)
  }
  save(history)
  return history
}

/** Days in a row with some practice, counting back from today (or yesterday, if today has none yet). */
export function dayStreak(history: History, today = new Date()): number {
  const practised = (date: Date) => (history.days[dayKey(date)]?.seconds ?? 0) > 0
  const cursor = new Date(today)
  if (!practised(cursor)) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (practised(cursor)) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** The last `count` days, oldest first, with the minutes practised on each. */
export function recentDays(history: History, count: number, today = new Date()): Array<{ date: string; minutes: number; day: Date }> {
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(today)
    day.setDate(day.getDate() - (count - 1 - index))
    const key = dayKey(day)
    return { date: key, day, minutes: Math.round(((history.days[key]?.seconds ?? 0) / 60) * 10) / 10 }
  })
}

export function totals(history: History): { minutes: number; rounds: number; earRight: number; earTotal: number; days: number } {
  const days = Object.values(history.days)
  return {
    minutes: Math.round(days.reduce((sum, day) => sum + day.seconds, 0) / 60),
    rounds: days.reduce((sum, day) => sum + day.rounds, 0),
    earRight: days.reduce((sum, day) => sum + day.earRight, 0),
    earTotal: days.reduce((sum, day) => sum + day.earTotal, 0),
    days: days.filter((day) => day.seconds > 0).length,
  }
}
