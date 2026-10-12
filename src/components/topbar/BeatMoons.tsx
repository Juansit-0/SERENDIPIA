import { usePlayheadBeat } from '../../state/playhead'
import type { Theme } from '../../state/theme'

// Lunar phases new → crescent → half → full; by day a sun travelling an arc.
const NIGHT_PHASES = [
  null,
  'M0,-9 A9,9 0 0 1 0,9 A5,9 0 0 0 0,-9Z',
  'M0,-9 A9,9 0 0 1 0,9Z',
  'M0,-9 A9,9 0 1 1 0,9 A9,9 0 1 1 0,-9Z',
]
const SUN_ANGLES = [180, 120, 60, 0]

export function BeatMoons({ theme, label }: { theme: Theme; label: string }) {
  const beat = usePlayheadBeat()
  const current = beat < 0 ? -1 : beat % 4
  return (
    <span className="cc-moons" role="img" aria-label={label} data-current={current}>
      {[0, 1, 2, 3].map((index) => {
        const rad = (SUN_ANGLES[index] * Math.PI) / 180
        return (
          <span key={index} data-cur={current === index} className="inline-flex">
            <svg width="22" height="22" viewBox="-13 -13 26 26" style={{ overflow: 'visible' }} aria-hidden="true" focusable="false">
              <circle className="ring" r="12" fill="none" stroke="currentColor" strokeWidth="1.1" strokeOpacity=".85" />
              <circle r="9" fill="none" stroke="currentColor" strokeWidth="1.3" />
              {theme === 'night' ? (
                NIGHT_PHASES[index] && <path d={NIGHT_PHASES[index]} fill="currentColor" />
              ) : (
                <>
                  <path d="M-9,0H9" stroke="currentColor" strokeWidth="1" strokeOpacity=".6" />
                  <circle
                    cx={(8.8 * Math.cos(rad)).toFixed(2)}
                    cy={(-8.8 * Math.sin(rad)).toFixed(2)}
                    r="3"
                    fill="#40e0d0"
                    stroke="currentColor"
                    strokeWidth="1.1"
                  />
                </>
              )}
            </svg>
          </span>
        )
      })}
    </span>
  )
}
