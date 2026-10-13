import { usePlayheadBeat } from '../../state/playhead'

// Lunar phases new → crescent → half → full, in the bar's ink by day and night.
const NIGHT_PHASES = [
  null,
  'M0,-9 A9,9 0 0 1 0,9 A5,9 0 0 0 0,-9Z',
  'M0,-9 A9,9 0 0 1 0,9Z',
  'M0,-9 A9,9 0 1 1 0,9 A9,9 0 1 1 0,-9Z',
]

export function BeatMoons({ label }: { label: string }) {
  const beat = usePlayheadBeat()
  const current = beat < 0 ? -1 : beat % 4
  return (
    <span className="cc-moons" role="img" aria-label={label} data-current={current}>
      {[0, 1, 2, 3].map((index) => {
        return (
          <span key={index} data-cur={current === index} className="inline-flex">
            <svg width="22" height="22" viewBox="-13 -13 26 26" style={{ overflow: 'visible' }} aria-hidden="true" focusable="false">
              <circle className="ring" r="12" fill="none" stroke="currentColor" strokeWidth="1.1" strokeOpacity=".85" />
              <circle r="9" fill="none" stroke="currentColor" strokeWidth="1.3" />
              {NIGHT_PHASES[index] && <path d={NIGHT_PHASES[index]} fill="currentColor" />}
            </svg>
          </span>
        )
      })}
    </span>
  )
}
