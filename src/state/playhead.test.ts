import { describe, expect, it, vi } from 'vitest'
import { playhead } from './playhead'

describe('playhead', () => {
  it('notifies only on real changes', () => {
    playhead.reset()
    const listener = vi.fn()
    const unsubscribe = playhead.subscribe(listener)
    playhead.setStep(2)
    playhead.setStep(2)
    playhead.setBeat(5)
    expect(playhead.get()).toEqual({ step: 2, beat: 5 })
    expect(listener).toHaveBeenCalledTimes(2)
    playhead.reset()
    expect(playhead.get()).toEqual({ step: -1, beat: -1 })
    unsubscribe()
    playhead.setStep(1)
    expect(listener).toHaveBeenCalledTimes(3)
  })
})
