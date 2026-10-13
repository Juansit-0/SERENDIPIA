// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { decodeShare } from './share'
import { loadSessionSteps, saveSessionSteps } from './session'

describe('session progression', () => {
  beforeEach(() => localStorage.clear())

  it('is null on a first visit', () => {
    expect(loadSessionSteps()).toBeNull()
  })

  it('keeps the steps between visits, including an empty progression', () => {
    saveSessionSteps(decodeShare('p=Am_F:1-3-3-2-1-1_C')!.steps)
    expect(loadSessionSteps()!.map((step) => step.anglo)).toEqual(['Am', 'F', 'C'])
    expect(loadSessionSteps()![1].frets).toEqual([1, 3, 3, 2, 1, 1])
    saveSessionSteps([])
    expect(loadSessionSteps()).toEqual([])
  })
})
