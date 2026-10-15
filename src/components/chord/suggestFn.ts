import { diatonicChords, type Mode } from '../../music/scales'

export type SuggestionFn = 'tonic' | 'subdominant' | 'dominant' | 'borrowed'

/** Harmonic function of a suggested chord in the key (anything outside the diatonic set reads as borrowed). */
export function suggestionFunction(suggestion: { rootPc: number; qualityId: string }, keyRootPc: number, keyMode: Mode): SuggestionFn {
  const degrees = [...diatonicChords(keyRootPc, keyMode, true), ...diatonicChords(keyRootPc, keyMode, false)]
  const exact = degrees.find((degree) => degree.rootPc === suggestion.rootPc && degree.qualityId === suggestion.qualityId)
  const byRoot = exact ?? degrees.find((degree) => degree.rootPc === suggestion.rootPc)
  if (!byRoot) return 'borrowed'
  if (!exact && !['maj', 'min'].includes(suggestion.qualityId) && !suggestion.qualityId.includes('7')) return 'borrowed'
  return byRoot.harmonicFunction
}

export const FN_VAR: Record<SuggestionFn, string> = {
  tonic: 'var(--cc-fn-tonic)',
  subdominant: 'var(--cc-fn-sub)',
  dominant: 'var(--cc-fn-dom)',
  borrowed: 'var(--cc-fn-borrowed)',
}
