import { useStore } from '../state/store'
import type { TKey } from '../i18n'
import { MiniPlate } from './MiniPlate'
import { OffsetPlate } from './OffsetPlate'

export function VoicingPads() {
  const { voicings, selectedVoicing, selectVoicing, markedVoicing, setMarkedVoicing, t } = useStore()

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
          const isMarked = voicing.source === 'marked'
          const selected = index === selectedVoicing
          const proof = (
            <button
              type="button"
              className={`sheet flex w-[84px] flex-col items-center gap-1 p-2 ${selected ? 'border-ink' : ''}`}
              aria-pressed={selected}
              onClick={() => selectVoicing(index)}
            >
              <MiniPlate frets={voicing.frets} />
              <span
                className={`label-ink w-full text-center ${selected ? 'bg-turquoise text-ink mix-blend-multiply' : ''}`}
              >
                {isMarked
                  ? t('voicing.marked')
                  : voicing.source === 'common'
                    ? t('chord.common')
                    : `${t('chord.position')} ${voicing.baseFret}`}
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
            <div
              key={voicing.signature}
              className="relative"
              style={{ transform: `translateY(${(index % 3) * 4}px)` }}
            >
              {isMarked && markedVoicing && (
                <button
                  type="button"
                  className="absolute -right-1.5 -top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full border border-ink bg-paper font-mono text-[10px] leading-none hover:bg-turquoise"
                  onClick={() => setMarkedVoicing(null)}
                  aria-label={t('voicing.clear')}
                  title={t('voicing.clear')}
                >
                  ×
                </button>
              )}
              {selected ? <OffsetPlate offset={4}>{proof}</OffsetPlate> : proof}
            </div>
          )
        })}
      </div>
    </section>
  )
}
