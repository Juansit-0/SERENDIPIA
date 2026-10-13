/** A printable chord diagram: six strings, at least four frets, the starting fret written when it is up the neck. */
export function SheetDiagram({ frets, baseLabel }: { frets: (number | null)[]; baseLabel: string }) {
  const fretted = frets.filter((fret): fret is number => fret !== null && fret > 0)
  const low = fretted.length ? Math.min(...fretted) : 1
  const high = fretted.length ? Math.max(...fretted) : 1
  const start = high <= 4 ? 1 : low
  const rows = Math.max(4, high - start + 1)
  const left = 18
  const top = 16
  const gap = 14
  const fretGap = 16
  const width = left + gap * 5 + 10
  const height = top + fretGap * rows + 6
  const x = (string: number) => left + string * gap
  return (
    <svg className="sheet-diagram" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      {start > 1 && (
        <text x={left - 6} y={top + fretGap * 0.68} textAnchor="end" className="sheet-diagram__base">
          {start}
          {baseLabel}
        </text>
      )}
      <line x1={x(0)} y1={top} x2={x(5)} y2={top} strokeWidth={start === 1 ? 3 : 1} />
      {Array.from({ length: rows }, (_, row) => (
        <line key={row} x1={x(0)} y1={top + fretGap * (row + 1)} x2={x(5)} y2={top + fretGap * (row + 1)} strokeWidth={1} />
      ))}
      {frets.map((_, string) => (
        <line key={string} x1={x(string)} y1={top} x2={x(string)} y2={top + fretGap * rows} strokeWidth={1} />
      ))}
      {frets.map((fret, string) => {
        if (fret === null) {
          return (
            <g key={string} strokeWidth={1.3}>
              <line x1={x(string) - 3.5} y1={top - 10} x2={x(string) + 3.5} y2={top - 3} />
              <line x1={x(string) + 3.5} y1={top - 10} x2={x(string) - 3.5} y2={top - 3} />
            </g>
          )
        }
        if (fret === 0) return <circle key={string} cx={x(string)} cy={top - 6.5} r={3.6} fill="none" strokeWidth={1.2} />
        return <circle key={string} cx={x(string)} cy={top + fretGap * (fret - start) + fretGap / 2} r={5} className="sheet-diagram__dot" />
      })}
    </svg>
  )
}
