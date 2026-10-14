import { useMemo, useState } from 'react'
import { progressText } from '../../i18n/progress'
import { dayStreak, loadHistory, recentDays, totals, type Score } from '../../music/history'
import { useStore } from '../../state/store'

const DAYS = 28
const CHART_H = 140
const BAR_GAP = 2

/** Práctica → Progreso: streak, minutes per day over four weeks, and each chord pair's changes per minute. */
export function Progress() {
  const { lang } = useStore()
  const x = progressText[lang]
  // Read once on open: the history only grows from the other two sections.
  const [history] = useState(loadHistory)
  const days = useMemo(() => recentDays(history, DAYS), [history])
  const month = useMemo(() => recentDays(history, 30), [history])
  const sum = totals(history)
  const streak = dayStreak(history)
  const monthMinutes = Math.round(month.reduce((total, day) => total + day.minutes, 0))
  const pairs = Object.entries(history.pairs)
    .filter(([, scores]) => scores.length > 0)
    .sort((a, b) => b[1].at(-1)!.at.localeCompare(a[1].at(-1)!.at))
    .slice(0, 6)
  const [hover, setHover] = useState<number | null>(null)

  const dateLabel = (day: Date) => day.toLocaleDateString(lang === 'es' ? 'es' : 'en', { weekday: 'short', day: 'numeric', month: 'short' })
  const max = Math.max(5, ...days.map((day) => day.minutes))
  // A round ceiling for the one gridline.
  const ceiling = max <= 10 ? Math.ceil(max / 5) * 5 : Math.ceil(max / 10) * 10

  if (sum.minutes === 0 && sum.rounds === 0 && sum.earTotal === 0) {
    return (
      <section className="cc-module pg pg--empty">
        <h2 className="cc-label">{x.title}</h2>
        <p className="pg-empty">{x.empty}</p>
      </section>
    )
  }

  const tiles: Array<[string, string, string]> = [
    [x.streak, String(streak), x.days(streak)],
    [x.month, String(monthMinutes), x.minutes],
    [x.total, String(sum.minutes), x.minutes],
    [x.ear, sum.earTotal ? `${Math.round((sum.earRight / sum.earTotal) * 100)}%` : '—', sum.earTotal ? `${sum.earRight}/${sum.earTotal}` : x.earNone],
  ]

  return (
    <div className="pg flex flex-col gap-3 desk:min-h-0 desk:flex-1 desk:gap-2">
      <section className="cc-module pg-tiles" aria-label={x.title}>
        {tiles.map(([label, value, unit]) => (
          <div key={label} className="pg-tile">
            <span className="cc-label">{label}</span>
            <span className="pg-tile__value cc-num">
              {value} <small>{unit}</small>
            </span>
          </div>
        ))}
      </section>

      <div className="pg-main">
        <section className="cc-module pg-chart">
          <h3 className="cc-label">{x.chart}</h3>
          <div className="pg-plot">
            <svg viewBox={`0 0 ${DAYS * 10} ${CHART_H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <line className="pg-grid" x1="0" x2={DAYS * 10} y1="1" y2="1" vectorEffect="non-scaling-stroke" />
              <line className="pg-base" x1="0" x2={DAYS * 10} y1={CHART_H - 0.5} y2={CHART_H - 0.5} vectorEffect="non-scaling-stroke" />
              {days.map((day, index) => {
                const height = Math.max(3, (day.minutes / ceiling) * (CHART_H - 2))
                const x0 = index * 10 + BAR_GAP / 2
                return (
                  day.minutes > 0 && (
                    <path
                      key={day.date}
                      className={`pg-bar ${hover === index ? 'is-hover' : ''} ${index === DAYS - 1 ? 'is-today' : ''}`}
                      // Rounded data end, square at the baseline.
                      d={`M${x0},${CHART_H} V${CHART_H - height + 2} Q${x0},${CHART_H - height} ${x0 + 2},${CHART_H - height} H${x0 + 10 - BAR_GAP - 2} Q${x0 + 10 - BAR_GAP},${CHART_H - height} ${x0 + 10 - BAR_GAP},${CHART_H - height + 2} V${CHART_H} Z`}
                    />
                  )
                )
              })}
            </svg>
            <span className="pg-ceiling">
              {ceiling} {x.minutes}
            </span>
            {/* Hover targets are full-height columns, larger than the bars. */}
            <div className="pg-hits" onMouseLeave={() => setHover(null)}>
              {days.map((day, index) => (
                <span key={day.date} className="pg-hit" onMouseEnter={() => setHover(index)} />
              ))}
            </div>
            {hover !== null && (
              <div className="pg-tip" style={{ left: `${((hover + 0.5) / DAYS) * 100}%` }} role="status">
                <b>{dateLabel(days[hover].day)}</b>
                <span>
                  {days[hover].minutes} {x.minutes}
                </span>
              </div>
            )}
          </div>
          <div className="pg-axis" aria-hidden="true">
            {days.map((day, index) => (
              <span key={day.date}>{index === DAYS - 1 ? x.today : index % 7 === 0 ? day.day.getDate() : ''}</span>
            ))}
          </div>
          <table className="sr-only">
            <caption>{x.table}</caption>
            <thead>
              <tr>
                <th scope="col">{x.date}</th>
                <th scope="col">{x.minutes}</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.date}>
                  <th scope="row">{dateLabel(day.day)}</th>
                  <td>{day.minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="cc-module pg-pairs">
          <h3 className="cc-label">{x.pairs}</h3>
          {pairs.length === 0 ? (
            <p className="pg-empty">{x.pairsNone}</p>
          ) : (
            <ul>
              {pairs.map(([pair, scores]) => (
                <li key={pair}>
                  <span className="pg-pair">{pair.replace('↔', ' ↔ ')}</span>
                  <Sparkline scores={scores} />
                  <span className="pg-pair__nums cc-num">
                    <b>{scores.at(-1)!.score}</b> {x.last} · {Math.max(...scores.map((score) => score.score))} {x.best}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

/** A pair's last scores as one thin line, the latest one marked. */
function Sparkline({ scores }: { scores: Score[] }) {
  const values = scores.slice(-12).map((score) => score.score)
  const width = 96
  const height = 28
  const low = Math.min(...values)
  const high = Math.max(...values, low + 1)
  const point = (value: number, index: number) => [values.length === 1 ? width - 4 : 4 + (index / (values.length - 1)) * (width - 8), height - 4 - ((value - low) / (high - low)) * (height - 8)]
  const path = values.map((value, index) => `${index ? 'L' : 'M'}${point(value, index).join(',')}`).join(' ')
  const [lastX, lastY] = point(values.at(-1)!, values.length - 1)
  return (
    <svg className="pg-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      {values.length > 1 && <path d={path} />}
      <circle cx={lastX} cy={lastY} r="3.5" />
    </svg>
  )
}
