import { pitchName, type Accidental } from '../music/notes'
import { useStore } from '../state/store'

export interface StepGridProps {
  frets: (number | null)[]
  tuning: number[]
  stringLabels: string[]
  accidental: Accidental
  windowStart: number
  windowSize: number
  interactive?: boolean
  onToggle?: (stringIndex: number, fret: number) => void
  onPlayString?: (stringIndex: number, midi: number) => void
  showNotes?: boolean
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
  interactive = false,
  onToggle,
  onPlayString,
  showNotes = false,
  label,
}: StepGridProps) {
  const { t } = useStore()
  const fretColumns = Array.from({ length: windowSize }, (_, index) => windowStart + index)
  const rowOrder = frets.map((_, index) => index).reverse()

  return (
    <div
      role="group"
      aria-label={label ?? t('a11y.grid')}
      className="grid items-center gap-[3px]"
      style={{ gridTemplateColumns: `24px 34px repeat(${windowSize}, minmax(0, 1fr))` }}
    >
      <span aria-hidden="true" />
      <span className="label-ink text-center">0</span>
      {fretColumns.map((fret) => (
        <span key={`head-${fret}`} className="relative flex flex-col items-center gap-1">
          <span className={`label-ink ${MARKERS.includes(fret) ? 'text-ink' : ''}`}>{fret}</span>
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

      {rowOrder.map((stringIndex) => {
        const fretValue = frets[stringIndex]
        const open = fretValue === 0
        const muted = fretValue === null
        const openNote = pitchName((((tuning[stringIndex] % 12) + 12) % 12), accidental)
        const stringLabel = stringLabels[stringIndex]

        return (
          <div key={`row-${stringIndex}`} className="contents">
            <button
              type="button"
              className="label-ink text-right"
              onClick={() => {
                if (!interactive) return
                onToggle?.(stringIndex, muted ? 0 : -1)
              }}
              aria-label={`${stringLabel} ${muted ? t('a11y.stringMuted') : t('a11y.stringOpen')}`}
            >
              {stringLabel}
            </button>

            <button
              type="button"
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

            {fretColumns.map((fret) => {
              const lit = fretValue === fret
              return (
                <button
                  key={`cell-${stringIndex}-${fret}`}
                  type="button"
                  className={`cell h-[30px] ${lit ? 'cell--lit' : ''}`}
                  aria-pressed={interactive ? lit : undefined}
                  onClick={() => {
                    if (!interactive) {
                      if (lit) onPlayString?.(stringIndex, tuning[stringIndex] + fret)
                      return
                    }
                    onToggle?.(stringIndex, lit ? 0 : fret)
                  }}
                  aria-label={`${stringLabel} ${t('a11y.fret')} ${fret}`}
                >
                  {lit && showNotes && (
                    <span className="relative z-10 font-mono text-[7px] font-bold text-ink">
                      {pitchName((((tuning[stringIndex] + fret) % 12) + 12) % 12, accidental)}
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
