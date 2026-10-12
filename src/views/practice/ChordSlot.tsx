import { MiniPlate } from '../../components/MiniPlate'
import { voicingLabel } from '../../music/stepVoicing'

interface Props {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  name: string | null
  frets: (number | null)[] | null
  disabled: boolean
  playing: boolean
  playingLabel: string
  invalidLabel: string
}

export function ChordSlot({ id, label, value, onChange, name, frets, disabled, playing, playingLabel, invalidLabel }: Props) {
  const valid = Boolean(name && frets)
  return (
    <div className="cc-module pv-slot" data-playing={playing || undefined}>
      <div className="pv-slot__head">
        <label className="cc-label" htmlFor={id}>
          {label}
        </label>
        {playing && <span className="pv-slot__now cc-chip">{playingLabel}</span>}
      </div>
      <input
        id={id}
        className="pv-field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={!valid}
      />
      {valid && name && frets ? (
        <div className="pv-slot__body">
          <MiniPlate frets={frets} className="pv-plate" />
          <div className="pv-slot__text">
            <span className="pv-slot__name" style={{ ['--chars' as string]: name.length }}>
              {name}
            </span>
            <span className="pv-slot__shape cc-num">{voicingLabel(frets)}</span>
          </div>
        </div>
      ) : (
        <span className="pv-slot__error" role="alert">
          {invalidLabel}
        </span>
      )}
    </div>
  )
}
