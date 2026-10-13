import { PlusIcon } from '../../components/icons'
import type { DiatonicChord } from '../../music/scales'

interface Props {
  degree: DiatonicChord
  name: string
  gloss: string
  functionLabel: string
  current: boolean
  addLabel: string
  onSelect: () => void
  onAdd: () => void
}

const FN_KEY = { tonic: 'tonic', subdominant: 'sub', dominant: 'dom' } as const

export function DegreeCard({ degree, name, gloss, functionLabel, current, addLabel, onSelect, onAdd }: Props) {
  return (
    <li className="tv-card" data-fn={FN_KEY[degree.harmonicFunction]} data-current={current || undefined}>
      <button type="button" className="tv-card__main" aria-pressed={current} aria-label={`${degree.roman} ${name}`} onClick={onSelect}>
        <span className="tv-card__roman cc-num">{degree.roman}</span>
        <span key={name} className="tv-card__name" style={{ ['--chars' as string]: name.length }}>
          {name}
        </span>
        <span className="tv-card__fn">{functionLabel}</span>
        <span className="tv-card__gloss cc-gloss">{gloss}</span>
      </button>
      <button type="button" className="cc-btn cc-btn--icon tv-card__add" aria-label={addLabel} title={addLabel} onClick={onAdd}>
        <PlusIcon size={18} />
      </button>
    </li>
  )
}
