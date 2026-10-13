import { useMemo, useState, type CSSProperties } from 'react'
import { scalesText } from '../../i18n/scales'
import { chordTones, qualityById } from '../../music/chords'
import { keyAccidental, latinName, pitchName } from '../../music/notes'
import { boardNotes, DEGREE_NAMES, defaultScale, scaleById, scalePositions, SCALES, type ScaleId } from '../../music/scaleBoard'
import { usePlayheadStep } from '../../state/playhead'
import { useStore } from '../../state/store'

const LAST_FRET = 15
const MARKERS = [3, 5, 7, 9, 12, 15]
const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e']

/**
 * The key's scale over the whole neck, by positions, with the notes of the chord being played filled in:
 * where to put the fingers to improvise over the progression.
 */
export function ScalesPanel() {
  const { keyRootPc, keyMode, tuning, lang, notation, chord, progression, playing, playNotes } = useStore()
  const x = scalesText[lang]
  const [scaleId, setScaleId] = useState<ScaleId>(() => defaultScale(keyMode))
  const [position, setPosition] = useState(-1)
  const [showNotes, setShowNotes] = useState(false)
  const activeStep = usePlayheadStep()

  const scale = scaleById(scaleId)
  const notes = useMemo(() => boardNotes(keyRootPc, scale.intervals, tuning, LAST_FRET), [keyRootPc, scale, tuning])
  const positions = useMemo(() => scalePositions(keyRootPc, scale.intervals, tuning), [keyRootPc, scale, tuning])
  const box = position >= 0 ? positions[position] : null

  // The chord to play over: the progression step under the playhead, or the Acorde view's chord.
  const step = playing && activeStep >= 0 ? progression[activeStep] : null
  const over = step
    ? { rootPc: step.rootPc, quality: qualityById(step.qualityId), anglo: step.anglo, latin: step.latin }
    : { rootPc: chord.rootPc, quality: chord.quality, anglo: chord.anglo, latin: chord.latin }
  const tones = new Set(chordTones(over.rootPc, over.quality))
  const outside = [...tones].filter((pc) => !notes.some((note) => note.pc === pc))

  const accidental = keyAccidental(keyRootPc, keyMode)
  const noteName = (pc: number) => (notation === 'latin' ? latinName(pc, accidental) : pitchName(pc, accidental))
  const rows = [...tuning.keys()].reverse()

  return (
    <section className="cc-module sv" aria-label={x.scales}>
      <div className="sv-controls">
        <div className="sv-control">
          <label className="cc-label" htmlFor="scale-select">
            {x.scale}
          </label>
          <select
            id="scale-select"
            className="cc-select sv-select"
            value={scaleId}
            onChange={(event) => {
              setScaleId(event.target.value as ScaleId)
              setPosition(-1)
            }}
          >
            {SCALES.map((item) => (
              <option key={item.id} value={item.id}>
                {lang === 'es' ? item.nameEs : item.nameEn}
              </option>
            ))}
          </select>
        </div>
        <div className="sv-control">
          <span className="cc-label">{x.position}</span>
          <div className="cc-seg" role="group" aria-label={x.position}>
            <button type="button" aria-pressed={position === -1} onClick={() => setPosition(-1)}>
              {x.all}
            </button>
            {positions.map((item, index) => (
              <button
                key={item.from}
                type="button"
                aria-pressed={position === index}
                aria-label={`${x.position} ${index + 1}, ${x.positionFret} ${item.from}`}
                onClick={() => setPosition(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="sv-control">
          <span className="cc-label">{x.labels}</span>
          <div className="cc-seg" role="group" aria-label={x.labels}>
            <button type="button" aria-pressed={!showNotes} onClick={() => setShowNotes(false)}>
              {x.degrees}
            </button>
            <button type="button" aria-pressed={showNotes} onClick={() => setShowNotes(true)}>
              {x.notes}
            </button>
          </div>
        </div>
        <p className="sv-over" aria-live="polite">
          {x.over} <b>{notation === 'latin' ? over.latin : over.anglo}</b>: {x.overHint}
          {outside.length > 0 && (
            <span className="sv-outside">
              {' '}
              ({outside.map(noteName).join(', ')} {x.outside})
            </span>
          )}
        </p>
      </div>

      <div
        className="sv-board"
        role="group"
        aria-label={`${x.board}: ${noteName(keyRootPc)} ${lang === 'es' ? scale.nameEs : scale.nameEn}`}
        style={{ '--frets': LAST_FRET + 1 } as CSSProperties}
      >
        <span className="sv-corner" aria-hidden="true" />
        {Array.from({ length: LAST_FRET + 1 }, (_, fret) => (
          <span key={`n${fret}`} className={`sv-fretnum ${MARKERS.includes(fret) ? 'is-marker' : ''}`} aria-hidden="true">
            {fret}
          </span>
        ))}
        {rows.map((string) => (
          <div key={string} className="sv-row">
            <span className="sv-string-name" aria-hidden="true">
              {STRING_NAMES[string]}
            </span>
            {Array.from({ length: LAST_FRET + 1 }, (_, fret) => {
              const note = notes.find((item) => item.string === string && item.fret === fret)
              const dim = box && (fret < box.from || fret > box.to)
              return (
                <span key={fret} className={`sv-cell ${fret === 0 ? 'is-open' : ''} ${box && !dim ? 'in-box' : ''}`}>
                  {note && (
                    <button
                      type="button"
                      className={`sv-dot ${note.degree === 0 ? 'is-root' : ''} ${tones.has(note.pc) ? 'is-chord' : ''} ${dim ? 'is-dim' : ''}`}
                      aria-label={`${x.play} ${noteName(note.pc)} (${DEGREE_NAMES[note.degree]}), ${STRING_NAMES[string]} ${fret}`}
                      onClick={() => playNotes([note.midi])}
                    >
                      {showNotes ? noteName(note.pc) : DEGREE_NAMES[note.degree]}
                    </button>
                  )}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <p className="sv-hint">{x.hint}</p>
    </section>
  )
}
