import { useEffect, useMemo, useRef, useState, type ClipboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { MinusIcon, PlayIcon, PlusIcon, StopIcon } from '../components/icons'
import { songbookText } from '../i18n/songbook'
import { chordsOverLyrics, parseSheet, type ParsedSheet } from '../music/chordpro'
import { showNotice } from '../state/notice'
import { sheetId, sheetUrl, type Sheet } from '../state/sheets'
import { useStore } from '../state/store'
import { ChordPlacer } from './songbook/ChordPlacer'
import '../styles/songbook.css'

/** The Cancionero: lyrics with chords over each syllable, played chord by chord with the lyrics following. */
export function SongbookView() {
  const { lang, notation, sheets, saveSheet, deleteSheet, playSheet, sheetPlay, playing, stopPlayback, loadProgression } = useStore()
  const x = songbookText[lang]
  const [selectedId, setSelectedId] = useState<string | null>(() => sheets[0]?.id ?? null)
  const selected = sheets.find((sheet) => sheet.id === selectedId) ?? sheets[0] ?? null
  const [mode, setMode] = useState<'view' | 'chords' | 'text'>('view')
  const [semitones, setSemitones] = useState(0)
  const [confirm, setConfirm] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [printing, setPrinting] = useState(false)

  const parsed = useMemo(() => (selected ? parseSheet(selected.text, semitones) : null), [selected, semitones])
  const live = playing && sheetPlay?.sheetId === selected?.id ? sheetPlay.index : -1

  // A new song starts with its lyrics: write or paste them, then place the chords by tapping words.
  const create = () => {
    const sheet: Sheet = { id: sheetId(), name: x.untitled, text: '', savedAt: '' }
    saveSheet(sheet)
    setSelectedId(sheet.id)
    setMode('text')
    setSemitones(0)
  }

  const onPasteLyrics = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!selected) return
    const pasted = event.clipboardData.getData('text')
    const result = chordsOverLyrics(pasted)
    if (!result.converted) return
    event.preventDefault()
    const area = event.currentTarget
    const text = area.value.slice(0, area.selectionStart) + result.text + area.value.slice(area.selectionEnd)
    const title = parseSheet(text).title
    saveSheet({ ...selected, text, name: selected.name === x.untitled && title ? title : selected.name })
    showNotice(x.pastedChords)
  }

  const select = (id: string) => {
    if (playing && sheetPlay) stopPlayback()
    setSelectedId(id)
    setSemitones(0)
    setConfirm(false)
    setLink(null)
  }

  // The sounding chord's line stays in view while playing.
  const body = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (live < 0) return
    const node = body.current?.querySelector<HTMLElement>(`[data-chord-index="${live}"]`)
    const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    node?.closest('.sb-line')?.scrollIntoView?.({ block: 'center', behavior: smooth ? 'smooth' : 'auto' })
  }, [live])

  useEffect(() => {
    if (!printing) return
    const done = () => setPrinting(false)
    window.addEventListener('afterprint', done)
    const frame = requestAnimationFrame(() => {
      try {
        window.print()
      } catch {
        done()
      }
    })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('afterprint', done)
    }
  }, [printing])

  const share = async () => {
    if (!selected) return
    const url = sheetUrl(selected, window.location)
    try {
      await navigator.clipboard.writeText(url)
      setLink(null)
      showNotice(x.copied)
    } catch {
      setLink(url)
    }
  }

  if (!selected) {
    return (
      <section className="cc-module sb-empty">
        <h2 className="sb-empty__title">{x.title}</h2>
        <p>{x.intro}</p>
        <button type="button" className="cc-btn cc-btn--primary cc-btn--lg" onClick={create}>
          <PlusIcon size={16} /> {x.first}
        </button>
      </section>
    )
  }

  return (
    <div className="sb flex flex-col gap-3 desk:h-full desk:min-h-0 desk:gap-2">
      <section className="cc-module sb-list" aria-label={x.list}>
        <div className="sb-list__head">
          <h2 className="cc-label">{x.title}</h2>
          <button type="button" className="cc-btn" onClick={create}>
            <PlusIcon size={14} /> {x.create}
          </button>
        </div>
        <ul>
          {sheets.map((sheet) => (
            <li key={sheet.id}>
              <button type="button" className="sb-list__item" aria-current={sheet.id === selected.id ? 'true' : undefined} onClick={() => select(sheet.id)}>
                <span className="sb-list__name">{sheet.name}</span>
                <span className="sb-list__chords">{summary(parseSheet(sheet.text), notation)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="cc-module sb-sheet" aria-label={selected.name}>
        <div className="sb-tools">
          {mode !== 'view' ? (
            <input
              className="sb-title-input"
              aria-label={x.name}
              value={selected.name}
              maxLength={80}
              onChange={(event) => saveSheet({ ...selected, name: event.target.value })}
            />
          ) : (
            <h2 className="sb-title">{selected.name}</h2>
          )}
          <div className="sb-tools__row">
            <div className="cc-seg" role="group" aria-label={x.mode}>
              <button type="button" aria-pressed={mode === 'view'} onClick={() => setMode('view')}>
                {x.view}
              </button>
              <button type="button" aria-pressed={mode === 'chords'} onClick={() => setMode('chords')}>
                {x.place}
              </button>
              <button type="button" aria-pressed={mode === 'text'} onClick={() => setMode('text')}>
                {x.edit}
              </button>
            </div>
            {live >= 0 ? (
              <button type="button" className="cc-btn cc-btn--primary" onClick={stopPlayback}>
                <StopIcon size={14} /> {x.stop}
              </button>
            ) : (
              <button type="button" className="cc-btn cc-btn--primary" disabled={!parsed?.chords.length} onClick={() => playSheet(selected, semitones)}>
                <PlayIcon size={14} /> {x.play}
              </button>
            )}
            <div className="sb-transpose" role="group" aria-label={x.transpose}>
              <button type="button" className="cc-btn cc-btn--icon" aria-label={x.down} title={x.down} onClick={() => setSemitones((value) => value - 1)}>
                <MinusIcon size={14} />
              </button>
              <span className="cc-num" aria-live="polite">
                {semitones > 0 ? `+${semitones}` : semitones}
              </span>
              <button type="button" className="cc-btn cc-btn--icon" aria-label={x.up} title={x.up} onClick={() => setSemitones((value) => value + 1)}>
                <PlusIcon size={14} />
              </button>
            </div>
            <button
              type="button"
              className="cc-btn cc-btn--ghost"
              title={x.toProgressionHint}
              disabled={!parsed?.chords.length}
              onClick={() => {
                loadProgression(
                  (parsed?.chords ?? []).slice(0, 16).map((chord) => ({ rootPc: chord.rootPc, qualityId: chord.quality.id, anglo: chord.anglo, latin: chord.latin, bassPc: chord.bassPc })),
                )
                showNotice(x.loaded)
              }}
            >
              {x.toProgression}
            </button>
            <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setPrinting(true)}>
              {x.print}
            </button>
            <button type="button" className="cc-btn cc-btn--ghost" onClick={() => void share()}>
              {x.share}
            </button>
            <button
              type="button"
              className="cc-btn cc-btn--ghost"
              onBlur={() => setConfirm(false)}
              onClick={() => {
                if (!confirm) {
                  setConfirm(true)
                  return
                }
                if (live >= 0) stopPlayback()
                deleteSheet(selected.id)
                setSelectedId(null)
                setConfirm(false)
              }}
            >
              {confirm ? x.removeConfirm : x.remove}
            </button>
          </div>
          {link && <input className="strip-field" readOnly value={link} aria-label={x.copyHere} onFocus={(event) => event.currentTarget.select()} autoFocus />}
        </div>

        {mode === 'text' ? (
          <div className="sb-editor">
            <label className="cc-label" htmlFor="sheet-text">
              {x.text}
            </label>
            <textarea
              id="sheet-text"
              spellCheck={false}
              value={selected.text}
              placeholder={x.textPlaceholder}
              onPaste={onPasteLyrics}
              onChange={(event) => saveSheet({ ...selected, text: event.target.value })}
            />
            <div className="sb-editor__foot">
              <p className="sb-help">{x.help}</p>
              <button type="button" className="cc-btn cc-btn--primary" disabled={!selected.text.trim()} onClick={() => setMode('chords')}>
                {x.nextPlace}
              </button>
            </div>
          </div>
        ) : mode === 'chords' ? (
          <div className="sb-body">
            <ChordPlacer text={selected.text} onChange={(text) => saveSheet({ ...selected, text })} />
          </div>
        ) : (
          <div className="sb-body" ref={body}>
            {parsed && parsed.chords.length === 0 && <p className="sb-help">{x.noChords}</p>}
            {parsed && <Lyrics sheet={parsed} notation={notation} live={live} />}
          </div>
        )}
      </section>

      {printing && parsed && createPortal(
        <article className="print-sheet print-lyrics">
          <p className="print-sheet__brand">SERENDIPIA · {x.title}</p>
          <h1>{selected.name}</h1>
          <Lyrics sheet={parsed} notation={notation} live={-1} />
        </article>,
        document.body,
      )}
    </div>
  )
}

function summary(sheet: ParsedSheet, notation: string): string {
  const unique: string[] = []
  for (const chord of sheet.chords) {
    const name = notation === 'latin' ? chord.latin : chord.anglo
    if (!unique.includes(name)) unique.push(name)
    if (unique.length === 6) break
  }
  return unique.join(' · ')
}

/** Lines of lyrics, each chord set above the syllable it falls on. */
function Lyrics({ sheet, notation, live }: { sheet: ParsedSheet; notation: string; live: number }) {
  return (
    <div className="sb-lyrics">
      {sheet.lines.map((line, index) => {
        if (line.kind === 'blank') return <div key={index} className="sb-gap" />
        if (line.kind === 'comment') return <p key={index} className="sb-comment">{line.text}</p>
        return (
          <p key={index} className={`sb-line ${line.chorus ? 'is-chorus' : ''}`}>
            {line.segments.map((segment, at) => (
              <span key={at} className="sb-seg" data-chord-index={segment.index >= 0 ? segment.index : undefined} data-live={segment.index >= 0 && segment.index === live ? 'true' : undefined}>
                <span className={`sb-chord ${segment.chord && !segment.parsed ? 'is-unknown' : ''}`} aria-hidden={segment.chord ? undefined : 'true'}>
                  {segment.parsed ? (notation === 'latin' ? segment.parsed.latin : segment.parsed.anglo) : (segment.chord ?? ' ')}
                </span>
                <span className="sb-text">{segment.text || ' '}</span>
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}
