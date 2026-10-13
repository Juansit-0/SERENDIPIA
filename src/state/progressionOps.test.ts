import { describe, expect, it } from 'vitest'
import { MAX_STEPS, appendStep, applyStepVoicing, removeStep, shortestShift, toggleDetectorFret, transposeSteps } from './progressionOps'
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

describe('transposeSteps', () => {
  const step = (rootPc: number, qualityId: ProgressionStep['qualityId'], extra: Partial<ProgressionStep> = {}): ProgressionStep => ({
    id: `s${rootPc}`,
    rootPc,
    qualityId,
    anglo: '',
    latin: '',
    ...extra,
  })

  it('renames every chord, slash basses included', () => {
    const moved = transposeSteps([step(0, 'maj'), step(9, 'm7'), step(0, 'maj', { bassPc: 4 })], 2)
    expect(moved.map((s) => s.anglo)).toEqual(['D', 'Bm7', 'D/F#'])
    expect(moved.map((s) => s.latin)).toEqual(['Re', 'Si m7', 'Re/Fa#'])
  })

  it('slides a barre shape along the neck and resets an open one', () => {
    const [barre, open] = transposeSteps(
      [
        step(5, 'maj', { frets: [1, 3, 3, 2, 1, 1], voicingSource: 'marked' }),
        step(0, 'maj', { frets: [null, 3, 2, 0, 1, 0], voicingSource: 'marked' }),
      ],
      2,
    )
    expect(barre.frets).toEqual([3, 5, 5, 4, 3, 3])
    expect(barre.voicingSource).toBe('marked')
    expect(open.frets).toBeNull()
    expect(open.voicingSource).toBeUndefined()
  })

  it('a barre shape that would leave the neck goes back to automatic', () => {
    const [moved] = transposeSteps([step(5, 'maj', { frets: [1, 3, 3, 2, 1, 1] })], -2)
    expect(moved.frets).toBeNull()
    expect(moved.anglo).toBe('Eb')
  })

  it('takes the shortest way to another key', () => {
    expect(shortestShift(0, 2)).toBe(2)
    expect(shortestShift(0, 10)).toBe(-2)
    expect(shortestShift(9, 4)).toBe(-5)
    expect(shortestShift(0, 6)).toBe(6)
  })
})
