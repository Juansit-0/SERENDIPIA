import { useMemo, useState } from 'react'
import { StepRow } from '../components/StepRow'
import { LATIN_SHARP, PITCH_SHARP } from '../music/notes'
import { parseChord } from '../music/parseChord'
import { PROGRESSIONS, resolveProgression } from '../music/progressions'
import { diatonicChords, functionLabelKey, type HarmonicFunction } from '../music/scales'

const FUNCTION_INK: Record<HarmonicFunction, string> = {
  tonic: 'ink-rule--tonic',
  subdominant: 'ink-rule--subdominant',
  dominant: 'ink-rule--dominant',
}
import { useStore } from '../state/store'

export function TheoryView() {
  const {
    keyRootPc,
    keyMode,
    setKeyRootPc,
    setKeyMode,
    t,
    lang,
    notation,
    setChord,
    loadProgression,
    suggestions,
    addSuggestion,
  } = useStore()
  const [sevenths, setSevenths] = useState(false)

  const diatonic = useMemo(() => diatonicChords(keyRootPc, keyMode, sevenths), [keyRootPc, keyMode, sevenths])
  const progressions = useMemo(() => PROGRESSIONS.filter((item) => item.mode === keyMode), [keyMode])

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(320px,1.1fr)_minmax(320px,1fr)]">
      <section className="plate flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="label-ink text-blue-ink">{t('theory.diatonic')}</h2>
          <div className="flex gap-1.5">
            <button
              type="button"
              className="stamp px-1.5 py-0.5"
              aria-pressed={keyMode === 'major'}
              onClick={() => setKeyMode('major')}
            >
              {t('theory.mode.major')}
            </button>
            <button
              type="button"
              className="stamp px-1.5 py-0.5"
              aria-pressed={keyMode === 'minor'}
              onClick={() => setKeyMode('minor')}
            >
              {t('theory.mode.minor')}
            </button>
            <button
              type="button"
              className="stamp px-1.5 py-0.5"
              aria-pressed={sevenths}
              aria-label={t('a11y.sevenths')}
              title={t('a11y.sevenths')}
              onClick={() => setSevenths(!sevenths)}
            >
              7
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {PITCH_SHARP.map((name, pc) => (
            <button
              key={name}
              type="button"
              className="stamp flex-col gap-0 px-1 py-1"
              aria-pressed={pc === keyRootPc}
              onClick={() => setKeyRootPc(pc)}
            >
              <span className="text-[0.8125rem] font-bold leading-none">{name}</span>
              <span className="font-mono text-[7px] opacity-70">{LATIN_SHARP[pc]}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {diatonic.map((degree) => (
            <button
              key={`${degree.roman}-${degree.rootPc}`}
              type="button"
              className="sheet flex flex-col items-start gap-0.5 overflow-hidden px-3 py-2 text-left"
              onClick={() => {
                const parsed = parseChord(degree.anglo)
                if (parsed) setChord(parsed)
              }}
            >
              <span className={`-mx-3 -mt-2 mb-1 h-[3px] w-[calc(100%+1.5rem)] ${FUNCTION_INK[degree.harmonicFunction]}`} aria-hidden="true" />
              <span className="font-mono text-[11px] text-blue-ink">{degree.roman}</span>
              <span className="fv-ui text-[1rem] font-bold">{notation === 'latin' ? degree.latin : degree.anglo}</span>
              <span className="label-ink text-blue-ink">{t(functionLabelKey(degree.harmonicFunction))}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-rule pt-3">
          <h3 className="label-ink text-blue-ink">{t('suggestions.title')}</h3>
          <div className="flex flex-col gap-2">
            {suggestions.map((suggestion) => (
              <div className="flex items-stretch gap-2" key={suggestion.anglo}>
                <button
                  type="button"
                  className="sheet flex flex-1 flex-col items-start gap-0.5 px-3 py-2 text-left"
                  onClick={() => {
                    const parsed = parseChord(suggestion.anglo)
                    if (parsed) setChord(parsed)
                  }}
                >
                  <span className="fv-ui text-[1rem] font-bold">
                    {suggestion.roman ? `${suggestion.roman} · ` : ''}
                    {notation === 'latin' ? suggestion.latin : suggestion.anglo}
                  </span>
                  <span className="text-[10px] leading-snug text-ink-soft">
                    {lang === 'es' ? suggestion.reasonEs : suggestion.reasonEn}
                  </span>
                </button>
                <button
                  type="button"
                  className="stamp px-2"
                  onClick={() => addSuggestion(suggestion)}
                  aria-label={t('progression.add')}
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="plate flex flex-col gap-3 p-4">
        <h2 className="label-ink text-blue-ink">{t('theory.progressions')}</h2>
        <div className="flex flex-col gap-2">
          {progressions.map((template) => {
            const steps = resolveProgression(template, keyRootPc)
            return (
              <div className="flex items-center justify-between gap-3" key={template.id}>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="fv-ui text-[0.9375rem] font-semibold">
                    {lang === 'es' ? template.nameEs : template.nameEn}
                  </span>
                  <span className="truncate font-mono text-[10px] text-ink-soft">
                    {steps.map((step) => step.anglo).join(' · ')}
                  </span>
                </div>
                <button
                  type="button"
                  className="stamp shrink-0"
                  onClick={() =>
                    loadProgression(
                      steps.map((step) => ({
                        rootPc: step.rootPc,
                        qualityId: step.qualityId,
                        anglo: step.anglo,
                        latin: step.latin,
                      })),
                    )
                  }
                >
                  {t('theory.load')}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <div className="min-w-0 xl:col-span-2">
        <StepRow />
      </div>
    </div>
  )
}
