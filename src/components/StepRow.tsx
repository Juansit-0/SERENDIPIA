import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import { keyName, type ChordStatus, type TransitionAnalysis, type TransitionTone } from '../music/analysis'
import { chordTones, qualityById } from '../music/chords'
import { chordAccidental, keyAccidental, pitchName } from '../music/notes'
import { diatonicChords, type HarmonicFunction } from '../music/scales'
import { usePlayheadStep } from '../state/playhead'
import { useStore } from '../state/store'
import { OffsetPlate } from './OffsetPlate'
import { StepVoicingPicker } from './StepVoicingPicker'

const SLOTS = 16

const MARK_INK: Record<TransitionTone, string> = {
  resolve: 'border-ink bg-turquoise text-ink',
  tension: 'border-blue-ink bg-paper text-blue-ink',
  surprise: 'border-red-ink bg-paper text-red-ink',
  color: 'border-ink bg-paper-deep text-ink',
  smooth: 'border-rule-strong bg-paper text-ink-soft',
  neutral: 'border-rule-strong bg-paper text-ink-soft',
  repeat: 'border-rule-strong bg-paper text-ink-faint',
}

const STATUS_INK: Record<ChordStatus, string> = {
  diatonic: 'text-ink-faint',
  secondary: 'text-blue-ink font-semibold',
  borrowed: 'text-blue-ink font-semibold',
  chromatic: 'text-red-ink font-semibold',
}

const FUNCTION_INK: Record<HarmonicFunction, string> = {
  tonic: 'ink-rule--tonic',
  subdominant: 'ink-rule--subdominant',
  dominant: 'ink-rule--dominant',
}

