import { transposeLabels } from '../music/capo'
import { isPlayableFrets, voicingLabel, type StepVoicingRef } from '../music/stepVoicing'
import type { ProgressionStep } from './store'

export const MAX_STEPS = 16

export function appendStep(steps: ProgressionStep[], step: Omit<ProgressionStep, 'id'>, id: string): ProgressionStep[] {
  if (steps.length >= MAX_STEPS) return steps
  return [...steps, { ...step, id }]
}

export function applyStepVoicing(steps: ProgressionStep[], index: number, voicing: StepVoicingRef | null): ProgressionStep[] {
  return steps.map((step, position) =>
    position === index
      ? { ...step, frets: voicing?.frets ?? null, voicingLabel: voicing?.label, voicingSource: voicing?.source }
      : step,
  )
}

export function removeStep(steps: ProgressionStep[], index: number): ProgressionStep[] {
  return steps.filter((_, position) => position !== index)
}

export function toggleDetectorFret(
  frets: (number | null)[],
  stringIndex: number,
  soundingFret: number,
  capo: number,
): (number | null)[] {
  const next = [...frets]
  next[stringIndex] = soundingFret < 0 ? null : Math.max(0, soundingFret - capo)
  return next
}

export function stepId(prefix = 'step'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const mod12 = (value: number) => ((value % 12) + 12) % 12

/** The shortest move between two keys: −5 … +6 semitones. */
export function shortestShift(fromPc: number, toPc: number): number {
  const up = mod12(toPc - fromPc)
  return up > 6 ? up - 12 : up
}

/**
 * Moves every chord by `semitones`. A movable shape (no open strings) slides up or down the neck when it still
 * fits; an open-position shape does not survive a move, so that step goes back to the automatic position.
 */
export function transposeSteps(steps: ProgressionStep[], semitones: number): ProgressionStep[] {
  if (semitones === 0) return steps
  return steps.map((step) => {
    const bassPc = step.bassPc ?? null
    const labels = transposeLabels(step.rootPc, step.qualityId, bassPc, semitones)
    const moved: ProgressionStep = {
      ...step,
      rootPc: mod12(step.rootPc + semitones),
      bassPc: bassPc === null ? step.bassPc : mod12(bassPc + semitones),
      anglo: labels.anglo,
      latin: labels.latin,
    }
    if (!step.frets) return moved
    const movable = !step.frets.includes(0)
    const shifted = step.frets.map((fret) => (fret === null ? null : fret + semitones))
    if (movable && isPlayableFrets(shifted) && shifted.every((fret) => fret === null || (fret >= 1 && fret <= 15))) {
      return { ...moved, frets: shifted, voicingLabel: voicingLabel(shifted) }
    }
    return { ...moved, frets: null, voicingLabel: undefined, voicingSource: undefined }
  })
}
