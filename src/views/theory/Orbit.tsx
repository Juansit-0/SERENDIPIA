// Quiet ornament for the degree row: orbit ellipses and four-point stars. Always behind data.
export function Orbit({ className = '' }: { className?: string }) {
  return (
    <svg className={`tv-orbit ${className}`} viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <ellipse cx="500" cy="150" rx="470" ry="118" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <ellipse cx="500" cy="150" rx="360" ry="82" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 7" vectorEffect="non-scaling-stroke" transform="rotate(-4 500 150)" />
      <g fill="currentColor">
        <path className="cc-twinkle" d="M52 150l5 -12 5 12 -5 12z" />
        <path className="cc-twinkle" d="M948 112l4 -9 4 9 -4 9z" />
        <circle cx="500" cy="32" r="2.2" />
        <circle cx="140" cy="268" r="1.8" />
        <circle cx="860" cy="262" r="1.8" />
      </g>
    </svg>
  )
}
