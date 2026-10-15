import { useMemo } from 'react'
import type { ParsedSheet, Segment, SheetLine } from '../../music/chordpro'
import { chordFunction, sheetKey } from './sheetKey'

type Piece = { segment: Segment | null; text: string }

/**
 * A line as words that never break: a chord can fall mid-word («a[G]brió»), and the two pieces must stay together
 * when the line wraps on a narrow screen or in big type. Wrapping happens only at the spaces.
 */
export function wordUnits(segments: Segment[]): Piece[][] {
  const units: Piece[][] = [[]]
  for (const segment of segments) {
    const parts = segment.text.split(/(\s+)/).filter((part) => part !== '')
    if (parts.length === 0) {
      units[units.length - 1].push({ segment, text: '' })
      continue
    }
    parts.forEach((part, index) => {
      const owner = index === 0 ? segment : null
      const unit = units[units.length - 1]
      if (/^\s+$/.test(part)) {
        // The space closes the word it follows (or carries the chord when the chord sits on it).
        if (owner || unit.length === 0) unit.push({ segment: owner, text: part })
        else unit[unit.length - 1] = { ...unit[unit.length - 1], text: unit[unit.length - 1].text + part }
        units.push([])
      } else unit.push({ segment: owner, text: part })
    })
  }
  return units.filter((unit) => unit.length > 0)
}

type Block = { chorus: boolean; lines: Array<{ line: SheetLine; at: number }> }

/** Consecutive chorus lines (and the blank lines between them) form one block, set apart like a refrain. */
function blocksOf(lines: SheetLine[]): Block[] {
  const blocks: Block[] = []
  lines.forEach((line, at) => {
    const last = blocks[blocks.length - 1]
    const chorus = line.kind === 'lyrics' ? line.chorus : line.kind === 'blank' && Boolean(last?.chorus)
    if (last && last.chorus === chorus) last.lines.push({ line, at })
    else blocks.push({ chorus, lines: [{ line, at }] })
  })
  // A chorus never ends on a blank line: it belongs to what follows.
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i]
    while (block.chorus && block.lines.length > 1 && block.lines[block.lines.length - 1].line.kind === 'blank') {
      const moved = block.lines.pop()!
      const next = blocks[i + 1]
      if (next && !next.chorus) next.lines.unshift(moved)
      else blocks.splice(i + 1, 0, { chorus: false, lines: [moved] })
    }
  }
  return blocks
}

/**
 * Lines of lyrics, each chord set above the syllable it falls on and coloured by its function in the song's key.
 * Sections read as headings, the chorus as a set-apart block; while playing, the sung line glows and the past fades.
 */
export function Lyrics({
  sheet,
  notation,
  live,
  chorusLabel,
}: {
  sheet: ParsedSheet
  notation: string
  live: number
  chorusLabel: string
}) {
  const key = useMemo(() => sheetKey(sheet.chords), [sheet])
  const blocks = useMemo(() => blocksOf(sheet.lines), [sheet])

  const renderLine = (line: SheetLine, at: number) => {
    if (line.kind === 'blank') return <div key={at} className="sb-gap" />
    if (line.kind === 'comment')
      return (
        <p key={at} className="sb-comment">
          <span>{line.text}</span>
        </p>
      )
    const indices = line.segments.map((segment) => segment.index).filter((index) => index >= 0)
    const isLive = live >= 0 && indices.includes(live)
    const isPast = live >= 0 && indices.length > 0 && Math.max(...indices) < live
    return (
      <p key={at} className={`sb-line ${line.chorus ? 'is-chorus' : ''} ${isLive ? 'is-live' : ''} ${isPast ? 'is-past' : ''}`}>
        {wordUnits(line.segments).map((unit, unitIndex) => (
          <span key={unitIndex} className="sb-unit">
            {unit.map(({ segment, text }, index) => (
              <span
                key={index}
                className="sb-seg"
                data-chord-index={segment && segment.index >= 0 ? segment.index : undefined}
                data-live={segment && segment.index >= 0 && segment.index === live ? 'true' : undefined}
              >
                <span
                  className={`sb-chord ${segment?.chord && !segment.parsed ? 'is-unknown' : ''}`}
                  data-fn={segment?.parsed ? chordFunction(segment.parsed, key) : undefined}
                  aria-hidden={segment?.chord ? undefined : 'true'}
                >
                  {segment?.parsed ? (notation === 'latin' ? segment.parsed.latin : segment.parsed.anglo) : (segment?.chord ?? '')}
                </span>
                <span className="sb-text">{text || ' '}</span>
              </span>
            ))}
          </span>
        ))}
      </p>
    )
  }

  return (
    <div className="sb-lyrics">
      {blocks.map((block, index) =>
        block.chorus ? (
          <div key={index} className="sb-chorus">
            {sheet.lines[block.lines[0].at - 1]?.kind !== 'comment' && <p className="sb-chorus__label">{chorusLabel}</p>}
            {block.lines.map(({ line, at }) => renderLine(line, at))}
          </div>
        ) : (
          block.lines.map(({ line, at }) => renderLine(line, at))
        ),
      )}
    </div>
  )
}
