import { chordText } from '../../i18n/chord'
import { stringLabels } from '../../music/voicings'
import { StepGrid } from '../StepGrid'
import { NoteMark } from './NoteMark'
import type { NoteRole } from './roles'
import type { ChordModel } from './useChordModel'

const LEGEND: { role: NoteRole; key: 'root' | 'third' | 'seventh' | 'extension' | 'other'; interval: string }[] = [
  { role: 'root', key: 'root', interval: '1' },
  { role: 'third', key: 'third', interval: '3' },
  { role: 'seventh', key: 'seventh', interval: '7' },
  { role: 'extension', key: 'extension', interval: '9 · 13' },
  { role: 'other', key: 'other', interval: '' },
]

/** THE fretboard: one interactive 12-fret sky chart; marks drawn by role, ripples around the root. */
export function Fretboard({ m, onToggle }: { m: ChordModel; onToggle: (stringIndex: number, fret: number) => void }) {
  const c = chordText[m.lang]
  const stale = m.chordError && m.chartSource === 'voicing'

  return (
    <section className="cc-module cv-chart" aria-label={c.chartLabel}>
      <header className="cv-chart-head">
        <h2 className="cc-label">{c.chartLabel}</h2>
        <span className="cv-chart-cap">
          {m.capo > 0 && <b>{`${c.capo} ${m.capo} · `}</b>}
          {m.capo > 0 ? c.absoluteCapo : c.absolute}
        </span>
        <button
          type="button"
          className="cc-btn cc-btn--ghost cv-clear"
          onClick={m.clearChartMarks}
          disabled={m.chartSource === 'marks' && m.marksCount === 0}
        >
          {c.clearMarks}
        </button>
      </header>

      <div className="cv-chart-body">
        <div className="cv-chart-scroll">
          <StepGrid
            frets={m.chartFrets}
            tuning={m.soundingTuning}
            stringLabels={stringLabels(m.tuning)}
            accidental="sharp"
            windowStart={1}
            windowSize={12}
            capo={m.capo}
            interactive
            onToggle={onToggle}
            showNotes
            noteNames={m.noteNames}
            roles={m.roles}
            label={c.chartAria}
            stale={stale}
            fill
          />
        </div>
      </div>

      <ul className="cv-legend" aria-label={c.roles}>
        {LEGEND.map((item) => (
          <li key={item.role}>
            <NoteMark role={item.role} className="cv-legend-mark" />
            <span>{c[item.key]}</span>
            {item.interval && <span className="cv-legend-int cc-num">{item.interval}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
