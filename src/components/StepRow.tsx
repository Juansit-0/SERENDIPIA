import { useMemo, useState, type DragEvent, type KeyboardEvent } from 'react'
import { chordTones, qualityById } from '../music/chords'
import { chordAccidental, pitchName } from '../music/notes'
import { diatonicChords, type HarmonicFunction } from '../music/scales'
import { useStore } from '../state/store'
import { OffsetPlate } from './OffsetPlate'
import { StepVoicingPicker } from './StepVoicingPicker'

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
    moveStep,
    clearProgression,
    suggestions,
    addSuggestion,
    notation,
    keyRootPc,
    keyMode,
    t,
  } = useStore()

  const [pickerStepId, setPickerStepId] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const diatonic = useMemo(() => diatonicChords(keyRootPc, keyMode), [keyRootPc, keyMode])

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
    setAnnouncement(`${t('a11y.stepMoved')} ${target + 1}`)
  }

  const handleMoveKey = (event: KeyboardEvent<HTMLElement>, index: number) => {
    if (playing || !(event.ctrlKey || event.metaKey)) return
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const target = event.key === 'ArrowLeft' ? index - 1 : index + 1
    if (target < 0 || target >= progression.length) return
    moveStep(index, target)
    setAnnouncement(`${t('a11y.stepMoved')} ${target + 1}`)
  }

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
          {progression.length > 1 && (
            <span className="readout hidden text-[10px] text-ink-faint lg:inline">{t('progression.reorderHint')}</span>
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

            const dragging = dragIndex === index

            const sheet = (
              <button
                type="button"
                className={`sheet flex min-h-[68px] w-full snap-start flex-col justify-between p-1.5 text-left ${
                  active ? 'wipe-in border-ink' : ''
                } ${dragging ? 'border-dashed opacity-40' : ''}`}
                data-step-index={index}
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
                <span className="font-mono text-[8px] text-ink-faint">{index + 1}</span>
                <span className="fv-ui text-[clamp(9px,0.72vw,13px)] font-bold leading-tight">
                  {notation === 'latin' ? step.latin : step.anglo}
                </span>
                {notation === 'both' && (
                  <span className="truncate font-mono text-[8px] text-ink-soft">{step.latin}</span>
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
              onDragOver={(event) => handleDragOver(event, progression.length + ghosts.length + index)}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>

      {progression.length === 0 && <p className="readout text-[11px] text-ink-faint">{t('progression.empty')}</p>}

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
