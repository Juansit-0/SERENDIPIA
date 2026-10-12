import type { StepVoicingRef } from '../music/stepVoicing'
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
