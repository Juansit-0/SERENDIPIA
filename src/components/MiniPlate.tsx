export function MiniPlate({
  frets,
  className = 'h-[46px] w-[40px]',
}: {
  frets: (number | null)[]
  className?: string
}) {
  const fretted = frets.filter((fret): fret is number => fret !== null && fret > 0)
  const bottom = fretted.length > 0 ? Math.min(...fretted) : 1
  const top = fretted.length > 0 ? Math.max(...fretted) : 1
  const windowStart = Math.max(1, bottom)
  const rows = Math.max(4, Math.min(5, top - windowStart + 1))
  const width = 40
  const height = 46
  const stringGap = (width - 8) / 5
  const fretGap = (height - 10) / rows

  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((string) => (
        <line
          key={string}
          x1={4 + string * stringGap}
          y1={10}
          x2={4 + string * stringGap}
          y2={height - 2}
          stroke="var(--color-rule-strong)"
          strokeWidth="0.7"
        />
      ))}
      {Array.from({ length: rows + 1 }, (_, row) => (
        <line
          key={row}
          x1={4}
          y1={10 + row * fretGap}
          x2={4 + 5 * stringGap}
          y2={10 + row * fretGap}
          stroke="var(--color-rule-strong)"
          strokeWidth="0.7"
        />
      ))}
      {frets.map((fret, string) => {
        const x = 4 + string * stringGap
        if (fret === null) {
          return (
            <text key={string} x={x} y={7} textAnchor="middle" fontSize="6" fill="var(--color-red)">
              ×
            </text>
          )
        }
        if (fret === 0) {
          return <circle key={string} cx={x} cy={5} r={1.7} fill="none" stroke="var(--color-ink)" strokeWidth="0.8" />
        }
        const row = fret - windowStart
        if (row < 0 || row >= rows) return null
        return (
          <circle
            key={string}
            cx={x}
            cy={10 + row * fretGap + fretGap / 2}
            r={2.2}
            fill="var(--color-turquoise)"
            stroke="var(--color-ink)"
            strokeWidth="0.6"
          />
        )
      })}
    </svg>
  )
}
