import { useState } from 'react'
import { keyName, type TransitionAnalysis } from '../music/analysis'
import { keyAccidental, pitchName } from '../music/notes'
import { songsText } from '../i18n/songs'
import { useStore } from '../state/store'
import '../styles/strip.css'
import { RedoIcon, UndoIcon } from './icons'
import { ProgressionTools } from './ProgressionTools'
import { Constellation, SLOTS } from './strip/Constellation'
import { MarkIcon } from './strip/MarkIcon'
import { StepVoicingPicker } from './StepVoicingPicker'

/** The progression as a constellation, on a band at the foot of the app. */
export function StepRow() {
  const {
    progression,
    playing,
    songPlay,
    analysis,
    keyAuto,
    detectedKey,
    chainProgression,
    capoSuggestion,
    applyCapoSuggestion,
    undo,
    redo,
    canUndo,
    canRedo,
    notation,
    keyRootPc,
    keyMode,
    lang,
    t,
  } = useStore()

  const [pickerStepId, setPickerStepId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [pickedTransition, setPickedTransition] = useState<number | null>(null)
  // Show the picked change, or by default the most recent one (the chords just added).
  const transitionIndex =
    pickedTransition !== null && pickedTransition < analysis.transitions.length
      ? pickedTransition
      : analysis.transitions.length - 1
  const shownTransition: TransitionAnalysis | undefined = analysis.transitions[transitionIndex]

  // Alternate a trailing invisible char so identical messages are still re-announced.
  const announce = (message: string) => setAnnouncement((previous) => `${message}${previous.endsWith('\u200b') ? '' : '\u200b'}`)

  const announceMove = (from: number, to: number) => {
    const step = progression[from]
    const name = notation === 'latin' ? step.latin : step.anglo
    announce(`${name}: ${t('a11y.stepMoved')} ${to + 1}`)
  }


  return (
    <section className="strip relative min-w-0 desk:shrink-0" aria-label={t('progression.title')}>
      <div className="strip__checker" aria-hidden="true" />

      <div className="strip__bar">
        <h2 className="strip__title" title={t('progression.reorderHint')}>
          {t('progression.title')} <span className="cc-num strip__count">
            <span aria-hidden="true">
              {progression.length}/{SLOTS}
            </span>
            <span className="sr-only">
              {progression.length} / {SLOTS}
            </span>
          </span>
        </h2>
        {playing && songPlay && <SongBadge />}
        {progression.length > 1 && (
          <span id="step-reorder-hint" className="sr-only">
            {t('progression.reorderHint')}
          </span>
        )}
        <button type="button" className="cc-btn cc-btn--icon strip__btn" onClick={undo} disabled={!canUndo} aria-label={t('history.undo')} title={`${t('history.undo')} (⌘Z)`}>
          <UndoIcon size={16} />
        </button>
        <button type="button" className="cc-btn cc-btn--icon strip__btn" onClick={redo} disabled={!canRedo} aria-label={t('history.redo')} title={`${t('history.redo')} (⌘⇧Z)`}>
          <RedoIcon size={16} />
        </button>
        {progression.length > 1 && (
          <button
            type="button"
            className="cc-btn strip__btn"
            onClick={() => {
              chainProgression()
              setAnnouncement(t('progression.chained'))
            }}
            disabled={playing}
            title={t('progression.chainHint')}
            aria-describedby="chain-hint"
          >
            {t('progression.chain')}
            <span id="chain-hint" className="sr-only">
              {t('progression.chainHint')}
            </span>
          </button>
        )}
        {progression.length > 0 && (
          <p className="strip__key">
            <span>{t('analysis.key')}</span>{' '}
            <b>{keyName({ rootPc: keyRootPc, mode: keyMode }, lang)}</b>
            {keyAuto && detectedKey && (
              <>
                {' · '}
                <span className="strip__muted">{t('analysis.auto')}</span>
              </>
            )}
          </p>
        )}
        <ProgressionTools onAnnounce={(message) => setAnnouncement(message)} />
      </div>

      <Constellation
        transitionIndex={transitionIndex}
        onPickTransition={setPickedTransition}
        onOpenPicker={setPickerStepId}
        onAnnounce={announce}
      />

      <div className="strip__foot" aria-live="polite">
        {progression.length === 0 ? (
          <p className="strip__analysis">{t('progression.empty')}</p>
        ) : shownTransition ? (
          <p className="strip__analysis">
            <span className="strip__tone" data-tone={shownTransition.tone} aria-hidden="true">
              <MarkIcon transition={shownTransition} size={14} />
            </span>
            <b>{lang === 'es' ? shownTransition.titleEs : shownTransition.titleEn}</b>
            <span className="strip__detail" title={lang === 'es' ? shownTransition.detailEs : shownTransition.detailEn}>
              {lang === 'es' ? shownTransition.detailEs : shownTransition.detailEn}
            </span>
            {shownTransition.commonTones.length > 0 && (
              <span className="strip__common">
                {t('analysis.common')}:{' '}
                {shownTransition.commonTones.map((pc) => pitchName(pc, keyAccidental(keyRootPc, keyMode))).join(' ')}
              </span>
            )}
          </p>
        ) : (
          <p className="strip__analysis">{t('analysis.addMore')}</p>
        )}
        {capoSuggestion && (
          <p className="cc-chip strip__capo" title={t('capo.easier')}>
            <span className="strip__capo-label">{t('capo.recommend')}</span>
            <b>{capoSuggestion.capo === 0 ? t('capo.without') : `${t('capo.with')} ${capoSuggestion.capo}`}</b>
            <span className="strip__muted">
              {capoSuggestion.shapes.map((shape) => (notation === 'latin' ? shape.latin : shape.anglo)).join(' · ')}
            </span>
            <button
              type="button"
              className="cc-btn cc-btn--primary strip__apply"
              onClick={() => {
                applyCapoSuggestion(capoSuggestion)
                setAnnouncement(`${t('capo.with')} ${capoSuggestion.capo}`)
              }}
              disabled={playing}
            >
              {t('capo.apply')}
            </button>
          </p>
        )}
      </div>

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

/** While a song plays: which song, section and repeat is under the playhead. */
function SongBadge() {
  const { songs, songPlay, lang } = useStore()
  const song = songs.find((item) => item.id === songPlay?.songId)
  const section = song && songPlay ? song.sections[songPlay.section] : null
  if (!song || !section || !songPlay) return null
  const x = songsText[lang]
  return (
    <span className="cc-chip strip__song" role="status">
      ♪ {song.name} · {x.labels[section.label]}
      {section.repeats > 1 ? ` ${songPlay.pass + 1}/${section.repeats}` : ''}
    </span>
  )
}
