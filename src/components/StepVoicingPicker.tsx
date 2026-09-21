import { useEffect, useMemo, useRef } from 'react'
import { qualityById } from '../music/chords'
import { absoluteLabel, autoVoicing, voicingLabel, voicingSignature } from '../music/stepVoicing'
import { voicingsFor, type Voicing } from '../music/voicings'
import { useStore, type ProgressionStep } from '../state/store'
import { MiniPlate } from './MiniPlate'

export function StepVoicingPicker({
  step,
  index,
  onClose,
}: {
  step: ProgressionStep
  index: number
  onClose: () => void
}) {
  const { tuning, capo, setStepVoicing, removeFromProgression, notation, t } = useStore()
  const container = useRef<HTMLDivElement | null>(null)

  const bassPc = step.bassPc ?? null

  const bank = useMemo(
    () => voicingsFor(step.rootPc, qualityById(step.qualityId), tuning, { limit: 9, bassPc }),
    [step.rootPc, step.qualityId, tuning, bassPc],
  )

  const auto = useMemo(
    () => autoVoicing(step.rootPc, step.qualityId, tuning, bassPc),
    [step.rootPc, step.qualityId, tuning, bassPc],
  )

  const options = useMemo(() => {
    const autoSignature = auto ? voicingSignature(auto.frets) : null
    const list: Voicing[] = bank.filter((voicing) => voicing.signature !== autoSignature)
    if (step.frets) {
      const signature = voicingSignature(step.frets)
      if (!list.some((voicing) => voicing.signature === signature)) {
        list.unshift({
          frets: step.frets,
          midi: [],
          fingers: step.frets.map(() => null),
          barre: null,
          baseFret: Math.max(1, Math.min(...step.frets.filter((fret): fret is number => fret !== null && fret > 0), 1)),
          span: 0,
          muted: step.frets.filter((fret) => fret === null).length,
          open: step.frets.filter((fret) => fret === 0).length,
          difficulty: 'medium',
          score: 0,
          source: step.voicingSource === 'marked' ? 'marked' : 'common',
          signature,
        })
      }
    }
    return list
  }, [bank, auto, step.frets, step.voicingSource])

  const currentSignature = step.frets ? voicingSignature(step.frets) : null

  useEffect(() => {
    container.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      ref={container}
      role="dialog"
      aria-label={`${t('voicing.pick')}: ${step.anglo}`}
      tabIndex={-1}
      className="plate wipe-in mt-2 flex w-fit max-w-full flex-col gap-3 p-4 focus:outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="label-ink text-blue-ink">{t('voicing.pick')}</span>
          <span className="fv-ui text-[1.05rem] font-bold">
            {notation === 'latin' ? step.latin : step.anglo}
          </span>
          <span className="font-mono text-[10px] text-ink-soft">
            {step.frets
              ? `${t('voicing.shape')}: ${step.voicingLabel ?? voicingLabel(step.frets)}${
                  capo > 0 ? ` · ${t('voicing.absolute')}: ${absoluteLabel(step.frets, capo)}` : ''
                }`
              : `${t('voicing.auto')} · ${auto ? voicingLabel(auto.frets) : '—'}`}
          </span>
        </div>
        <button type="button" className="stamp px-2 py-0.5" onClick={onClose} aria-label={t('voicing.close')}>
          ×
        </button>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        <button
          type="button"
          className={`sheet flex w-[84px] flex-col items-center gap-1 p-2 ${currentSignature === null ? 'border-ink' : ''}`}
          aria-pressed={currentSignature === null}
          onClick={() => {
            setStepVoicing(index, null)
            onClose()
          }}
        >
          {auto ? (
            <MiniPlate frets={auto.frets} />
          ) : (
            <span className="grid h-[46px] w-[40px] place-items-center font-mono text-[11px]">—</span>
          )}
          <span className={`label-ink w-full text-center ${currentSignature === null ? 'bg-turquoise text-ink' : ''}`}>
            {t('voicing.auto')}
          </span>
          <span className="font-mono text-[8px] tracking-tight text-ink-soft">
            {auto ? voicingLabel(auto.frets) : t('voicing.autoHint')}
          </span>
        </button>

        {options.map((voicing) => {
          const selected = voicing.signature === currentSignature
          const label =
            selected && step.voicingSource === 'marked'
              ? t('voicing.marked')
              : voicing.source === 'marked'
                ? t('voicing.marked')
                : voicing.source === 'common'
                  ? t('chord.common')
                  : `${t('chord.position')} ${voicing.baseFret}`
          return (
            <button
              key={voicing.signature}
              type="button"
              className={`sheet flex w-[84px] flex-col items-center gap-1 p-2 ${selected ? 'border-ink' : ''}`}
              aria-pressed={selected}
              onClick={() => {
                setStepVoicing(index, {
                  frets: voicing.frets,
                  label: voicingLabel(voicing.frets),
                  source: voicing.source === 'marked' ? 'marked' : 'proof',
                })
                onClose()
              }}
            >
              <MiniPlate frets={voicing.frets} />
              <span className={`label-ink w-full text-center ${selected ? 'bg-turquoise text-ink' : ''}`}>
                {label}
              </span>
              <span className="font-mono text-[8px] tracking-tight text-ink-soft">
                {voicingLabel(voicing.frets)}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-rule pt-2">
        <button
          type="button"
          className="stamp"
          onClick={() => {
            removeFromProgression(index)
            onClose()
          }}
        >
          {t('voicing.removeStep')}
        </button>
        <span className="readout text-[10px] text-ink-faint">{t('voicing.removeHint')}</span>
      </div>
    </div>
  )
}
