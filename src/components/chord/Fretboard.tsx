import { chordText } from '../../i18n/chord'
import { stringLabels } from '../../music/voicings'
import { StepGrid } from '../StepGrid'
import type { ChordModel } from './useChordModel'


/** THE fretboard: one interactive 12-fret sky chart; marks drawn by role, ripples around the root. */
export function Fretboard({ m, onToggle }: { m: ChordModel; onToggle: (stringIndex: number, fret: number) => void }) {
  const c = chordText[m.lang]
  const stale = m.chordError && m.chartSource === 'voicing'

  return (
    <section className="cc-module cv-chart" aria-label={c.chartLabel}>
      <header className="cv-chart-head">
        <h2 className="cc-label">{c.chartLabel}</h2>
        {m.capo > 0 && (
          <span className="cv-chart-cap">
            <b>{`${c.capo} ${m.capo}`}</b>
          </span>
        )}
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

    </section>
  )
}
