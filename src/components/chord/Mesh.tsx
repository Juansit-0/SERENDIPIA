import { useMemo } from 'react'

/** Warped mesh: a quiet grid bent by two sine waves. Pure ornament, always behind data. */
export function Mesh() {
  const paths = useMemo(() => {
    const w = 190
    const h = 300
    const cols = 9
    const rows = 14
    const warp = (x: number, y: number): [number, number] => [
      x + Math.sin(y / 38 + 0.8) * 8 + Math.sin(x / 55) * 3,
      y + Math.sin(x / 31 + 0.4) * 7 + Math.cos(y / 70) * 3,
    ]
    const lines: string[] = []
    for (let r = 0; r <= rows; r += 1) {
      const pts: string[] = []
      for (let i = 0; i <= 20; i += 1) {
        const [px, py] = warp((i / 20) * w, (r / rows) * h)
        pts.push(`${px.toFixed(1)},${py.toFixed(1)}`)
      }
      lines.push(`M${pts.join('L')}`)
    }
    for (let k = 0; k <= cols; k += 1) {
      const pts: string[] = []
      for (let i = 0; i <= 28; i += 1) {
        const [px, py] = warp((k / cols) * w, (i / 28) * h)
        pts.push(`${px.toFixed(1)},${py.toFixed(1)}`)
      }
      lines.push(`M${pts.join('L')}`)
    }
    return lines.join(' ')
  }, [])
  return (
    <svg className="cv-mesh" viewBox="0 0 190 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={paths} fill="none" stroke="currentColor" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
