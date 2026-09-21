import { useStore } from '../state/store'
import type { TKey } from '../i18n'
import type { Voicing } from '../music/voicings'
import { OffsetPlate } from './OffsetPlate'

function MiniPlate({ voicing }: { voicing: Voicing }) {
  const fretted = voicing.frets.filter((fret): fret is number => fret !== null && fret > 0)
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
        <line
          key={string}
          x1={4 + string * stringGap}
          y1={10}
          x2={4 + string * stringGap}
          y2={height - 2}
          stroke="var(--color-rule-strong)"
          strokeWidth="0.7"
        />
      ))}
      {Array.from({ length: rows + 1 }, (_, row) => (
        <line
          key={row}
          x1={4}
          y1={10 + row * fretGap}
          x2={4 + 5 * stringGap}
          y2={10 + row * fretGap}
          stroke="var(--color-rule-strong)"
          strokeWidth="0.7"
        />
      ))}
      {voicing.frets.map((fret, string) => {
        const x = 4 + string * stringGap
        if (fret === null) {
          return (
            <text key={string} x={x} y={7} textAnchor="middle" fontSize="6" fill="var(--color-red)">
              ×
            </text>
          )
        }
        if (fret === 0) {
          return <circle key={string} cx={x} cy={5} r={1.7} fill="none" stroke="var(--color-ink)" strokeWidth="0.8" />
        }
        const row = fret - windowStart
        if (row < 0 || row >= rows) return null
        return (
          <circle
            key={string}
            cx={x}
            cy={10 + row * fretGap + fretGap / 2}
            r={2.2}
            fill="var(--color-turquoise)"
            stroke="var(--color-ink)"
            strokeWidth="0.6"
          />
        )
      })}
    </svg>
  )
}

export function VoicingPads() {
  const { voicings, selectedVoicing, selectVoicing, t } = useStore()

  if (voicings.length === 0) {
    return <p className="readout text-[11px] text-ink-faint">{t('voicings.empty')}</p>
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="label-ink text-blue-ink">{t('chord.proofs')}</h2>
      <div className="relative flex flex-wrap items-start gap-2 border border-dashed border-rule-strong p-3">
        <span className="cropmark left-1 top-1 border-l border-t" aria-hidden="true" />
        <span className="cropmark right-1 top-1 border-r border-t" aria-hidden="true" />
        <span className="cropmark bottom-1 left-1 border-b border-l" aria-hidden="true" />
        <span className="cropmark bottom-1 right-1 border-b border-r" aria-hidden="true" />

        {voicings.map((voicing, index) => {
          const proof = (
            <button
              type="button"
              className={`sheet flex w-[84px] flex-col items-center gap-1 p-2 ${
                index === selectedVoicing ? 'border-ink' : ''
              }`}
              aria-pressed={index === selectedVoicing}
              onClick={() => selectVoicing(index)}
            >
              <MiniPlate voicing={voicing} />
              <span
                className={`label-ink w-full text-center ${index === selectedVoicing ? 'bg-turquoise text-ink mix-blend-multiply' : ''}`}
              >
                {voicing.source === 'common' ? t('chord.common') : `${t('chord.position')} ${voicing.baseFret}`}
              </span>
              <span className="font-mono text-[8px] text-ink-faint">
                {t(`difficulty.${voicing.difficulty}` as TKey)}
              </span>
              <span className="font-mono text-[8px] tracking-tight text-ink-soft">
                {voicing.frets.map((fret) => (fret === null ? 'x' : fret)).join(' ')}
              </span>
            </button>
          )

          return (
            <div key={voicing.signature} style={{ transform: `translateY(${(index % 3) * 4}px)` }}>
              {index === selectedVoicing ? <OffsetPlate offset={4}>{proof}</OffsetPlate> : proof}
            </div>
          )
        })}
      </div>
    </section>
  )
}
