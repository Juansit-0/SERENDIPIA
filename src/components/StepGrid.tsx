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

      {rowOrder.map((stringIndex) => {
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
              const lit = fretValue !== null && fretValue > 0 && absolute(fretValue) === fret
              const isCapo = capoVisible && fret === capo
              return (
                <button
                  key={`cell-${stringIndex}-${fret}`}
                  type="button"
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