import { isStrumId, type StrumId } from '../audio/strums'
import { MAX_CAPO } from '../music/capo'
import { parseChord } from '../music/parseChord'
import { isPlayableFrets, type StepVoicingSource } from '../music/stepVoicing'
import { BEAT_OPTIONS, TEMPO_MAX, TEMPO_MIN } from './settings'
import type { ProgressionStep } from './store'

export type SharedStep = Omit<ProgressionStep, 'id'>

export interface SharedProgression {
  steps: SharedStep[]
  tempo?: number
  beatsPerChord?: number
  capo?: number
  strum?: StrumId
}

/*
 * Compact, readable URL format:
 *   ?p=C_G:3-2-0-0-0-3_Am~folk_F/C&t=96&b=4&c=0&s=single
 * Each step is the chord symbol, optionally ":frets" (x for muted) and "~strum".
 */

function encodeStep(step: SharedStep): string {
  let token = step.anglo
  if (step.frets) token += `:${step.frets.map((fret) => (fret === null ? 'x' : String(fret))).join('-')}`
  if (step.strum) token += `~${step.strum}`
  return token
}

function decodeStep(token: string): SharedStep | null {
  const [beforeStrum, strumToken] = token.split('~')
  const [symbol, fretsToken] = beforeStrum.split(':')
  const chord = parseChord(symbol)
  if (!chord) return null
  const step: SharedStep = {
    rootPc: chord.rootPc,
    qualityId: chord.quality.id,
    anglo: chord.anglo,
    latin: chord.latin,
    bassPc: chord.bassPc,
  }
  if (fretsToken) {
    const frets = fretsToken.split('-').map((value) => (value === 'x' ? null : Number(value)))
    const valid = frets.length === 6 && frets.every((fret) => fret === null || (Number.isInteger(fret) && fret >= 0 && fret <= 24))
    if (valid && isPlayableFrets(frets)) {
      step.frets = frets
      step.voicingLabel = frets.map((fret) => (fret === null ? 'x' : fret)).join(' ')
      step.voicingSource = 'proof' satisfies StepVoicingSource
    }
  }
  if (isStrumId(strumToken)) step.strum = strumToken
  return step
}

export function encodeShare(shared: SharedProgression): string {
  const params = new URLSearchParams()
  params.set('p', shared.steps.map(encodeStep).join('_'))
  if (shared.tempo !== undefined) params.set('t', String(shared.tempo))
  if (shared.beatsPerChord !== undefined) params.set('b', String(shared.beatsPerChord))
  if (shared.capo !== undefined) params.set('c', String(shared.capo))
  if (shared.strum !== undefined) params.set('s', shared.strum)
  return params.toString()
}

export function decodeShare(search: string): SharedProgression | null {
  const params = new URLSearchParams(search)
  const raw = params.get('p')
  if (!raw) return null
  const steps = raw
    .split('_')
    .slice(0, 16)
    .map(decodeStep)
    .filter((step): step is SharedStep => step !== null)
  if (steps.length === 0) return null
  const shared: SharedProgression = { steps }
  const tempo = Number(params.get('t'))
  if (Number.isInteger(tempo) && tempo >= TEMPO_MIN && tempo <= TEMPO_MAX) shared.tempo = tempo
  const beats = Number(params.get('b'))
  if (BEAT_OPTIONS.includes(beats)) shared.beatsPerChord = beats
  const capoRaw = params.get('c')
  const capo = Number(capoRaw)
  if (capoRaw !== null && Number.isInteger(capo) && capo >= 0 && capo <= MAX_CAPO) shared.capo = capo
  const strum = params.get('s')
  if (isStrumId(strum)) shared.strum = strum
  return shared
}

export function shareUrl(shared: SharedProgression, location: { origin: string; pathname: string; hash: string }): string {
  return `${location.origin}${location.pathname}?${encodeShare(shared)}${location.hash}`
}
