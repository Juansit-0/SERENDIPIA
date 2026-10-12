import { describe, expect, it } from 'vitest'
import { MAX_STEPS, appendStep, applyStepVoicing, removeStep, toggleDetectorFret } from './progressionOps'
import type { ProgressionStep } from './store'

const step = (id: string): ProgressionStep => ({ id, rootPc: 0, qualityId: 'maj', anglo: 'C', latin: 'Do' })
const { id: _omit, ...newStep } = step('x')

describe('progression operations', () => {
  it('appends until the sixteen-step limit', () => {
    let steps: ProgressionStep[] = []
    for (let index = 0; index < MAX_STEPS + 3; index += 1) steps = appendStep(steps, newStep, `s${index}`)
    expect(steps).toHaveLength(MAX_STEPS)
    expect(steps.at(-1)?.id).toBe(`s${MAX_STEPS - 1}`)
  })

  it('sets and clears the voicing of one step only', () => {
    const steps = [step('a'), step('b')]
    const set = applyStepVoicing(steps, 1, { frets: [null, 3, 2, 0, 1, 0], label: 'x32010', source: 'proof' })
    expect(set[0]).toBe(steps[0])
    expect(set[1].frets).toEqual([null, 3, 2, 0, 1, 0])
    expect(set[1].voicingSource).toBe('proof')
    const cleared = applyStepVoicing(set, 1, null)
    expect(cleared[1].frets).toBeNull()
    expect(cleared[1].voicingSource).toBeUndefined()
  })

  it('removes by position', () => {
    expect(removeStep([step('a'), step('b'), step('c')], 1).map((item) => item.id)).toEqual(['a', 'c'])
  })
})

describe('toggleDetectorFret', () => {
  it('stores frets relative to the capo', () => {
    expect(toggleDetectorFret([0, 0, 0, 0, 0, 0], 2, 5, 3)).toEqual([0, 0, 2, 0, 0, 0])
  })

  it('treats a tap at or below the capo as the open string', () => {
    expect(toggleDetectorFret([0, 0, 0, 0, 0, 0], 0, 2, 3)).toEqual([0, 0, 0, 0, 0, 0])
  })

  it('mutes the string on a negative fret without mutating the input', () => {
    const input = [0, 0, 0, 0, 0, 0]
    expect(toggleDetectorFret(input, 5, -1, 0)).toEqual([0, 0, 0, 0, 0, null])
    expect(input).toEqual([0, 0, 0, 0, 0, 0])
  })
})
