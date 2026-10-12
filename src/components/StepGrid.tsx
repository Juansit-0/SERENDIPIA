import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { pitchName, type Accidental } from '../music/notes'
import { useStore } from '../state/store'
import { NoteMark } from './chord/NoteMark'
import type { NoteRole } from './chord/roles'
import '../styles/chord.css'

export interface StepGridProps {
  frets: (number | null)[]
  tuning: number[]
  stringLabels: string[]
  accidental: Accidental
  windowStart: number
  windowSize: number
  capo?: number
  interactive?: boolean
  onToggle?: (stringIndex: number, fret: number) => void
  onPlayString?: (stringIndex: number, midi: number) => void
  showNotes?: boolean
  /** Note name to print on a mark, by pitch class (falls back to the sharp spelling). */
  noteNames?: Record<number, string>
  /** Role of each pitch class in the chord (root, third, seventh, extension, other). */
  roles?: Record<number, NoteRole>
  label?: string
  /** Dim the marks: the chart shows the last valid state while the input is invalid. */
  stale?: boolean
  /**
   * On `desk` screens, stretch the rows to fill the parent's height (26px min per string).
   * The parent must have a definite height. Elsewhere the grid keeps fixed rows.
   */
  fill?: boolean
}

const MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]

const STAR = 'M0,-1 Q0.14,-0.14 1,0 Q0.14,0.14 0,1 Q-0.14,0.14 -1,0 Q-0.14,-0.14 0,-1Z'

function Inlay({ left, top }: { left: string; top: string }) {
  return (
    <svg className="cv-inlay" viewBox="-1.1 -1.1 2.2 2.2" style={{ left, top }} aria-hidden="true" focusable="false">
      <path d={STAR} />
    </svg>
  )
}

