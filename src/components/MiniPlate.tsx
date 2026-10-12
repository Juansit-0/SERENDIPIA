/**
 * Mini chord diagram. Draws in `currentColor` so it reads on any surface (a framed card,
 * the selected accent fill, the day strip): lines at low opacity, notes solid.
 */
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
    <svg className={className} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      {[0, 1, 2, 3, 4, 5].map((string) => (
        <line
          key={string}
          x1={4 + string * stringGap}
          y1={10}
          x2={4 + string * stringGap}
          y2={height - 2}
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="0.8"
        />
      ))}
      {Array.from({ length: rows + 1 }, (_, row) => (
        <line
          key={row}
          x1={4}
          y1={10 + row * fretGap}
          x2={4 + 5 * stringGap}
          y2={10 + row * fretGap}
          stroke="currentColor"
          strokeOpacity={row === 0 && windowStart === 1 ? 0.95 : 0.55}
          strokeWidth={row === 0 && windowStart === 1 ? 1.6 : 0.8}
        />
      ))}
      {frets.map((fret, string) => {
        const x = 4 + string * stringGap
        if (fret === null) {
          return (
            <g key={string} stroke="var(--cc-danger, currentColor)" strokeWidth="1" strokeLinecap="round">
              <line x1={x - 1.7} y1={3.3} x2={x + 1.7} y2={6.7} />
              <line x1={x + 1.7} y1={3.3} x2={x - 1.7} y2={6.7} />
            </g>
          )
        }
        if (fret === 0) {
          return <circle key={string} cx={x} cy={5} r={1.9} fill="none" stroke="currentColor" strokeWidth="1" />
        }
        const row = fret - windowStart
        if (row < 0 || row >= rows) return null
        return <circle key={string} cx={x} cy={10 + row * fretGap + fretGap / 2} r={2.5} fill="currentColor" />
      })}
    </svg>
  )
}
