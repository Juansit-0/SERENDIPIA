import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { chordText } from '../../i18n/chord'
import { parseChord } from '../../music/parseChord'
import { isPlayableFrets, voicingLabel } from '../../music/stepVoicing'
import { CloseIcon, ListenIcon, PlusIcon } from '../icons'
import { SuggestionsPanel } from '../SuggestionsPanel'
import { NoteMark } from './NoteMark'
import { toneWord } from './roles'
import { FN_VAR, suggestionFunction } from './suggestFn'
import type { ChordModel } from './useChordModel'

function NotesModule({ m }: { m: ChordModel }) {
  const c = chordText[m.lang]
  const loose = m.noChord && m.detection ? [...new Map(m.detection.notes.map((note) => [note.pc, note])).values()] : []
  return (
    <section className="cc-module cv-notes" aria-label={c.notesIntervals}>
      <header className="cv-notes-head">
        <h2 className="cc-label">{c.notesIntervals}</h2>
        <span className="cv-notes-hint">{c.notesHint}</span>
      </header>
      <ul className="cv-notes-list">
        {!m.noChord &&
          m.tones.map((tone) => (
            <li key={`${tone.interval}-${tone.pc}`} className={`cv-note cv-note--${tone.role}`}>
              <NoteMark role={tone.role} />
              <span className="cv-note-text">
                <b>{tone.name}</b>
                <i>{toneWord(tone.interval, m.chord.quality.id, m.lang)}</i>
              </span>
            </li>
          ))}
        {loose.map((note) => (
          <li key={note.pc} className="cv-note">
            <NoteMark role="other" />
            <b>{m.notation === 'latin' ? note.latin : note.anglo}</b>
          </li>
        ))}
        {m.emptyMarks && <li className="cv-note cv-note--none">—</li>}
      </ul>
    </section>
  )
}

function ActionsModule({ m, onListen }: { m: ChordModel; onListen: () => void }) {
  const c = chordText[m.lang]
  const { chord, voicings, selectedVoicing, chartSource, chartFrets, markedVoicing } = m
  const voicing = voicings[selectedVoicing]
  const canAdd = !m.noChord && !m.chordError
  const canListen = chartSource === 'marks' ? m.marksCount > 0 : Boolean(voicing)

  const add = () => {
    if (!canAdd) return
    const fromMarks = chartSource === 'marks'
    const frets = fromMarks ? (isPlayableFrets(chartFrets) ? chartFrets : null) : (voicing?.frets ?? null)
    m.addToProgression({
      rootPc: chord.rootPc,
      qualityId: chord.quality.id,
      anglo: chord.anglo,
      latin: chord.latin,
      bassPc: chord.bassPc,
      frets,
      voicingLabel: frets ? voicingLabel(frets) : undefined,
      voicingSource: fromMarks
        ? frets
          ? 'marked'
          : 'auto'
        : voicing?.source === 'marked' && markedVoicing
          ? 'marked'
          : voicing
            ? 'proof'
            : 'auto',
    })
  }

  return (
    <section className="cc-module cv-actions" aria-label={`${c.listen} · ${c.add}`}>
      <button type="button" className="cc-btn cc-btn--primary cc-btn--lg cv-listen" onClick={onListen} disabled={!canListen}>
        <ListenIcon size={22} />
        {c.listen}
      </button>
      <button type="button" className="cc-btn cv-add" onClick={add} disabled={!canAdd}>
        <PlusIcon size={16} />
        {c.add}
      </button>
    </section>
  )
}

function NextModule({ m }: { m: ChordModel }) {
  const c = chordText[m.lang]
  const { panelSuggestions, keyRootPc, keyMode, setChord, addSuggestion, nameOf } = m
  const ideas = panelSuggestions.slice(0, 3)
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <section className="cc-module cv-next" aria-label={c.follows}>
      <div className="cv-next-line">
        <h2 className="cc-label">{c.follows}</h2>
        <span className="cv-ideas">
          {ideas.map((idea) => {
            const fn = suggestionFunction(idea, keyRootPc, keyMode)
            const label = nameOf(idea)
            return (
              <span key={idea.anglo} className="cv-idea" style={{ '--fn': FN_VAR[fn] } as CSSProperties}>
                <button
                  type="button"
                  className="cv-idea-chord"
                  title={`${c.fn[fn]} · ${m.lang === 'es' ? idea.reasonEs : idea.reasonEn}`}
                  onClick={() => {
                    const parsed = parseChord(idea.anglo)
                    if (parsed) setChord(parsed)
                  }}
                >
                  <i className="cv-fn-dot" aria-hidden="true" />
                  {label}
                </button>
                <button
                  type="button"
                  className="cv-idea-add"
                  aria-label={`${c.addIdea}: ${label}`}
                  title={c.addIdea}
                  onClick={() => addSuggestion(idea)}
                >
                  <PlusIcon size={13} strokeWidth={2.2} />
                </button>
              </span>
            )
          })}
          <span className="cv-pop-wrap" ref={wrap}>
            <button
              ref={trigger}
              type="button"
              className="cc-btn cc-btn--ghost cv-seeall"
              aria-expanded={open}
              aria-haspopup="dialog"
              onClick={() => setOpen((value) => !value)}
            >
              {c.seeAll}
            </button>
            {open && (
              <div className="cc-pop cv-sug-pop" role="dialog" aria-label={c.seeAllLabel}>
                <button
                  type="button"
                  className="cc-btn cc-btn--icon cc-btn--ghost cv-pop-close"
                  aria-label={c.closePanel}
                  onClick={() => setOpen(false)}
                >
                  <CloseIcon size={14} />
                </button>
                <SuggestionsPanel />
              </div>
            )}
          </span>
        </span>
      </div>
    </section>
  )
}

function Barcode({ text }: { text: string }) {
  // Deterministic bars: pure ornament.
  const bars: { x: number; w: number }[] = []
  let x = 0
  for (let i = 0; x < 214; i += 1) {
    const w = 1 + ((i * 7 + (i % 3) * 5) % 3)
    bars.push({ x, w })
    x += w + 1 + ((i * 5) % 3)
  }
  return (
    <div className="cc-module cv-barcode" aria-hidden="true">
      <svg viewBox="0 0 214 26" preserveAspectRatio="none" focusable="false">
        {bars.map((bar) => (
          <rect key={bar.x} x={bar.x} y="0" width={bar.w} height="26" fill="currentColor" />
        ))}
      </svg>
      <span className="cc-label">{text}</span>
    </div>
  )
}

export function BottomRow({ m, onListen }: { m: ChordModel; onListen: () => void }) {
  const c = chordText[m.lang]
  return (
    <div className="cv-bottom">
      <NotesModule m={m} />
      <ActionsModule m={m} onListen={onListen} />
      <NextModule m={m} />
      <Barcode text={c.barcode} />
    </div>
  )
}
