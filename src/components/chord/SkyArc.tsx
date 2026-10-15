import { usePlayheadBeat } from '../../state/playhead'
import { useTheme } from '../../state/theme'

/** Eight bodies over two bars: one per beat. */
export const ARC_BODIES = 8
const WIDTH = 1000
const HORIZON = 84
const PEAK = 20
const R = 14

/** Where the i-th body sits on the arc (a half ellipse from horizon to horizon). */
export function arcPoint(index: number): { x: number; y: number } {
  const t = (index + 0.5) / ARC_BODIES
  return { x: 48 + (WIDTH - 96) * t, y: HORIZON - (HORIZON - PEAK) * Math.sin(Math.PI * t) }
}

/** The lit part of the moon at phase `k` of 8 (0 new, 4 full): waxing lights the right, waning the left. */
export function moonPath(k: number, r = R - 2): string | null {
  const phase = ((k % 8) + 8) % 8
  if (phase === 0) return null
  if (phase === 4) return `M0,${-r} A${r},${r} 0 1 1 0,${r} A${r},${r} 0 1 1 0,${-r}Z`
  const waxing = phase < 4
  const crescent = phase === 1 || phase === 7
  const rx = (r * Math.abs(Math.cos((phase * Math.PI) / 4))).toFixed(2)
  const edge = waxing ? 1 : 0
  // The terminator bulges toward the lit side for a crescent and away from it when gibbous.
  const terminator = crescent === waxing ? 0 : 1
  return `M0,${-r} A${r},${r} 0 0 ${edge} 0,${r} A${rx},${r} 0 0 ${terminator} 0,${-r}Z`
}

const ARC = (() => {
  const steps = 48
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    return `${(24 + (WIDTH - 48) * t).toFixed(1)},${(HORIZON - (HORIZON - PEAK + 4) * Math.sin(Math.PI * t)).toFixed(1)}`
  })
  return `M${points.join(' L')}`
})()

/**
 * The sky over the fretboard: moons by night, suns by day, crossing from horizon to horizon. While something plays,
 * the body of the current beat lights up and the trail follows it; when quiet, the sky breathes.
 */
export function SkyArc() {
  const { theme } = useTheme()
  const beat = usePlayheadBeat()
  const playing = beat >= 0
  const current = playing ? beat % ARC_BODIES : -1
  const night = theme === 'night'

  return (
    <div className={`cv-arc ${playing ? 'is-playing' : ''}`} aria-hidden="true" data-current={current}>
      <svg viewBox={`0 0 ${WIDTH} 100`} preserveAspectRatio="xMidYMid meet" focusable="false">
        <path className="cv-arc-horizon" d={`M8,${HORIZON + 8} H${WIDTH - 8}`} />
        <path className="cv-arc-path" d={ARC} />
        <path className="cv-arc-trail" d={ARC} pathLength={1} style={{ strokeDashoffset: playing ? 1 - (current + 1) / ARC_BODIES : 1 }} />
        {Array.from({ length: ARC_BODIES }, (_, index) => {
          const { x, y } = arcPoint(index)
          const now = index === current
          return (
            <g
              key={index}
              className={`cv-arc-body ${now ? 'is-now' : ''} ${playing && index < current ? 'is-past' : ''}`}
              transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
              style={{ ['--i' as string]: index }}
            >
              <g className="cv-arc-inner">
                {/* Re-keyed every beat so the halo pulse replays. */}
                {now && <circle key={beat} className="cv-arc-halo" r={R + 4} />}
                {night ? <Moon phase={index} /> : <Sun index={index} />}
              </g>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function Moon({ phase }: { phase: number }) {
  const lit = moonPath(phase)
  return (
    <>
      <circle className="cv-arc-disc" r={R - 2} />
      {lit && <path className="cv-arc-lit" d={lit} />}
      <circle className="cv-arc-rim" r={R - 2} />
    </>
  )
}

/** The sun: its rays grow toward noon (the top of the arc) and shrink at dawn and dusk. */
function Sun({ index }: { index: number }) {
  const strength = Math.sin((Math.PI * (index + 0.5)) / ARC_BODIES)
  const inner = 9
  const outer = inner + 2.5 + 6 * strength
  return (
    <>
      <g className="cv-arc-rays">
        {Array.from({ length: 8 }, (_, ray) => {
          const angle = (ray * Math.PI) / 4
          const [cos, sin] = [Math.cos(angle), Math.sin(angle)]
          return (
            <line
              key={ray}
              x1={(cos * inner).toFixed(2)}
              y1={(sin * inner).toFixed(2)}
              x2={(cos * outer).toFixed(2)}
              y2={(sin * outer).toFixed(2)}
            />
          )
        })}
      </g>
      <circle className="cv-arc-lit" r={7} />
      <circle className="cv-arc-rim" r={7} />
    </>
  )
}
