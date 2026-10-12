import { qualityById, type QualityId } from './chords'
import { MAX_CAPO, transposeLabels } from './capo'
import { STANDARD_TUNING, voicingsFor, type Voicing } from './voicings'

export interface PlayableStep {
  rootPc: number
  qualityId: QualityId
  bassPc?: number | null
}

const CANDIDATES = 8
const DIFFICULTY_COST = { easy: 0, medium: 1.2, hard: 2.6 } as const

/** Where the hand sits: the average fretted position, or 0 for open shapes. */
export function handPosition(frets: (number | null)[]): number {
  const fretted = frets.filter((fret): fret is number => fret !== null && fret > 0)
  if (fretted.length === 0) return 0
  return fretted.reduce((sum, fret) => sum + fret, 0) / fretted.length
}

/** How much the fretting hand has to change between two shapes. */
export function movementCost(a: (number | null)[], b: (number | null)[]): number {
  const shift = Math.abs(handPosition(a) - handPosition(b))
  let changedStrings = 0
  let heldFingers = 0
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) changedStrings += 1
    else if (a[index] !== null && a[index]! > 0) heldFingers += 1
  }
  return shift * 1.5 + changedStrings * 0.35 - heldFingers * 0.4
}

// The dictionary score already rewards root-position, common and open shapes;
// convert the gap to the best shape into a cost so the chain keeps good shapes.
function shapeCost(voicing: Voicing, best: Voicing): number {
  return DIFFICULTY_COST[voicing.difficulty] + (best.score - voicing.score) * 0.08
}

function candidatesFor(step: PlayableStep, tuning: number[]): Voicing[] {
  return voicingsFor(step.rootPc, qualityById(step.qualityId), tuning, {
    limit: CANDIDATES,
    bassPc: step.bassPc ?? null,
  })
}

/**
 * Picks one voicing per step so the whole progression flows with the least hand
 * movement (Viterbi over each step's best shapes). Steps with no playable shape get null.
 */
export function chainVoicings(steps: PlayableStep[], tuning: number[] = STANDARD_TUNING): Array<(number | null)[] | null> {
  const options = steps.map((step) => candidatesFor(step, tuning))
  const cost: number[][] = []
  const from: number[][] = []

  options.forEach((candidates, stepIndex) => {
    cost[stepIndex] = []
    from[stepIndex] = []
    candidates.forEach((voicing, index) => {
      const own = shapeCost(voicing, candidates[0])
      const previous = stepIndex > 0 ? options[stepIndex - 1] : []
      if (previous.length === 0) {
        // First step, or the previous step had no playable shape: start a fresh chain.
        cost[stepIndex][index] = own
        from[stepIndex][index] = -1
        return
      }
      let best = Infinity
      let bestFrom = -1
      previous.forEach((prior, priorIndex) => {
        const total = cost[stepIndex - 1][priorIndex] + movementCost(prior.frets, voicing.frets)
        if (total < best) {
          best = total
          bestFrom = priorIndex
        }
      })
      cost[stepIndex][index] = best + own
      from[stepIndex][index] = bestFrom
    })
  })

  const result: Array<(number | null)[] | null> = steps.map(() => null)
  let pick = -1
  for (let stepIndex = options.length - 1; stepIndex >= 0; stepIndex -= 1) {
    const candidates = options[stepIndex]
    if (candidates.length === 0) {
      pick = -1
      continue
    }
    if (pick < 0) pick = cost[stepIndex].indexOf(Math.min(...cost[stepIndex]))
    result[stepIndex] = candidates[pick].frets
    pick = from[stepIndex][pick]
  }
  return result
}

/** Total hand movement along a sequence of shapes (lower is smoother). */
export function totalMovement(shapes: Array<(number | null)[] | null>): number {
  let total = 0
  for (let index = 1; index < shapes.length; index += 1) {
    const a = shapes[index - 1]
    const b = shapes[index]
    if (a && b) total += movementCost(a, b)
  }
  return total
}

// ---------------------------------------------------------------------------
// Capo recommendation

export interface CapoOption {
  capo: number
  /** Effort score: lower is easier. */
  effort: number
  shapes: Array<{ rootPc: number; qualityId: QualityId; bassPc: number | null; anglo: string; latin: string }>
}

// Effort of the easiest shape a guitarist would really use: the curated shapes when the
// chord has them (so F counts as xx3211, not the full barre), else the two best-scored ones.
function stepEffort(step: PlayableStep, tuning: number[]): number {
  const candidates = candidatesFor(step, tuning)
  if (candidates.length === 0) return 4
  const curated = candidates.filter((voicing) => voicing.source === 'common')
  const realistic = curated.length > 0 ? curated : candidates.slice(0, 2)
  return Math.min(
    ...realistic.map((voicing) => {
      // A two-string mini barre still counts as an open shape.
      const open = voicing.baseFret <= 3 && (!voicing.barre || voicing.barre.to - voicing.barre.from <= 1)
      return DIFFICULTY_COST[voicing.difficulty] + (open ? 0 : 1.2)
    }),
  )
}

const mod12 = (value: number) => ((value % 12) + 12) % 12

/**
 * Tries every capo position for the progression as it sounds now and ranks them
 * by how easy the resulting shapes are. Steps are shape chords played with `currentCapo`.
 */
export function capoOptions(steps: PlayableStep[], currentCapo: number, tuning: number[] = STANDARD_TUNING): CapoOption[] {
  const options: CapoOption[] = []
  for (let capo = 0; capo <= MAX_CAPO; capo += 1) {
    const shift = currentCapo - capo
    const shapes = steps.map((step) => {
      const bassPc = step.bassPc ?? null
      const labels = transposeLabels(step.rootPc, step.qualityId, bassPc, shift)
      return {
        rootPc: mod12(step.rootPc + shift),
        qualityId: step.qualityId,
        bassPc: bassPc === null ? null : mod12(bassPc + shift),
        anglo: labels.anglo,
        latin: labels.latin,
      }
    })
    const effort = shapes.reduce((sum, shape) => sum + stepEffort(shape, tuning), 0) + capo * 0.15
    options.push({ capo, effort, shapes })
  }
  return options.sort((a, b) => a.effort - b.effort)
}

/** The best capo if it is clearly easier than the current one, otherwise null. */
export function recommendCapo(steps: PlayableStep[], currentCapo: number, tuning: number[] = STANDARD_TUNING): CapoOption | null {
  if (steps.length === 0) return null
  const options = capoOptions(steps, currentCapo, tuning)
  const current = options.find((option) => option.capo === currentCapo)!
  const best = options[0]
  if (best.capo === currentCapo) return null
  return current.effort - best.effort >= 1.5 ? best : null
}
