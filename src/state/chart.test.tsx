// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StoreProvider, useStore } from './store'

vi.mock('../audio/loader', () => ({
  loadAudioEngine: () => new Promise(() => undefined),
  loadedAudioEngine: () => null,
  prefetchAudioEngine: () => undefined,
}))

const wrapper = ({ children }: { children: ReactNode }) => <StoreProvider>{children}</StoreProvider>

function setup() {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  return renderHook(() => useStore(), { wrapper })
}

/** Mark a whole shape string by string, clicking absolute frets like the UI does (fret < 0 = mute). */
function mark(result: { current: ReturnType<typeof useStore> }, frets: (number | null)[], capo = 0) {
  frets.forEach((fret, string) =>
    act(() => result.current.toggleChartFret(string, fret === null ? -1 : fret === 0 ? 0 : fret + capo)),
  )
}

describe('Acorde chart: one fretboard, both directions', () => {
  beforeEach(() => localStorage.clear())

  it('shows the selected catalogue voicing until the user marks the board', () => {
    const { result } = setup()
    expect(result.current.view).toBe('chord')
    expect(result.current.chartSource).toBe('voicing')
    expect(result.current.chartFrets).toEqual(result.current.voicings[0].frets)
    expect(result.current.detection).toBeNull()
  })

  it('names the chord the marks make and writes it in the input', () => {
    const { result } = setup()
    mark(result, [null, 3, 2, 0, 1, 0])
    expect(result.current.chartSource).toBe('marks')
    expect(result.current.chord.anglo).toBe('C')
    expect(result.current.chordInput).toBe('C')
    expect(result.current.chartFrets).toEqual([null, 3, 2, 0, 1, 0])
    expect(result.current.markedVoicing?.frets).toEqual([null, 3, 2, 0, 1, 0])
  })

  it('never rewrites the input while the user is typing', () => {
    const { result } = setup()
    act(() => result.current.setChordInputFocused(true))
    act(() => result.current.setChordInput('G'))
    mark(result, [null, 0, 2, 2, 1, 0])
    expect(result.current.chord.anglo).toBe('Am')
    expect(result.current.chordInput).toBe('G')
  })

  it('names the shape, not the sounding chord, with a capo on', () => {
    const { result } = setup()
    act(() => result.current.setCapo(2))
    mark(result, [null, 3, 2, 0, 1, 0], 2)
    expect(result.current.chartFrets).toEqual([null, 3, 2, 0, 1, 0])
    expect(result.current.chord.anglo).toBe('C')
  })

  it('picks an alternative name without losing the marks', () => {
    const { result } = setup()
    mark(result, [null, 0, 2, 2, 1, 3])
    const alternatives = result.current.detection!.candidates.map((candidate) => candidate.anglo)
    expect(alternatives.length).toBeGreaterThan(1)
    act(() => result.current.pickDetectedName(alternatives[1]))
    expect(result.current.chord.anglo).toBe(alternatives[1])
    expect(result.current.chartFrets).toEqual([null, 0, 2, 2, 1, 3])
  })

  it('typing a chord or choosing a position goes back to catalogue voicings', () => {
    const { result } = setup()
    mark(result, [null, 3, 2, 0, 1, 0])
    act(() => result.current.setChordInput('Em'))
    expect(result.current.chartSource).toBe('voicing')
    expect(result.current.chord.anglo).toBe('Em')
    mark(result, [0, 2, 2, 0, 0, 0])
    act(() => result.current.selectVoicing(1, false))
    expect(result.current.chartSource).toBe('voicing')
  })

  it('clears the marks', () => {
    const { result } = setup()
    mark(result, [null, 3, 2, 0, 1, 0])
    act(() => result.current.clearChartMarks())
    expect(result.current.chartFrets).toEqual([null, null, null, null, null, null])
    expect(result.current.detection?.candidates ?? []).toEqual([])
  })
})
