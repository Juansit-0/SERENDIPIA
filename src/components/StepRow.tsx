import { useMemo } from 'react'
import { chordTones, qualityById } from '../music/chords'
import { chordAccidental, pitchName } from '../music/notes'
import { diatonicChords, type HarmonicFunction } from '../music/scales'
import { useStore } from '../state/store'
import { OffsetPlate } from './OffsetPlate'

const SLOTS = 16

const FUNCTION_INK: Record<HarmonicFunction, string> = {
  tonic: 'ink-rule--tonic',
  subdominant: 'ink-rule--subdominant',
  dominant: 'ink-rule--dominant',
}

export function StepRow() {
  const {
    progression,
    playing,
    activeStep,
    removeFromProgression,
    clearProgression,
    suggestions,
    addSuggestion,
    notation,
    keyRootPc,
    keyMode,
    t,
  } = useStore()

  const diatonic = useMemo(() => diatonicChords(keyRootPc, keyMode), [keyRootPc, keyMode])

  const pcsOf = (rootPc: number, qualityId: Parameters<typeof qualityById>[0]) =>
    chordTones(rootPc, qualityById(qualityId))

  const ghosts = suggestions.slice(0, Math.max(0, SLOTS - progression.length))
  const emptySlots = Math.max(0, SLOTS - progression.length - ghosts.length)

  return (
    <section className="plate flex min-w-0 flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="label-ink text-blue-ink">{t('progression.title')}</h2>
          <span className="label-ink sm:hidden">{t('progression.swipe')}</span>
        </div>
        <div className="flex items-center gap-3">
          {progression.length > 0 && (
            <button type="button" className="stamp" onClick={clearProgression}>
              {t('progression.clear')}
            </button>
          )}
          <span className="readout text-[11px] text-ink-soft">
            {progression.length}/{SLOTS}
          </span>
        </div>
      </div>

      <div className="min-w-0 overflow-x-auto pb-2">
        <div
          className="grid min-w-[760px] snap-x snap-mandatory gap-1.5 sm:min-w-0"
          style={{ gridTemplateColumns: `repeat(${SLOTS}, minmax(0, 1fr))` }}
          role="group"
          aria-label={t('a11y.stepRow')}
        >
          {progression.map((step, index) => {
            const active = playing && activeStep === index
            const next = progression.length > 1 ? progression[(index + 1) % progression.length] : null
            const tones = pcsOf(step.rootPc, step.qualityId)
            const shared = next
              ? tones.filter((pc) => pcsOf(next.rootPc, next.qualityId).includes(pc))
              : []
            const fn = diatonic.find((degree) => degree.rootPc === step.rootPc)?.harmonicFunction
            const sharedLabel = shared.map((pc) => pitchName(pc, chordAccidental(step.rootPc))).join(' ')

            const sheet = (
              <button
                type="button"
                className={`sheet flex min-h-[68px] w-full snap-start flex-col justify-between p-1.5 text-left ${
                  active ? 'wipe-in border-ink' : ''
                }`}
                onClick={() => removeFromProgression(index)}
                disabled={playing}
                title={playing ? t('transport.stop') : `${t('progression.remove')}: ${step.anglo}`}
              >
                <span className={`h-[3px] w-full ${fn ? FUNCTION_INK[fn] : 'bg-rule-strong'}`} aria-hidden="true" />
                <span className="font-mono text-[8px] text-ink-faint">{index + 1}</span>
                <span className="fv-ui text-[clamp(9px,0.72vw,13px)] font-bold leading-tight">
                  {notation === 'latin' ? step.latin : step.anglo}
                </span>
                {notation === 'both' && (
                  <span className="truncate font-mono text-[8px] text-ink-soft">{step.latin}</span>
                )}
                <span
                  className="truncate bg-turquoise px-1 font-mono text-[9px] font-semibold text-ink mix-blend-multiply"
                  title={t('a11y.sharedNotes')}
                >
                  {sharedLabel || '—'}
                </span>
              </button>
            )

            return active ? (
              <OffsetPlate key={step.id}>{sheet}</OffsetPlate>
            ) : (
              <div key={step.id}>{sheet}</div>
            )
          })}

          {ghosts.map((suggestion) => (
            <button
              key={`ghost-${suggestion.anglo}`}
              type="button"
              className="cutline flex min-h-[68px] snap-start flex-col justify-between p-1.5 text-left text-ink-faint hover:border-blue-ink hover:text-blue-ink"
              onClick={() => addSuggestion(suggestion)}
              title={`${t('suggestions.title')}: ${suggestion.reasonEs}`}
            >
              <span className="font-mono text-[8px]">+</span>
              <span className="fv-ui text-[clamp(9px,0.72vw,13px)] font-semibold leading-tight">
                {suggestion.anglo}
              </span>
              <span className="truncate font-mono text-[8px]">{suggestion.roman ?? ''}</span>
            </button>
          ))}

          {Array.from({ length: emptySlots }, (_, index) => (
            <span
              key={`empty-${index}`}
              className="min-h-[68px] border border-rule bg-paper-deep/40"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {progression.length === 0 && <p className="readout text-[11px] text-ink-faint">{t('progression.empty')}</p>}
    </section>
  )
}
