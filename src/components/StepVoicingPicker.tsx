import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { STRUMS, isStrumId } from '../audio/strums'
import { qualityById } from '../music/chords'
import { absoluteLabel, autoVoicing, voicingLabel, voicingSignature } from '../music/stepVoicing'
import { voicingsFor, type Voicing } from '../music/voicings'
import { useStore, type ProgressionStep } from '../state/store'
import { CloseIcon } from './icons'
import { StripChart } from './strip/StripChart'

// Same query as the `desk:` variant in tailwind.css.
const DESK_QUERY = '(min-width: 1024px) and (min-height: 640px)'
const EDGE = 8

export function StepVoicingPicker({
  step,
  index,
  count,
  onMove,
  onClose,
}: {
  step: ProgressionStep
  index: number
  count: number
  onMove: (to: number) => void
  onClose: () => void
}) {
  const { tuning, capo, setStepVoicing, removeFromProgression, moveStep, notation, lang, strum, setStepStrum, t } = useStore()
  const move = (to: number) => {
    moveStep(index, to)
    onMove(to)
  }
  const container = useRef<HTMLDivElement | null>(null)
  const notch = useRef<HTMLSpanElement | null>(null)

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

  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    container.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // On `desk` the picker floats above the strip: centre it over the tapped step, clamped inside the viewport,
  // with the notch pointing at the step.
  useLayoutEffect(() => {
    const place = () => {
      const dialog = container.current
      if (!dialog) return
      dialog.style.left = ''
      dialog.style.width = ''
      const parent = dialog.offsetParent as HTMLElement | null
      const sheet = document.querySelector<HTMLElement>(`[data-step-index="${index}"]`)
      const desk = typeof window.matchMedia === 'function' && window.matchMedia(DESK_QUERY).matches
      if (!desk || !parent || !sheet) return
      const width = dialog.offsetWidth
      const parentRect = parent.getBoundingClientRect()
      const sheetRect = sheet.getBoundingClientRect()
      const center = sheetRect.left + sheetRect.width / 2
      const left = Math.max(EDGE, Math.min(center - width / 2, window.innerWidth - EDGE - width))
      dialog.style.width = `${width}px`
      dialog.style.left = `${left - parentRect.left}px`
      if (notch.current) notch.current.style.left = `${Math.max(12, Math.min(width - 12, center - left))}px`
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [index, step.id])

  return (
    <div
      ref={container}
      role="dialog"
      aria-label={`${t('voicing.pick')}: ${step.anglo}`}
      tabIndex={-1}
      className="cc-pop strip-picker"
    >
      <span
        ref={notch}
        className="strip-picker__notch"
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="cc-label">{t('voicing.pick')}</span>
          <span className="strip-picker__name">
            {notation === 'latin' ? step.latin : step.anglo}
          </span>
          <span className="strip-picker__meta">
            {step.frets
              ? `${t('voicing.shape')}: ${step.voicingLabel ?? voicingLabel(step.frets)}${
                  capo > 0 ? ` · ${t('voicing.absolute')}: ${absoluteLabel(step.frets, capo)}` : ''
                }`
              : `${t('voicing.auto')} · ${auto ? voicingLabel(auto.frets) : '—'}`}
          </span>
        </div>
        <button type="button" className="cc-btn cc-btn--icon strip__btn" onClick={onClose} aria-label={t('voicing.close')}>
          <CloseIcon size={16} />
        </button>
      </div>

      <div className="strip-picker__grid">
        <button
          type="button"
          className="strip-voicing"
          aria-pressed={currentSignature === null}
          onClick={() => {
            setStepVoicing(index, null)
            onClose()
          }}
        >
          {auto ? (
            <StripChart frets={auto.frets} />
          ) : (
            <span className="grid h-[46px] w-[40px] place-items-center text-[11px]">—</span>
          )}
          <span className="strip-voicing__tag">
            {t('voicing.auto')}
          </span>
          <span className="strip-voicing__frets">
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
              className="strip-voicing"
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
              <StripChart frets={voicing.frets} />
              <span className="strip-voicing__tag">
                {label}
              </span>
              <span className="strip-voicing__frets">
                {voicingLabel(voicing.frets)}
              </span>
            </button>
          )
        })}
      </div>

      <label className="strip-picker__row">
        <span className="cc-label">{t('voicing.strum')}</span>
        <select
          className="cc-btn strip-select"
          value={step.strum ?? ''}
          onChange={(event) => setStepStrum(index, isStrumId(event.target.value) ? event.target.value : null)}
        >
          <option value="">
            {t('strum.global')} ({(lang === 'es' ? STRUMS.find((s) => s.id === strum)?.nameEs : STRUMS.find((s) => s.id === strum)?.nameEn) ?? ''})
          </option>
          {STRUMS.map((item) => (
            <option key={item.id} value={item.id}>
              {lang === 'es' ? item.nameEs : item.nameEn} {item.glyph}
            </option>
          ))}
        </select>
      </label>

      <div className="strip-picker__foot">
        {count > 1 && (
          <div className="flex gap-1.5">
            <button
              type="button"
              className="cc-btn strip__btn"
              onClick={() => move(index - 1)}
              disabled={index === 0}
              aria-label={t('voicing.moveLeftLabel')}
            >
              {t('voicing.moveLeft')}
            </button>
            <button
              type="button"
              className="cc-btn strip__btn"
              onClick={() => move(index + 1)}
              disabled={index >= count - 1}
              aria-label={t('voicing.moveRightLabel')}
            >
              {t('voicing.moveRight')}
            </button>
          </div>
        )}
        <button
          type="button"
          className="cc-btn strip__btn"
          onClick={() => {
            removeFromProgression(index)
            onClose()
          }}
        >
          {t('voicing.removeStep')}
        </button>
        <span className="strip__muted">{t('voicing.removeHint')}</span>
      </div>
    </div>
  )
}
