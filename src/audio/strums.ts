export type StrumId = 'single' | 'quarters' | 'folk' | 'ballad' | 'eighths' | 'offbeat' | 'arpeggio'

/** One bar of 4/4 in eighth-note slots: D = downstroke, U = upstroke, A = arpeggio note, null = rest. */
type Slot = 'D' | 'U' | 'A' | null

export interface StrumPattern {
  id: StrumId
  nameEs: string
  nameEn: string
  /** Compact picture of the bar, e.g. "↓ ↓↑ ↑↓↑". */
  glyph: string
  slots: Slot[]
}

export const STRUMS: StrumPattern[] = [
  { id: 'single', nameEs: 'Un rasgueo', nameEn: 'Single strum', glyph: '↓', slots: ['D', null, null, null, null, null, null, null] },
  { id: 'quarters', nameEs: 'Negras', nameEn: 'Quarter notes', glyph: '↓ ↓ ↓ ↓', slots: ['D', null, 'D', null, 'D', null, 'D', null] },
  { id: 'folk', nameEs: 'Folk', nameEn: 'Folk', glyph: '↓ ↓↑ ↑↓↑', slots: ['D', null, 'D', 'U', null, 'U', 'D', 'U'] },
  { id: 'ballad', nameEs: 'Balada', nameEn: 'Ballad', glyph: '↓ ↓↑ ↓ ↓↑', slots: ['D', null, 'D', 'U', 'D', null, 'D', 'U'] },
  { id: 'eighths', nameEs: 'Corcheas', nameEn: 'Eighth notes', glyph: '↓↑↓↑↓↑↓↑', slots: ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U'] },
  { id: 'offbeat', nameEs: 'Contratiempo', nameEn: 'Offbeat', glyph: '·↑·↑·↑·↑', slots: [null, 'U', null, 'U', null, 'U', null, 'U'] },
  { id: 'arpeggio', nameEs: 'Arpegio', nameEn: 'Arpeggio', glyph: '♪♪♪♪♪♪♪♪', slots: ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'] },
]

export const STRUM_BY_ID = Object.fromEntries(STRUMS.map((strum) => [strum.id, strum])) as Record<StrumId, StrumPattern>

export function isStrumId(value: unknown): value is StrumId {
  return typeof value === 'string' && value in STRUM_BY_ID
}

export interface StrumHit {
  /** Offset from the start of the step, in eighth notes. */
  eighth: number
  kind: 'down' | 'up' | 'arpeggio'
  /** Downbeats are played harder than offbeats. */
  accent: boolean
  /** Eighths until the next hit (or the end of the step): how long the chord rings. */
  length: number
  /** For arpeggios: which note of the chord, counting from the bass. */
  order: number
}

/** Lays a one-bar pattern over a step of `beats` quarter notes, repeating or cutting it. */
export function strumHits(id: StrumId, beats: number): StrumHit[] {
  const pattern = STRUM_BY_ID[id] ?? STRUM_BY_ID.single
  const total = Math.max(1, Math.round(beats * 2))
  const hits: Omit<StrumHit, 'length'>[] = []
  let arpeggioOrder = 0
  for (let eighth = 0; eighth < total; eighth += 1) {
    const slot = pattern.slots[eighth % pattern.slots.length]
    if (!slot) continue
    hits.push({
      eighth,
      kind: slot === 'D' ? 'down' : slot === 'U' ? 'up' : 'arpeggio',
      accent: eighth % 2 === 0,
      order: slot === 'A' ? arpeggioOrder++ : 0,
    })
  }
  // A step must always sound: a pattern that starts on a rest still strikes on the downbeat.
  if (hits.length === 0 || hits[0].eighth !== 0) hits.unshift({ eighth: 0, kind: 'down', accent: true, order: 0 })
  return hits.map((hit, index) => ({ ...hit, length: (hits[index + 1]?.eighth ?? total) - hit.eighth }))
}
