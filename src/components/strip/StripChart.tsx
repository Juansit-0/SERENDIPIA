/** Tiny chord chart for the step picker, drawn with the Carta celeste tokens (works on the dark popover). */
export function StripChart({ frets }: { frets: (number | null)[] }) {
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
    <svg className="h-[46px] w-[40px]" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((string) => (
        <line key={string} x1={4 + string * stringGap} y1={10} x2={4 + string * stringGap} y2={height - 2} stroke="var(--cc-line-strong)" strokeWidth="0.8" />
      ))}
      {Array.from({ length: rows + 1 }, (_, row) => (
        <line key={row} x1={4} y1={10 + row * fretGap} x2={4 + 5 * stringGap} y2={10 + row * fretGap} stroke="var(--cc-line-strong)" strokeWidth={row === 0 && windowStart === 1 ? 1.6 : 0.8} />
      ))}
      {frets.map((fret, string) => {
        const x = 4 + string * stringGap
        if (fret === null) {
          return (
            <text key={string} x={x} y={7} textAnchor="middle" fontSize="7" fill="var(--cc-danger)">
              ×
            </text>
          )
        }
        if (fret === 0) return <circle key={string} cx={x} cy={5} r={1.8} fill="none" stroke="var(--cc-ink)" strokeWidth="0.9" />
        const row = fret - windowStart
        if (row < 0 || row >= rows) return null
        return <circle key={string} cx={x} cy={10 + row * fretGap + fretGap / 2} r={2.3} fill="var(--cc-accent)" stroke="var(--cc-ink)" strokeWidth="0.5" />
      })}
    </svg>
  )
}
