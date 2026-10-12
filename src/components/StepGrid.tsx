import { useRef, useState, type KeyboardEvent } from 'react'
import { pitchName, type Accidental } from '../music/notes'
import { useStore } from '../state/store'

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
  noteNames?: Record<number, string>
  label?: string
}

const MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]

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
  label,
}: StepGridProps) {
  const { t } = useStore()
  const fretColumns = Array.from({ length: windowSize }, (_, index) => windowStart + index)
  const rowOrder = frets.map((_, index) => index).reverse()
  const absolute = (fret: number | null) => (fret === null ? null : fret + capo)
  const capoVisible = capo > 0 && capo >= windowStart && capo < windowStart + windowSize

  // Roving tabindex: the whole fretboard is one tab stop; arrows move between cells.
  // Columns: 0 = string label, 1 = open string, 2.. = frets in the window.
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [cursor, setCursor] = useState({ row: 0, col: 1 })
  const lastCol = windowSize + 1
  const lastRow = frets.length - 1
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

  return (
    <div
      ref={gridRef}
      role="group"
      aria-label={label ?? t('a11y.grid')}
      onKeyDown={onKeyDown}
      className="grid items-center gap-[3px]"
      style={{ gridTemplateColumns: `24px 34px repeat(${windowSize}, minmax(0, 1fr))` }}
    >
      <span aria-hidden="true" />
      <span className="label-ink text-center">0</span>
      {fretColumns.map((fret) => (
        <span key={`head-${fret}`} className="relative flex flex-col items-center gap-1">
          <span
            className={`label-ink ${MARKERS.includes(fret) ? 'text-ink' : ''} ${
              capoVisible && fret === capo ? 'text-ink underline decoration-2 underline-offset-2' : ''
            }`}
          >
            {fret}
          </span>
          {MARKERS.includes(fret) && <span className="h-[3px] w-[3px] rounded-full bg-orange" />}
        </span>
      ))}

      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span
        className="h-[2px] bg-ink"
        style={{ gridColumn: `3 / span ${windowSize}` }}
        aria-hidden="true"
      />

      {rowOrder.map((stringIndex, rowIndex) => {
        const fretValue = frets[stringIndex]
        const open = fretValue === 0
        const muted = fretValue === null
        const openPc = (((tuning[stringIndex] % 12) + 12) % 12)
        const openNote = noteNames?.[openPc] ?? pitchName(openPc, accidental)
        const soundingMidiAt = (absoluteFret: number) => tuning[stringIndex] + absoluteFret - capo
        const stringLabel = stringLabels[stringIndex]

        return (
          <div key={`row-${stringIndex}`} className="contents">
            <button
              type="button"
              {...roving(rowIndex, 0)}
              className="label-ink min-h-[30px] text-right"
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
              aria-pressed={interactive ? open : undefined}
              className={`cell h-[30px] ${open ? 'border-ink' : ''}`}
              onClick={() => {
                if (!interactive) {
                  if (open) onPlayString?.(stringIndex, tuning[stringIndex])
                  return
                }
                onToggle?.(stringIndex, muted ? 0 : -1)
              }}
              aria-label={`${stringLabel} ${muted ? t('a11y.stringMuted') : openNote}`}
            >
              <span className={`font-mono text-[11px] ${muted ? 'text-red' : open ? 'text-ink' : 'text-ink-faint'}`}>
                {muted ? '×' : open ? '○' : '·'}
              </span>
              {showNotes && open && (
                <span className="absolute bottom-[1px] font-mono text-[7px] text-ink-faint">{openNote}</span>
              )}
            </button>

            {fretColumns.map((fret, fretIndex) => {
              const lit = fretValue !== null && fretValue > 0 && absolute(fretValue) === fret
              const isCapo = capoVisible && fret === capo
              return (
                <button
                  key={`cell-${stringIndex}-${fret}`}
                  type="button"
                  {...roving(rowIndex, fretIndex + 2)}
                  className={`cell h-[30px] ${isCapo ? 'cell--capo' : ''} ${lit ? 'cell--lit' : ''}`}
                  aria-pressed={interactive ? lit : undefined}
                  aria-disabled={isCapo || undefined}
                  title={isCapo ? t('capo.label') : undefined}
                  onClick={() => {
                    if (isCapo) return
                    if (!interactive) {
                      if (lit) onPlayString?.(stringIndex, soundingMidiAt(fret))
                      return
                    }
                    onToggle?.(stringIndex, lit ? 0 : fret)
                  }}
                  aria-label={`${stringLabel} ${t('a11y.fret')} ${fret}${isCapo ? ` · ${t('capo.label')}` : ''}`}
                >
                  {lit && showNotes && (
                    <span className="relative z-10 font-mono text-[7px] font-bold text-ink">
                      {noteNames?.[((soundingMidiAt(fret) % 12) + 12) % 12] ??
                        pitchName(((soundingMidiAt(fret) % 12) + 12) % 12, accidental)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}