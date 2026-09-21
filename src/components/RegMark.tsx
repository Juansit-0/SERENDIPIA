export function RegMark({ className = '' }: { className?: string }) {
  return (
    <svg className={`reg text-ink-soft ${className}`} viewBox="0 0 11 11" aria-hidden="true">
      <circle cx="5.5" cy="5.5" r="4.1" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <path d="M5.5 0v3.2M5.5 7.8V11M0 5.5h3.2M7.8 5.5H11" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  )
}