export function StepRow() {
  const {
    progression,
    playing,
    removeFromProgression,
    moveStep,
    clearProgression,
    nextSteps,
    addSuggestion,
    analysis,
    keyAuto,
    detectedKey,
    notation,
    keyRootPc,
    keyMode,
    lang,
    t,
  } = useStore()

  const activeStep = usePlayheadStep()
  const [pickerStepId, setPickerStepId] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [pickedTransition, setPickedTransition] = useState<number | null>(null)
  // Show the picked change, or by default the most recent one (the chords just added).
  const transitionIndex =
    pickedTransition !== null && pickedTransition < analysis.transitions.length
      ? pickedTransition
      : analysis.transitions.length - 1
  const shownTransition: TransitionAnalysis | undefined = analysis.transitions[transitionIndex]
  const focusStepId = useRef<string | null>(null)
  const diatonic = useMemo(() => diatonicChords(keyRootPc, keyMode), [keyRootPc, keyMode])

  // After a move, keep keyboard focus on the moved step at its new position.
  useEffect(() => {
    if (!focusStepId.current) return
    const index = progression.findIndex((step) => step.id === focusStepId.current)
    focusStepId.current = null
    if (index !== -1) document.querySelector<HTMLElement>(`[data-step-index="${index}"]`)?.focus()
  }, [progression])

  const announceMove = (from: number, to: number) => {
    const step = progression[from]
    const name = notation === 'latin' ? step.latin : step.anglo
    // Alternate a trailing invisible char so identical messages are still re-announced.
    setAnnouncement((previous) => `${name}: ${t('a11y.stepMoved')} ${to + 1}${previous.endsWith('\u200b') ? '' : '\u200b'}`)
  }

  const resetDrag = () => {
    setDragIndex(null)
    setDropIndex(null)
  }

  const handleDragOver = (event: DragEvent<HTMLElement>, index: number) => {
    if (dragIndex === null) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const rect = event.currentTarget.getBoundingClientRect()
    const before = event.clientX < rect.left + rect.width / 2
    setDropIndex(Math.min(before ? index : index + 1, progression.length))
  }

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    const from = dragIndex
    const raw = dropIndex ?? progression.length
    resetDrag()
    if (from === null) return
    const target = Math.max(0, Math.min(raw > from ? raw - 1 : raw, progression.length - 1))
    if (target === from) return
    moveStep(from, target)
    announceMove(from, target)
  }

  const handleMoveKey = (event: KeyboardEvent<HTMLElement>, index: number) => {
    if (playing || !(event.altKey || event.ctrlKey || event.metaKey)) return
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const target = event.key === 'ArrowLeft' ? index - 1 : index + 1
    if (target < 0 || target >= progression.length) return
    moveStep(index, target)
    announceMove(index, target)
    focusStepId.current = progression[index].id
  }

  const pcsOf = (rootPc: number, qualityId: Parameters<typeof qualityById>[0]) =>
    chordTones(rootPc, qualityById(qualityId))

  const ghosts = nextSteps.slice(0, Math.max(0, SLOTS - progression.length))
  const emptySlots = Math.max(0, SLOTS - progression.length - ghosts.length)

  return (
    <section className="plate flex min-w-0 flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="label-ink text-blue-ink">{t('progression.title')}</h2>
          <span className="label-ink sm:hidden">{t('progression.swipe')}</span>
          {progression.length > 1 && (
            <span id="step-reorder-hint" className="readout sr-only text-[10px] text-ink-faint lg:not-sr-only">
              {t('progression.reorderHint')}
            </span>
          )}
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

      <div className="-mx-1 min-w-0 overflow-x-auto px-1 pt-3 pb-2">
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

            const dragging = dragIndex === index

            const sheet = (
              <button
                type="button"
                className={`sheet flex min-h-[68px] w-full snap-start flex-col justify-between p-1.5 text-left ${
                  active ? 'wipe-in border-ink' : ''
                } ${dragging ? 'border-dashed opacity-40' : ''}`}
                data-step-index={index}
                aria-describedby={progression.length > 1 ? 'step-reorder-hint' : undefined}
                draggable={!playing}
                onDragStart={(event) => {
                  setDragIndex(index)
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', String(index))
                }}
                onDragEnd={resetDrag}
                onKeyDown={(event) => handleMoveKey(event, index)}
                onClick={(event) => {
                  if (event.altKey) {
                    removeFromProgression(index)
                    return
                  }
                  setPickerStepId(step.id)
                }}
                disabled={playing}
                title={playing ? t('transport.stop') : `${t('voicing.pick')}: ${step.anglo}`}
              >
                <span className={`h-[3px] w-full ${fn ? FUNCTION_INK[fn] : 'bg-rule-strong'}`} aria-hidden="true" />
                <span className="flex items-baseline gap-1 font-mono text-[8px] text-ink-faint">
                  {index + 1}
                  {analysis.chords[index] && (
                    <span className={`truncate ${STATUS_INK[analysis.chords[index].status]}`}>
                      {analysis.chords[index].roman}
                    </span>
                  )}
                </span>
                <span className="fv-ui text-[clamp(9px,0.72vw,13px)] font-bold leading-tight">
                  {notation === 'latin' ? step.latin : step.anglo}
                </span>
                {notation === 'both' && (
                  <span className="fv-ui truncate text-[9px] text-ink-soft">{step.latin}</span>
                )}
                <span className="flex items-center gap-1">
                  <span
                    className={`truncate px-1 font-mono text-[8px] ${
                      step.frets
                        ? 'bg-turquoise font-semibold text-ink mix-blend-multiply'
                        : 'text-ink-faint'
                    }`}
                    title={step.frets ? t('voicing.step') : t('voicing.auto')}
                  >
                    {step.voicingLabel ?? t('voicing.auto')}
                  </span>
                </span>
                <span
                  className="truncate bg-turquoise px-1 font-mono text-[9px] font-semibold text-ink mix-blend-multiply"
                  title={t('a11y.sharedNotes')}
                >
                  {sharedLabel || '—'}
                </span>
              </button>
            )

            return (
              <div
                key={step.id}
                className="relative"
                onDragOver={(event) => handleDragOver(event, index)}
                onDrop={handleDrop}
              >
                {dragIndex !== null && dropIndex === index && (
                  <span
                    className="pointer-events-none absolute inset-y-0 -left-[4px] z-10 w-[3px] bg-ink"
                    aria-hidden="true"
                  />
                )}
                {dragIndex !== null && dropIndex === progression.length && index === progression.length - 1 && (
                  <span
                    className="pointer-events-none absolute inset-y-0 -right-[4px] z-10 w-[3px] bg-ink"
                    aria-hidden="true"
                  />
                )}
                {active ? <OffsetPlate>{sheet}</OffsetPlate> : sheet}
                {analysis.transitions[index] && (
                  <button
                    type="button"
                    className={`absolute -right-[11px] top-0 z-20 grid h-[18px] w-[18px] -translate-y-1/2 place-items-center rounded-full border font-mono text-[10px] leading-none after:absolute after:-inset-2 after:content-[''] ${
                      MARK_INK[analysis.transitions[index].tone]
                    } ${transitionIndex === index ? 'ring-2 ring-ink ring-offset-1 ring-offset-paper' : ''}`}
                    aria-pressed={transitionIndex === index}
                    aria-label={`${t('analysis.change')} ${index + 1}–${index + 2}: ${
                      lang === 'es' ? analysis.transitions[index].titleEs : analysis.transitions[index].titleEn
                    }`}
                    onClick={() => setPickedTransition(index)}
                  >
                    {analysis.transitions[index].mark}
                  </button>
                )}
              </div>
            )
          })}

          {ghosts.map((suggestion, ghostIndex) => (
            <button
              key={`ghost-${suggestion.anglo}`}
              type="button"
              className="cutline flex min-h-[68px] snap-start flex-col justify-between p-1.5 text-left text-ink-faint hover:border-blue-ink hover:text-blue-ink"
              onClick={() => addSuggestion(suggestion)}
              onDragOver={(event) => handleDragOver(event, progression.length + ghostIndex)}
              onDrop={handleDrop}
              title={`${t('suggestions.title')}: ${lang === 'es' ? suggestion.reasonEs : suggestion.reasonEn}`}
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
              onDragOver={(event) => handleDragOver(event, progression.length + ghosts.length + index)}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>

      {progression.length === 0 && <p className="readout text-[11px] text-ink-faint">{t('progression.empty')}</p>}

      {progression.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-rule pt-2" aria-live="polite">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="label-ink text-blue-ink">{t('analysis.key')}</span>
            <span className="fv-ui text-[13px] font-semibold">
              {keyName({ rootPc: keyRootPc, mode: keyMode }, lang)}
            </span>
            {keyAuto && detectedKey && <span className="readout text-[10px] text-ink-faint">{t('analysis.auto')}</span>}
          </p>
          {shownTransition ? (
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span
                className={`grid h-[18px] w-[18px] shrink-0 place-items-center self-center rounded-full border font-mono text-[10px] leading-none ${
                  MARK_INK[shownTransition.tone]
                }`}
                aria-hidden="true"
              >
                {shownTransition.mark}
              </span>
              <span className="fv-ui text-[13px] font-semibold">
                {lang === 'es' ? shownTransition.titleEs : shownTransition.titleEn}
              </span>
              <span className="text-[12px] leading-snug text-ink-soft">
                {lang === 'es' ? shownTransition.detailEs : shownTransition.detailEn}
              </span>
              {shownTransition.commonTones.length > 0 && (
                <span className="readout text-[10px] text-ink-faint">
                  {t('analysis.common')}:{' '}
                  {shownTransition.commonTones.map((pc) => pitchName(pc, keyAccidental(keyRootPc, keyMode))).join(' ')}
                </span>
              )}
            </p>
          ) : (
            <p className="text-[12px] text-ink-soft">{t('analysis.addMore')}</p>
          )}
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {pickerStepId !== null &&
        (() => {
          const pickerIndex = progression.findIndex((item) => item.id === pickerStepId)
          if (pickerIndex === -1) return null
          return (
            <StepVoicingPicker
              step={progression[pickerIndex]}
              index={pickerIndex}
              count={progression.length}
              onMove={(to) => announceMove(pickerIndex, to)}
              onClose={() => {
                const anchor = document.querySelector<HTMLButtonElement>(`[data-step-index="${pickerIndex}"]`)
                setPickerStepId(null)
                anchor?.focus()
              }}
            />
          )
        })()}
    </section>
  )
}
