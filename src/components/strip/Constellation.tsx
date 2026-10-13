import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import type { ChordStatus } from '../../music/analysis'
import { diatonicChords } from '../../music/scales'
import { usePlayheadStep } from '../../state/playhead'
import { useStore } from '../../state/store'
import { useStrip } from './useStrip'
import { MarkIcon } from './MarkIcon'
import { Star, type StarFn } from './Star'

export const SLOTS = 16
const MAX_GHOSTS = 3
// Vertical rhythm of one slot (px): roman, star, name, label. Offsets bend the line gently.
const ROMAN_H = 14
const STAR_H = 26
const BEND = 4
// The lines layer only spans roman + star; the framed tile below them grows with the type size.
export const LINES_H = BEND + ROMAN_H + STAR_H

const offsetOf = (index: number) => Math.round(BEND * (1 - Math.sin((Math.PI * index) / (SLOTS - 1))))
const starY = (index: number) => offsetOf(index) + ROMAN_H + STAR_H / 2

const STATUS_WEIGHT: Record<ChordStatus, string> = {
  diatonic: '',
  secondary: 'strip-roman--strong',
  borrowed: 'strip-roman--strong',
  chromatic: 'strip-roman--strong',
}

export function Constellation({
  transitionIndex,
  onPickTransition,
  onOpenPicker,
  onAnnounce,
}: {
  transitionIndex: number
  onPickTransition: (index: number) => void
  onOpenPicker: (stepId: string) => void
  onAnnounce: (message: string) => void
}) {
  const {
    progression,
    playing,
    stepCursor,
    removeFromProgression,
    moveStep,
    nextSteps,
    addSuggestion,
    analysis,
    notation,
    keyRootPc,
    keyMode,
    lang,
    t,
  } = useStore()
  const s = useStrip()
  const activeStep = usePlayheadStep()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
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
    onAnnounce(`${name}: ${t('a11y.stepMoved')} ${to + 1}​`)
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

  const count = progression.length
  const allGhosts = nextSteps.slice(0, Math.max(0, SLOTS - count))
  const ghosts = allGhosts.slice(0, MAX_GHOSTS)
  const emptyStart = count + ghosts.length
  const emptySlots = Math.max(0, SLOTS - emptyStart)
  const lastLit = Math.max(0, count - 1)
  const dottedEnd = count > 0 ? count - 1 + ghosts.length : -1

  return (
    <div className="strip-sky" tabIndex={-1}>
      <div className="strip-track" role="group" aria-label={t('a11y.stepRow')}>
        <svg className="strip-lines" viewBox={`0 0 ${SLOTS} ${LINES_H}`} height={LINES_H} style={{ height: LINES_H }} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {Array.from({ length: Math.max(0, count - 1) }, (_, i) => (
            <line
              key={`l-${i}`}
              className={transitionIndex === i ? 'strip-line strip-line--picked' : 'strip-line'}
              x1={i + 0.5}
              y1={starY(i)}
              x2={i + 1.5}
              y2={starY(i + 1)}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {Array.from({ length: Math.max(0, dottedEnd - lastLit) }, (_, k) => (
            <line
              key={`d-${k}`}
              className="strip-line strip-line--dotted"
              x1={lastLit + k + 0.5}
              y1={starY(lastLit + k)}
              x2={lastLit + k + 1.5}
              y2={starY(lastLit + k + 1)}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {progression.map((step, index) => {
          const active = playing && activeStep === index
          const chord = analysis.chords[index]
          const diatonicFn = diatonic.find((degree) => degree.rootPc === step.rootPc)?.harmonicFunction
          const fn: StarFn = diatonicFn ?? (chord?.status === 'secondary' ? 'dominant' : 'borrowed')
          const name = notation === 'latin' ? step.latin : step.anglo
          const label = step.voicingLabel ?? t('voicing.auto')
          const dragging = dragIndex === index
          return (
            <div
              key={step.id}
              className="strip-cell"
              style={{ gridColumn: index + 1, paddingTop: offsetOf(index) }}
              onDragOver={(event) => handleDragOver(event, index)}
              onDrop={handleDrop}
            >
              {dragIndex !== null && dropIndex === index && <span className="strip-drop strip-drop--before" aria-hidden="true" />}
              {dragIndex !== null && dropIndex === count && index === count - 1 && (
                <span className="strip-drop strip-drop--after" aria-hidden="true" />
              )}
              <button
                type="button"
                className={`strip-step${active ? ' is-active' : ''}${!playing && stepCursor === index ? ' is-cursor' : ''}${dragging ? ' is-dragging' : ''}`}
                data-step-index={index}
                data-fn={fn}
                aria-describedby={count > 1 ? 'step-reorder-hint' : undefined}
                aria-haspopup="dialog"
                aria-current={active ? 'step' : undefined}
                draggable={!playing}
                onDragStart={(event) => {
                  setDragIndex(index)
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', String(index))
                  onAnnounce(`${s('reorderStart')}​`)
                }}
                onDragEnd={resetDrag}
                onKeyDown={(event) => handleMoveKey(event, index)}
                onClick={(event) => {
                  if (event.altKey) {
                    removeFromProgression(index)
                    return
                  }
                  onOpenPicker(step.id)
                }}
                disabled={playing}
                title={playing ? t('transport.stop') : `${t('voicing.pick')}: ${step.anglo}`}
              >
                <span className={`strip-roman ${chord ? STATUS_WEIGHT[chord.status] : ''}`}>{chord?.roman ?? ' '}</span>
                <Star fn={fn} active={active} />
                <span className="strip-tile">
                  <span className="strip-name" title={notation === 'both' ? `${step.anglo} · ${step.latin}` : undefined}>
                    {name}
                  </span>
                  <span
                    className={`strip-frets${step.frets ? ' strip-frets--set' : ''}`}
                    title={step.frets ? t('voicing.step') : t('voicing.auto')}
                  >
                    {label}
                  </span>
                </span>
              </button>
            </div>
          )
        })}

        {ghosts.map((suggestion, ghostIndex) => (
          <div
            key={`ghost-${suggestion.anglo}`}
            className="strip-cell"
            style={{ gridColumn: count + ghostIndex + 1, paddingTop: offsetOf(count + ghostIndex) }}
            onDragOver={(event) => handleDragOver(event, count + ghostIndex)}
            onDrop={handleDrop}
          >
            <button
              type="button"
              className="strip-ghost"
              data-fn="tonic"
              onClick={() => addSuggestion(suggestion)}
              aria-label={`${s('ghostAdd')}: ${suggestion.anglo}`}
              title={`${t('suggestions.title')}: ${lang === 'es' ? suggestion.reasonEs : suggestion.reasonEn}`}
            >
              <span className="strip-roman">{suggestion.roman ?? ' '}</span>
              <Star fn="tonic" ghost />
              <span className="strip-tile">
                <span className="strip-name">+ {suggestion.anglo}</span>
                <span className="strip-frets">{s('ghost')}</span>
              </span>
            </button>
          </div>
        ))}

        {Array.from({ length: emptySlots }, (_, index) => (
          <div
            key={`empty-${index}`}
            className="strip-cell strip-cell--empty"
            style={{ gridColumn: emptyStart + index + 1, paddingTop: offsetOf(emptyStart + index) }}
            aria-hidden="true"
            onDragOver={(event) => handleDragOver(event, emptyStart + index)}
            onDrop={handleDrop}
          >
            <span className="strip-dot" style={{ marginTop: ROMAN_H + STAR_H / 2 - 2 }}>
              {index === 0 && ghosts.length < allGhosts.length ? <span className="strip-more">…</span> : null}
            </span>
          </div>
        ))}

        {analysis.transitions.map((transition, index) => {
          if (index >= count - 1) return null
          const picked = transitionIndex === index
          return (
            <button
              key={`mark-${index}`}
              type="button"
              className="strip-mark"
              data-tone={transition.tone}
              aria-pressed={picked}
              style={{ left: `${((index + 1) / SLOTS) * 100}%`, top: (starY(index) + starY(index + 1)) / 2 - 12 }}
              aria-label={`${t('analysis.change')} ${index + 1}–${index + 2}: ${lang === 'es' ? transition.titleEs : transition.titleEn}`}
              title={lang === 'es' ? transition.titleEs : transition.titleEn}
              onClick={() => onPickTransition(index)}
            >
              <MarkIcon transition={transition} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
