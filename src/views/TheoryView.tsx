import { useMemo, useState } from 'react'
import { SuggestionsPanel } from '../components/SuggestionsPanel'
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
    chord,
    setChord,
    loadProgression,
  } = useStore()
  const [sevenths, setSevenths] = useState(false)

  const diatonic = useMemo(() => diatonicChords(keyRootPc, keyMode, sevenths), [keyRootPc, keyMode, sevenths])
  const isCurrent = (rootPc: number, qualityId: string) =>
    chord.bassPc === null && chord.rootPc === rootPc && chord.quality.id === qualityId
  const progressions = useMemo(() => PROGRESSIONS.filter((item) => item.mode === keyMode), [keyMode])

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(320px,1.1fr)_minmax(320px,1fr)] desk:h-full desk:min-h-0 desk:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)] desk:grid-rows-[minmax(0,1fr)] desk:items-stretch desk:gap-2">
      <section className="plate flex flex-col gap-4 p-4 desk:min-h-0 desk:gap-2 desk:p-3">
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
              className="stamp min-w-7 px-1.5 py-0.5"
              aria-pressed={sevenths}
              aria-label={t('a11y.sevenths')}
              title={t('a11y.sevenths')}
              onClick={() => setSevenths(!sevenths)}
            >
              7
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-1.5 desk:grid-cols-12 desk:gap-1">
          {PITCH_SHARP.map((name, pc) => (
            <button
              key={name}
              type="button"
              className="stamp flex-col gap-0 px-1 py-1 desk:min-h-[clamp(32px,4.5vh,48px)] desk:py-0.5"
              aria-pressed={pc === keyRootPc}
              onClick={() => setKeyRootPc(pc)}
            >
              <span className="text-[0.8125rem] font-bold leading-none">{name}</span>
              <span className="font-mono text-[10px] leading-tight opacity-70">{LATIN_SHARP[pc]}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 desk:grid-cols-7 desk:gap-1.5">
          {diatonic.map((degree) => (
            <button
              key={`${degree.roman}-${degree.rootPc}`}
              type="button"
              aria-pressed={isCurrent(degree.rootPc, degree.qualityId)}
              className={`sheet flex min-w-0 flex-col items-start gap-0.5 overflow-hidden px-3 py-2 text-left desk:h-[clamp(64px,11vh,124px)] desk:justify-between desk:gap-0 desk:px-2 desk:py-1.5 ${
                isCurrent(degree.rootPc, degree.qualityId) ? 'border-ink bg-paper-deep' : ''
              }`}
              onClick={() => {
                const parsed = parseChord(degree.anglo)
                if (parsed) setChord(parsed)
              }}
            >
              <span className={`-mx-3 -mt-2 mb-1 h-[3px] w-[calc(100%+1.5rem)] desk:-mx-2 desk:-mt-1.5 desk:w-[calc(100%+1rem)] ${FUNCTION_INK[degree.harmonicFunction]}`} aria-hidden="true" />
              <span className="font-mono text-[11px] text-blue-ink desk:text-[clamp(11px,1.3vh,14px)]">{degree.roman}</span>
              <span className="fv-ui max-w-full truncate text-[1rem] font-bold desk:text-[clamp(1rem,2.4vh,1.75rem)] desk:leading-tight">{notation === 'latin' ? degree.latin : degree.anglo}</span>
              <span className="label-ink max-w-full truncate text-blue-ink desk:tracking-[0.04em]">{t(functionLabelKey(degree.harmonicFunction))}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-rule pt-3 desk:min-h-0 desk:flex-1 desk:gap-1.5 desk:pt-2">
          <h3 className="label-ink text-blue-ink">{t('theory.progressions')}</h3>
          <div className="flex flex-col gap-2 desk:grid desk:min-h-0 desk:flex-1 desk:auto-rows-[minmax(auto,4.25rem)] desk:content-start desk:grid-cols-2 desk:gap-x-4 desk:gap-y-1.5 desk:overflow-y-auto desk:pr-1">
            {progressions.map((template) => {
              const steps = resolveProgression(template, keyRootPc)
              return (
                <div className="flex items-center justify-between gap-3" key={template.id}>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="fv-ui truncate text-[0.9375rem] font-semibold desk:text-[clamp(0.875rem,1.6vh,1.0625rem)] desk:leading-tight">
                      {lang === 'es' ? template.nameEs : template.nameEn}
                    </span>
                    <span className="truncate font-mono text-[10px] text-ink-soft desk:line-clamp-2 desk:whitespace-normal desk:text-[clamp(10px,1.15vh,12px)]">
                      {steps.map((step) => step.anglo).join(' · ')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="stamp shrink-0 desk:min-h-[28px] desk:py-0.5"
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
        </div>
      </section>

      <div className="flex min-w-0 flex-col desk:min-h-0 desk:*:min-h-0 desk:*:flex-1">
        <SuggestionsPanel />
      </div>

    </div>
  )
}
