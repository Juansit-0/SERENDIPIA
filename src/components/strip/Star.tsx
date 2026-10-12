import type { HarmonicFunction } from '../../music/scales'

export type StarFn = HarmonicFunction | 'borrowed'

/** Four-point sparkle, the strip's single mark. Colored by harmonic function through CSS variables. */
export function Star({ fn, active = false, ghost = false }: { fn: StarFn; active?: boolean; ghost?: boolean }) {
  return (
    <svg className="strip-star" data-fn={fn} data-active={active || undefined} viewBox="-16 -16 32 32" aria-hidden="true" focusable="false">
      <circle className="strip-star__halo" r="8" />
      {active && <circle className="strip-star__ring" r="15" />}
      {active && <circle className="strip-star__ring strip-star__ring--inner" r="11.5" />}
      <path
        className={ghost ? 'strip-star__ghost' : 'strip-star__body'}
        d="M0,-12 Q1.1,-1.1 12,0 Q1.1,1.1 0,12 Q-1.1,1.1 -12,0 Q-1.1,-1.1 0,-12Z"
      />
    </svg>
  )
}
