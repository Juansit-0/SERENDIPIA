import type { ReactNode } from 'react'

const TONES: Record<string, string> = {
  turquoise: 'bg-turquoise',
  orange: 'bg-orange',
  blue: 'bg-blue',
}

export function OffsetPlate({
  children,
  tone = 'turquoise',
  offset = 4,
}: {
  children: ReactNode
  tone?: 'turquoise' | 'orange' | 'blue'
  offset?: number
}) {
  return (
    <div className="relative">
      <span
        className={`absolute h-full w-full ${TONES[tone]}`}
        style={{ left: offset, top: offset }}
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </div>
  )
}
