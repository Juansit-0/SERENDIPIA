import type { Theme } from '../../state/theme'

/** Compass-star mark: it holds a moon at night and a sun by day. */
export function BrandMark({ theme, size = 30 }: { theme: Theme; size?: number }) {
  const sunRays = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <svg width={size} height={size} viewBox="-16 -16 32 32" aria-hidden="true" focusable="false">
      <circle r="14.5" fill="none" stroke="currentColor" strokeOpacity=".7" />
      <circle r="10" fill="none" stroke="currentColor" strokeOpacity=".4" strokeDasharray="1 2.5" />
      <path d="M0,-13 Q1.17,-1.17 13,0 Q1.17,1.17 0,13 Q-1.17,1.17 -13,0 Q-1.17,-1.17 0,-13Z" fill="currentColor" />
      {theme === 'night' ? (
        <>
          <circle r="4.4" fill="var(--cc-ground)" />
          <path d="M1.2,-3.6 A3.8,3.8 0 1 0 1.2,3.6 A3,3 0 0 1 1.2,-3.6Z" fill="var(--cc-ink)" />
        </>
      ) : (
        <>
          <circle r="3.2" fill="#40e0d0" stroke="#15131c" strokeWidth="1.1" />
          <g stroke="#15131c" strokeWidth="1">
            {sunRays.map((deg) => (
              <line key={deg} x1="0" y1="-4.8" x2="0" y2="-6.6" transform={`rotate(${deg})`} />
            ))}
          </g>
        </>
      )}
    </svg>
  )
}
