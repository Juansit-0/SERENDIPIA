// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { changesPerMinute, loadRecords, pairKey, rampTempo, saveRecord } from './practice'

describe('practice helpers', () => {
  it('keys a pair the same way in both orders', () => {
    expect(pairKey('G', 'C')).toBe(pairKey('C', 'G'))
  })

  it('ramps the tempo every few changes and caps it', () => {
    expect(rampTempo(0)).toBe(60)
    expect(rampTempo(7)).toBe(60)
    expect(rampTempo(8)).toBe(64)
    expect(rampTempo(33)).toBe(76)
    expect(rampTempo(10000)).toBe(200)
    expect(rampTempo(16, { start: 80, step: 8, every: 4, max: 100 })).toBe(100)
  })

  it('normalises a count to changes per minute', () => {
    expect(changesPerMinute(30, 60000)).toBe(30)
    expect(changesPerMinute(15, 30000)).toBe(30)
    expect(changesPerMinute(5, 0)).toBe(0)
  })
})

describe('records', () => {
  beforeEach(() => localStorage.clear())

  it('keeps only the best score per pair', () => {
    const key = pairKey('C', 'G')
    expect(saveRecord(key, 20)).toBe(true)
    expect(saveRecord(key, 18)).toBe(false)
    expect(saveRecord(key, 25)).toBe(true)
    expect(loadRecords()[key].best).toBe(25)
  })

  it('ignores corrupt storage', () => {
    localStorage.setItem('serendipia.practice.v1', '{"a":{"best":"x"},"b":{"best":12,"at":"2026-01-01"}}')
    expect(loadRecords()).toEqual({ b: { best: 12, at: '2026-01-01' } })
    localStorage.setItem('serendipia.practice.v1', 'not json')
    expect(loadRecords()).toEqual({})
  })
})
