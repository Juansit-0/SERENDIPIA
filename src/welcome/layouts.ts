/*
 * The figures the welcome's stars gather into, one per step. Pure data (no three.js) so it can be tested.
 * Coordinates are scene units: the figure fits roughly in x ∈ [-3.2, 3.2], y ∈ [-2.6, 2.6].
 */

export type Hue = 'ink' | 'accent' | 'tonic' | 'sub' | 'dom' | 'borrowed'

export interface Segment {
  from: [number, number]
  to: [number, number]
  hue: Hue
  /** Sample only part of the segment (0–1), leaving gaps: a dotted «hallazgo» line. */
  dash?: number
}

export interface Dot {
  at: [number, number]
  hue: Hue
  /** Relative size: 1 is a chord star. */
  size: number
}

export interface Figure {
  segments: Segment[]
  dots: Dot[]
}

/** A polyline as segments. */
function path(points: Array<[number, number]>, hue: Hue, dash?: number): Segment[] {
  return points.slice(1).map((to, index) => ({ from: points[index], to, hue, dash }))
}

/** Quadratic curve from a to b bending through c, as `steps` points. */
function curve(a: [number, number], c: [number, number], b: [number, number], steps = 8): Array<[number, number]> {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    const u = 1 - t
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]
  })
}

function circle(r: number, hue: Hue, steps = 48, dash?: number): Segment[] {
  const points = Array.from({ length: steps + 1 }, (_, i): [number, number] => {
    const angle = (i / steps) * Math.PI * 2
    return [Math.cos(angle) * r, Math.sin(angle) * r]
  })
  return path(points, hue, dash)
}

/** The brand: a compass star in a ring, with the moon at its heart. */
function brand(): Figure {
  const r = 2.3
  const k = 0.2
  const tips: Array<[number, number]> = [
    [0, r],
    [r, 0],
    [0, -r],
    [-r, 0],
  ]
  const star = tips.flatMap((tip, i) => {
    const next = tips[(i + 1) % 4]
    const pinch: [number, number] = [(tip[0] + next[0]) * k, (tip[1] + next[1]) * k]
    return path(curve(tip, pinch, next), 'accent')
  })
  return {
    segments: [...circle(2.65, 'accent', 64), ...circle(1.85, 'ink', 40, 0.35), ...star],
    dots: [
      { at: [0, 0], hue: 'ink', size: 2.2 },
      ...tips.map((at): Dot => ({ at, hue: 'accent', size: 0.9 })),
    ],
  }
}

/** A chord diagram: six strings, five frets, and Am (x 0 2 2 1 0) pressed as stars. */
function chordChart(): Figure {
  const left = -1.75
  const gap = 0.7
  const top = 1.9
  const fret = 0.9
  const stringX = (s: number) => left + s * gap
  const fretY = (f: number) => top - f * fret
  const strings = Array.from({ length: 6 }, (_, s): Segment => ({
    from: [stringX(s), top],
    to: [stringX(s), fretY(5)],
    hue: 'ink',
  }))
  const frets = Array.from({ length: 6 }, (_, f): Segment => ({
    from: [stringX(0), fretY(f)],
    to: [stringX(5), fretY(f)],
    hue: f === 0 ? 'accent' : 'ink',
  }))
  const above = top + 0.42
  const muted: Segment[] = [
    { from: [stringX(0) - 0.16, above - 0.16], to: [stringX(0) + 0.16, above + 0.16], hue: 'ink' },
    { from: [stringX(0) - 0.16, above + 0.16], to: [stringX(0) + 0.16, above - 0.16], hue: 'ink' },
  ]
  const between = (f: number) => fretY(f) + fret / 2
  return {
    segments: [...strings, ...frets, ...muted],
    dots: [
      // Root A (open 5th string), E on D-string 2nd fret, A on G 2nd fret, C (the third) on B 1st fret, open E.
      { at: [stringX(1), above], hue: 'tonic', size: 1.35 },
      { at: [stringX(2), between(2)], hue: 'accent', size: 1 },
      { at: [stringX(3), between(2)], hue: 'tonic', size: 1.35 },
      { at: [stringX(4), between(1)], hue: 'dom', size: 1.1 },
      { at: [stringX(5), above], hue: 'accent', size: 0.8 },
    ],
  }
}

/** C – G – Am – F as a constellation, each star coloured by its function. */
const PROGRESSION: Array<{ at: [number, number]; hue: Hue }> = [
  { at: [-2.7, -0.9], hue: 'tonic' },
  { at: [-0.95, 0.75], hue: 'dom' },
  { at: [0.9, -0.35], hue: 'tonic' },
  { at: [2.7, 1.05], hue: 'sub' },
]

function constellation(): Figure {
  const points = PROGRESSION.map((star) => star.at)
  return {
    segments: points.slice(1).map((to, i): Segment => ({ from: points[i], to, hue: PROGRESSION[i].hue })),
    dots: PROGRESSION.map((star): Dot => ({ ...star, size: 1.6 })),
  }
}

/** The same constellation, with dotted «hallazgos» branching off: the chords that could come next. */
function serendipity(): Figure {
  const base = constellation()
  const last = PROGRESSION[3].at
  const finds: Array<{ at: [number, number]; hue: Hue }> = [
    { at: [2.1, 2.45], hue: 'borrowed' },
    { at: [3.2, -0.6], hue: 'dom' },
    { at: [1.15, 1.95], hue: 'tonic' },
  ]
  return {
    segments: [...base.segments, ...finds.map((find): Segment => ({ from: last, to: find.at, hue: find.hue, dash: 0.45 }))],
    dots: [...base.dots, ...finds.map((find): Dot => ({ ...find, size: 0.95 }))],
  }
}

export const FIGURES: Figure[] = [brand(), chordChart(), constellation(), serendipity()]

export interface Placement {
  x: number
  y: number
  hue: Hue
  /** Point size; 0 marks a particle the figure does not need (it drifts in the halo). */
  size: number
}

/** A small deterministic random so a figure looks the same on every visit. */
export function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

/**
 * Spreads `count` particles over a figure: one bright particle per dot, the rest strung along the
 * segments in proportion to their length. Particles left over get size 0.
 */
export function place(figure: Figure, count: number, lineSize = 0.42): Placement[] {
  const placements: Placement[] = figure.dots
    .slice(0, count)
    .map((dot) => ({ x: dot.at[0], y: dot.at[1], hue: dot.hue, size: dot.size * 1.6 }))
  const lengths = figure.segments.map((segment) => Math.hypot(segment.to[0] - segment.from[0], segment.to[1] - segment.from[1]))
  const total = lengths.reduce((sum, length) => sum + length, 0)
  const budget = Math.max(0, Math.min(count - placements.length, Math.round(total * 34)))
  figure.segments.forEach((segment, i) => {
    const share = Math.max(2, Math.round((lengths[i] / total) * budget))
    const dash = segment.dash ?? 1
    for (let k = 0; k < share && placements.length < count; k += 1) {
      let t = share === 1 ? 0.5 : k / (share - 1)
      // Dashed: keep the first `dash` of every fifth of the segment.
      if (dash < 1) {
        const cell = Math.floor(t * 5)
        t = (cell + (t * 5 - cell) * dash) / 5
      }
      placements.push({
        x: segment.from[0] + (segment.to[0] - segment.from[0]) * t,
        y: segment.from[1] + (segment.to[1] - segment.from[1]) * t,
        hue: segment.hue,
        size: lineSize,
      })
    }
  })
  while (placements.length < count) placements.push({ x: 0, y: 0, hue: 'ink', size: 0 })
  return placements
}
