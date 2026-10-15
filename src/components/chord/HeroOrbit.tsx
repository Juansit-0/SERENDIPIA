import { useEffect, useState, type RefObject } from 'react'

interface Geometry {
  w: number
  h: number
  cx: number
  cy: number
  rx: number
  ry: number
}

const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${(cx - rx).toFixed(1)},${cy.toFixed(1)} A${rx.toFixed(1)},${ry.toFixed(1)} 0 1 1 ${(cx + rx).toFixed(1)},${cy.toFixed(1)} A${rx.toFixed(1)},${ry.toFixed(1)} 0 1 1 ${(cx - rx).toFixed(1)},${cy.toFixed(1)}`

/**
 * The long oval of the hero, drawn in real pixels so it stays an even line at any width and tall enough that the
 * name sits inside it instead of being crossed by it. It draws itself again for every new chord (`name` keys it),
 * sways slowly, and a small star travels around it.
 */
export function HeroOrbit({ box, name }: { box: RefObject<HTMLElement | null>; name: string }) {
  const [g, setG] = useState<Geometry | null>(null)
  const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // After commit (not layout): the parent's ref is attached only once its children's layout effects have run.
  useEffect(() => {
    const host = box.current
    if (!host || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const { width: w, height: h } = host.getBoundingClientRect()
      if (w === 0) return setG(null)
      setG({ w, h, cx: w / 2, cy: h / 2, rx: w / 2 - 10, ry: h / 2 - 6 })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [box])

  if (!g) return null
  const outer = ellipse(g.cx, g.cy, g.rx, g.ry)
  const inner = ellipse(g.cx, g.cy + 2, g.rx * 0.965, g.ry * 0.8)

  return (
    <svg key={name} className="cv-orbit" viewBox={`0 0 ${g.w} ${g.h}`} aria-hidden="true" focusable="false">
      <g className="cv-orbit-sway" style={{ transformOrigin: `${g.cx}px ${g.cy}px` }}>
        <path className="cv-orbit-a" d={outer} pathLength={1} />
        <path className="cv-orbit-b" d={inner} pathLength={1} />
        {!still && (
          <g className="cv-orbit-star">
            <path d="M0,-7 Q1,-1 7,0 Q1,1 0,7 Q-1,1 -7,0 Q-1,-1 0,-7Z" />
            <animateMotion dur="18s" repeatCount="indefinite" rotate="0" path={outer} />
          </g>
        )}
      </g>
    </svg>
  )
}
