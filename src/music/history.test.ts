// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { dayKey, dayStreak, loadHistory, logPractice, recentDays, totals } from './history'

const on = (iso: string) => new Date(`${iso}T18:00:00`)

describe('practice history', () => {
  beforeEach(() => localStorage.clear())

  it('adds up time, rounds and ear answers per day', () => {
    logPractice({ seconds: 60, round: { pair: 'C↔G', score: 24 } }, on('2026-10-10'))
    logPractice({ seconds: 20, ear: { right: true } }, on('2026-10-10'))
    logPractice({ seconds: 15, ear: { right: false } }, on('2026-10-10'))
    const day = loadHistory().days['2026-10-10']
    expect(day).toEqual({ seconds: 95, rounds: 1, earRight: 1, earTotal: 2 })
    expect(loadHistory().pairs['C↔G']).toHaveLength(1)
  })

  it('counts consecutive days, still alive if today has no practice yet', () => {
    for (const day of ['2026-10-07', '2026-10-08', '2026-10-09', '2026-10-11', '2026-10-12']) logPractice({ seconds: 60 }, on(day))
    expect(dayStreak(loadHistory(), on('2026-10-12'))).toBe(2)
    expect(dayStreak(loadHistory(), on('2026-10-13'))).toBe(2)
    expect(dayStreak(loadHistory(), on('2026-10-14'))).toBe(0)
  })

  it('lists the last days oldest first, with minutes', () => {
    logPractice({ seconds: 90 }, on('2026-10-14'))
    const days = recentDays(loadHistory(), 7, on('2026-10-14'))
    expect(days).toHaveLength(7)
    expect(days[0].date).toBe('2026-10-08')
    expect(days[6]).toMatchObject({ date: '2026-10-14', minutes: 1.5 })
    expect(totals(loadHistory())).toMatchObject({ minutes: 2, days: 1 })
  })

  it('uses local calendar days and survives bad storage', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    localStorage.setItem('serendipia.history.v1', '{"days":{"x":1,"2026-01-01":{"seconds":"7"}},"pairs":{"a":[{"at":1}]}}')
    expect(loadHistory()).toEqual({ days: { '2026-01-01': { seconds: 7, rounds: 0, earRight: 0, earTotal: 0 } }, pairs: { a: [] } })
  })
})

describe('history in a backup', () => {
  beforeEach(() => localStorage.clear())

  it('merges without counting a day twice', async () => {
    const { mergeHistory } = await import('./history')
    logPractice({ seconds: 120, round: { pair: 'C↔G', score: 20 } }, on('2026-10-10'))
    const backup = JSON.parse(JSON.stringify(loadHistory()))
    mergeHistory(backup)
    mergeHistory(backup)
    expect(loadHistory().days['2026-10-10'].seconds).toBe(120)
    expect(loadHistory().pairs['C↔G']).toHaveLength(1)
  })
})
