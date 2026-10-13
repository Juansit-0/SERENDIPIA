import { useState } from 'react'
import { useTuner } from '../../audio/useTuner'
import { tunerText } from '../../i18n/tuner'
import { LATIN_SHARP, PITCH_SHARP } from '../../music/notes'
import { readTuner, tuneAdvice } from '../../music/tuner'
import { TUNINGS } from '../../music/voicings'
import { useStore } from '../../state/store'

const SPAN = 50
const ARC = 62

/** Needle angle (degrees) for a deviation in cents, clamped to the gauge. */
const angleOf = (cents: number) => (Math.max(-SPAN, Math.min(SPAN, cents)) / SPAN) * ARC

function polar(angle: number, radius: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180
  return [100 + radius * Math.cos(rad), 104 + radius * Math.sin(rad)]
}

/** Chromatic tuner: microphone → nearest string, a needle in cents, and what to do with the peg. */
export function Tuner() {
  const { lang, notation, tuning, tuningId, setTuningId, playOpenString } = useStore()
  const x = tunerText[lang]
  const { status, frequency, start, stop } = useTuner()
  const [target, setTarget] = useState<number | null>(null)

  const noteName = (midi: number) => {
    const pc = ((midi % 12) + 12) % 12
    if (notation === 'latin') return LATIN_SHARP[pc]
    if (notation === 'anglo') return PITCH_SHARP[pc]
    return `${PITCH_SHARP[pc]} · ${LATIN_SHARP[pc]}`
  }

  const reading = frequency ? readTuner(frequency, tuning, target) : null
  const advice = reading ? tuneAdvice(reading.stringCents) : null
  const needle = reading ? angleOf(reading.stringCents) : 0

  const message =
    status === 'starting'
      ? x.starting
      : status === 'denied'
        ? x.denied
        : status === 'unsupported'
          ? x.unsupported
          : status === 'error'
            ? x.error
            : null

  return (
    <div className="cc-tuner w-[19rem]" data-advice={advice ?? 'none'}>
      <div className="cc-pop__row">
        <label className="cc-label cc-pop__title" htmlFor="tuner-tuning">
          {x.tuning}
        </label>
        <select id="tuner-tuning" className="cc-select" value={tuningId} onChange={(event) => setTuningId(event.target.value)}>
          {TUNINGS.map((item) => (
            <option key={item.id} value={item.id}>
              {x.tunings[item.id as keyof typeof x.tunings] ?? item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="cc-pop__row cc-tuner__dial">
        <svg viewBox="0 0 200 116" role="img" aria-label={reading ? `${x.gauge}: ${reading.stringCents} ${x.cents}` : x.gauge}>
          <path className="cc-tuner__zone" d={`M${polar(-ARC * 0.1, 86).join(' ')} A86 86 0 0 1 ${polar(ARC * 0.1, 86).join(' ')} L${polar(ARC * 0.1, 66).join(' ')} A66 66 0 0 0 ${polar(-ARC * 0.1, 66).join(' ')}Z`} />
          {Array.from({ length: 11 }, (_, i) => {
            const cents = -SPAN + i * 10
            const [x1, y1] = polar(angleOf(cents), cents === 0 ? 64 : 72)
            const [x2, y2] = polar(angleOf(cents), 86)
            return <line key={cents} className={cents === 0 ? 'cc-tuner__tick cc-tuner__tick--zero' : 'cc-tuner__tick'} x1={x1} y1={y1} x2={x2} y2={y2} />
          })}
          <text className="cc-tuner__scale" x={polar(-ARC, 96)[0]} y={polar(-ARC, 96)[1] + 4} textAnchor="middle">
            −
          </text>
          <text className="cc-tuner__scale" x={polar(ARC, 96)[0]} y={polar(ARC, 96)[1] + 4} textAnchor="middle">
            +
          </text>
          <g className="cc-tuner__needle" style={{ opacity: reading ? 1 : 0.35, transform: `rotate(${needle}deg)` }}>
            <line x1="100" y1="104" x2="100" y2="26" />
            <path transform="translate(100 26) scale(0.62)" d="M0,-9 Q1,-1 9,0 Q1,1 0,9 Q-1,1 -9,0 Q-1,-1 0,-9Z" />
          </g>
          <circle className="cc-tuner__hub" cx="100" cy="104" r="4" />
        </svg>
        <div className="cc-tuner__readout">
          <span className="cc-tuner__note">{reading ? noteName(reading.midi) : '—'}</span>
          <span className="cc-tuner__cents">
            {reading ? `${reading.stringCents > 0 ? '+' : reading.stringCents < 0 ? '−' : ''}${Math.abs(reading.stringCents)} ${x.cents}` : ' '}
          </span>
        </div>
        <p className="cc-tuner__advice" aria-live="polite">
          {advice === 'in-tune' ? x.inTune : advice === 'tighten' ? `${x.tighten} ↑` : advice === 'loosen' ? `${x.loosen} ↓` : status === 'listening' ? x.listen : ' '}
        </p>
      </div>

      <div className="cc-pop__row">
        <span className="cc-label cc-pop__title" title={x.stringsHint}>
          {x.strings} · {target === null ? x.auto : `${x.string} ${6 - target}`}
        </span>
        <div className="cc-tuner__strings" role="group" aria-label={x.strings}>
          {tuning.map((midi, index) => (
            <button
              key={index}
              type="button"
              className="cc-btn"
              aria-pressed={target === index}
              data-near={reading?.stringIndex === index ? 'true' : undefined}
              aria-label={`${x.string} ${6 - index}: ${noteName(midi)}`}
              title={x.stringsHint}
              onClick={() => {
                if (target === index) {
                  setTarget(null)
                  return
                }
                setTarget(index)
                playOpenString(index)
              }}
            >
              <small aria-hidden="true">{6 - index}</small>
              <span aria-hidden="true">{notation === 'latin' ? LATIN_SHARP[midi % 12] : PITCH_SHARP[midi % 12]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="cc-pop__row flex flex-col gap-2">
        {message && <p className="cc-tuner__message">{message}</p>}
        {status === 'listening' ? (
          <button type="button" className="cc-btn cc-btn--ghost w-full" onClick={stop}>
            {x.stop}
          </button>
        ) : (
          <button type="button" className="cc-btn cc-btn--primary w-full" disabled={status === 'starting' || status === 'unsupported'} onClick={() => void start()}>
            {x.start}
          </button>
        )}
      </div>
    </div>
  )
}