export function StepGrid({
  frets,
  tuning,
  stringLabels,
  accidental,
  windowStart,
  windowSize,
  capo = 0,
  interactive = false,
  onToggle,
  onPlayString,
  showNotes = false,
  noteNames,
  roles,
  label,
  stale = false,
  fill = false,
}: StepGridProps) {
  const { t } = useStore()
  const fretColumns = Array.from({ length: windowSize }, (_, index) => windowStart + index)
  const rowOrder = frets.map((_, index) => index).reverse()
  const strings = frets.length
  const absolute = (fret: number | null) => (fret === null ? null : fret + capo)
  const capoVisible = capo > 0 && capo >= windowStart && capo < windowStart + windowSize
  const capoIndex = capoVisible ? capo - windowStart : -1
  const colPct = (index: number) => `${(index / windowSize) * 100}%`
  const rowPct = (index: number) => `${((index + 0.5) / strings) * 100}%`

  const nameOf = (pc: number) => noteNames?.[pc] ?? pitchName(pc, accidental)
  const pcOf = (midi: number) => ((midi % 12) + 12) % 12
  const roleOf = (pc: number): NoteRole => roles?.[pc] ?? 'other'

  // Roving tabindex: the whole fretboard is one tab stop; arrows move between cells.
  // Columns: 0 = string label, 1 = open string, 2.. = frets in the window.
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [cursor, setCursor] = useState({ row: 0, col: 1 })
  const lastCol = windowSize + 1
  const lastRow = strings - 1
  const row = Math.min(cursor.row, lastRow)
  const col = Math.min(cursor.col, lastCol)
  const roving = (r: number, c: number) => ({
    'data-cell': `${r}-${c}`,
    tabIndex: r === row && c === col ? 0 : -1,
    onFocus: () => setCursor({ row: r, col: c }),
  })

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [Math.max(0, row - 1), col],
      ArrowDown: [Math.min(lastRow, row + 1), col],
      ArrowLeft: [row, Math.max(0, col - 1)],
      ArrowRight: [row, Math.min(lastCol, col + 1)],
      Home: [row, 0],
      End: [row, lastCol],
    }
    const target = moves[event.key]
    if (!target) return
    event.preventDefault()
    setCursor({ row: target[0], col: target[1] })
    gridRef.current?.querySelector<HTMLElement>(`[data-cell="${target[0]}-${target[1]}"]`)?.focus()
  }

  // Inlays sit between strings: single at the centre, double at the 12th (and 24th).
  const mid = Math.floor(strings / 2) - 1 // boundary index between rows (top-down)
  const inlayRows = (fret: number) => (fret % 12 === 0 ? [mid - 1, mid + 1] : [mid])

  const rootCells: { row: number; index: number }[] = []
  rowOrder.forEach((stringIndex, rowIndex) => {
    const value = frets[stringIndex]
    if (value === null) return
    const absoluteFret = value === 0 ? (capo > 0 ? capo : 0) : value + capo
    const index = absoluteFret - windowStart
    const pc = pcOf(tuning[stringIndex] + (value === 0 ? 0 : value))
    if (roleOf(pc) === 'root' && index >= 0 && index < windowSize) rootCells.push({ row: rowIndex, index })
  })

  return (
    <div
      ref={gridRef}
      role="group"
      aria-label={label ?? t('a11y.grid')}
      onKeyDown={onKeyDown}
      className={`cv-grid ${fill ? 'cv-grid--fill' : ''} ${stale ? 'is-stale' : ''}`}
      style={
        {
          gridTemplateColumns: `26px 40px repeat(${windowSize}, minmax(0, 1fr))`,
          '--grid-rows': strings,
        } as CSSProperties
      }
    >
      {/* Header: fret numbers. */}
      <span aria-hidden="true" />
      <span className="cv-fretnum" aria-hidden="true">
        {capo > 0 ? '' : '0'}
      </span>
      {fretColumns.map((fret) => (
        <span
          key={`head-${fret}`}
          className={`cv-fretnum ${MARKERS.includes(fret) ? 'is-marker' : ''} ${capoVisible && fret === capo ? 'is-capo' : ''}`}
          aria-hidden="true"
        >
          {fret}
        </span>
      ))}

      {/* Drawing layer behind every cell: nut, fret wires, strings, inlays, ripples, capo. */}
      <div
        className="cv-sky"
        aria-hidden="true"
        style={{ gridRow: `2 / span ${strings}`, gridColumn: `3 / span ${windowSize}` }}
      >
        {capoIndex > 0 && <div className="cv-dead" style={{ width: colPct(capoIndex) }} />}
        {Array.from({ length: windowSize }, (_, index) => (
          <i key={`wire-${index}`} className="cv-wire" style={{ left: colPct(index + 1) }} />
        ))}
        {rowOrder.map((stringIndex, rowIndex) => (
          <i
            key={`string-${stringIndex}`}
            className="cv-string"
            style={{ top: rowPct(rowIndex), height: `${Math.max(1, 2.9 - (stringIndex / Math.max(1, strings - 1)) * 2)}px` }}
          />
        ))}
        {fretColumns
          .filter((fret) => MARKERS.includes(fret))
          .flatMap((fret) =>
            inlayRows(fret).map((boundary) => (
              <Inlay
                key={`inlay-${fret}-${boundary}`}
                left={`${((fret - windowStart + 0.5) / windowSize) * 100}%`}
                top={`${((boundary + 1) / strings) * 100}%`}
              />
            )),
          )}
        {capoVisible && (
          <div className="cv-capo" style={{ left: `calc(${colPct(capoIndex)} + ${100 / windowSize}% * 0.82 - 6px)` }} />
        )}
        {rootCells.map(({ row: r, index }) => (
          <span
            key={`ripple-${r}-${index}`}
            className="cv-ripples"
            style={{
              left: `${((capo > 0 && index === capoIndex ? 0.82 : 0.5) + index) / windowSize * 100}%`,
              top: rowPct(r),
            }}
          >
            <i />
            <i />
            <i />
          </span>
        ))}
      </div>

      {rowOrder.map((stringIndex, rowIndex) => {
        const fretValue = frets[stringIndex]
        const open = fretValue === 0
        const muted = fretValue === null
        const openPc = pcOf(tuning[stringIndex])
        const openNote = nameOf(openPc)
        const soundingMidiAt = (absoluteFret: number) => tuning[stringIndex] + absoluteFret - capo
        const stringLabel = stringLabels[stringIndex]
        // Rows start below the header row.
        const gridRow = rowIndex + 2

        return (
          <div key={`row-${stringIndex}`} className="contents">
            <button
              type="button"
              {...roving(rowIndex, 0)}
              style={{ gridRow, gridColumn: 1 }}
              className="cv-strlabel"
              onClick={() => {
                if (!interactive) return
                onToggle?.(stringIndex, muted ? 0 : -1)
              }}
              aria-label={`${stringLabel} ${
                muted
                  ? t('a11y.stringMuted')
                  : open
                    ? t('a11y.stringOpen')
                    : `${t('a11y.stringFretted')} ${absolute(fretValue)}`
              }${interactive ? ` · ${t('a11y.stringToggle')}` : ''}`}
            >
              {stringLabel}
            </button>

            <button
              type="button"
              {...roving(rowIndex, 1)}
              style={{ gridRow, gridColumn: 2 }}
              aria-pressed={interactive ? open : undefined}
              className={`cv-cell cv-cell--open ${open ? 'is-lit' : ''}`}
              onClick={() => {
                if (!interactive) {
                  if (open) onPlayString?.(stringIndex, tuning[stringIndex])
                  return
                }
                onToggle?.(stringIndex, muted ? 0 : -1)
              }}
              aria-label={`${stringLabel} ${muted ? t('a11y.stringMuted') : openNote}`}
            >
              <span className="cv-slot">
                {muted ? (
                  <svg className="cv-x" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                    <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                  </svg>
                ) : open && capo === 0 ? (
                  <NoteMark role={roleOf(openPc)}>{showNotes ? openNote : ''}</NoteMark>
                ) : (
                  <span className="cv-ghostdot" />
                )}
              </span>
              {!muted && !open && <span className="cv-ghost" />}
              {muted && <span className="cv-ghost" />}
            </button>

            {fretColumns.map((fret, fretIndex) => {
              const isCapo = capoVisible && fret === capo
              const dead = capo > 0 && fret < capo
              const lit = fretValue !== null && fretValue > 0 && absolute(fretValue) === fret
              // With a capo the open strings sound on the capo line, so that cell shows them.
              const capoOpen = isCapo && open
              const midi = soundingMidiAt(fret)
              const pc = pcOf(midi)
              const markPc = capoOpen ? openPc : pc
              return (
                <button
                  key={`cell-${stringIndex}-${fret}`}
                  type="button"
                  {...roving(rowIndex, fretIndex + 2)}
                  style={{ gridRow, gridColumn: fretIndex + 3 }}
                  className={`cv-cell ${isCapo ? 'cv-cell--capo' : ''} ${dead ? 'is-dead' : ''} ${lit || capoOpen ? 'is-lit' : ''}`}
                  aria-pressed={interactive ? lit || capoOpen : undefined}
                  aria-disabled={dead || undefined}
                  title={isCapo ? t('capo.label') : undefined}
                  onClick={() => {
                    if (dead) return
                    if (isCapo) {
                      if (!interactive) {
                        if (capoOpen) onPlayString?.(stringIndex, tuning[stringIndex])
                        return
                      }
                      onToggle?.(stringIndex, open ? -1 : capo)
                      return
                    }
                    if (!interactive) {
                      if (lit) onPlayString?.(stringIndex, soundingMidiAt(fret))
                      return
                    }
                    onToggle?.(stringIndex, lit ? 0 : fret)
                  }}
                  aria-label={`${stringLabel} ${t('a11y.fret')} ${fret}${isCapo ? ` · ${t('capo.label')}` : ''}`}
                >
                  {(lit || capoOpen) && (
                    <span className="cv-slot">
                      <NoteMark role={roleOf(markPc)}>{showNotes ? nameOf(markPc) : ''}</NoteMark>
                    </span>
                  )}
                  {!dead && !(lit || capoOpen) && <span className="cv-ghost" />}
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
