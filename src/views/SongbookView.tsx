import { useEffect, useMemo, useRef, useState, type ClipboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { MinusIcon, PlayIcon, PlusIcon, StopIcon } from '../components/icons'
import { songbookText } from '../i18n/songbook'
import { keyName } from '../music/analysis'
import { chordsOverLyrics, parseSheet, type ParsedSheet, type SheetLine } from '../music/chordpro'
import type { ParsedChord } from '../music/parseChord'
import { showNotice } from '../state/notice'
import { sheetId, sheetUrl, type Sheet } from '../state/sheets'
import { useStore } from '../state/store'
import { ChordPlacer } from './songbook/ChordPlacer'
import { chordFunction, sheetKey, uniqueChords } from './songbook/sheetKey'
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
  const key = useMemo(() => (parsed ? sheetKey(parsed.chords) : null), [parsed])
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
        <EmptySky />
        <p className="sb-empty__kicker">{x.emptyKicker}</p>
        <h2 className="sb-empty__title">{x.title}</h2>
        <p className="sb-empty__intro">{x.intro}</p>
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
          <h2 className="cc-label">
            {x.title} <span className="sb-list__count cc-num">{sheets.length}</span>
          </h2>
          <button type="button" className="cc-btn" onClick={create}>
            <PlusIcon size={14} /> {x.create}
          </button>
        </div>
        <ul>
          {sheets.map((sheet) => {
            const chords = parseSheet(sheet.text).chords
            return (
              <li key={sheet.id}>
                <button
                  type="button"
                  className="sb-list__item"
                  aria-current={sheet.id === selected.id ? 'true' : undefined}
                  onClick={() => select(sheet.id)}
                >
                  <SongGlyph chords={chords} />
                  <span className="sb-list__text">
                    <span className="sb-list__name">{sheet.name}</span>
                    <span className="sb-list__chords">{summary(chords, notation)}</span>
                  </span>
                </button>
              </li>
            )
          })}
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
            <header className="sb-head">
              <h2 className="sb-title">{selected.name}</h2>
              {parsed && parsed.chords.length > 0 && (
                <p className="sb-meta">
                  {key && (
                    <>
                      {keyName(key, lang)}
                      <span aria-hidden="true"> · </span>
                    </>
                  )}
                  {x.chordCount.replace('{n}', String(uniqueChords(parsed.chords, 99).length))}
                </p>
              )}
            </header>
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
              <button
                type="button"
                className="cc-btn cc-btn--primary"
                disabled={!parsed?.chords.length}
                onClick={() => playSheet(selected, semitones)}
              >
                <PlayIcon size={14} /> {x.play}
              </button>
            )}
            <div className="sb-transpose" role="group" aria-label={x.transpose}>
              <span className="sb-transpose__label" aria-hidden="true">
                {x.tone}
              </span>
              <button
                type="button"
                className="cc-btn cc-btn--icon"
                aria-label={x.down}
                title={x.down}
                onClick={() => setSemitones((value) => value - 1)}
              >
                <MinusIcon size={14} />
              </button>
              <span className="cc-num" aria-live="polite">
                {semitones > 0 ? `+${semitones}` : semitones}
              </span>
              <button
                type="button"
                className="cc-btn cc-btn--icon"
                aria-label={x.up}
                title={x.up}
                onClick={() => setSemitones((value) => value + 1)}
              >
                <PlusIcon size={14} />
              </button>
            </div>
            <span className="sb-tools__spacer" aria-hidden="true" />
            <button
              type="button"
              className="cc-btn cc-btn--ghost sb-tools__more"
              title={x.toProgressionHint}
              disabled={!parsed?.chords.length}
              onClick={() => {
                loadProgression(
                  (parsed?.chords ?? [])
                    .slice(0, 16)
                    .map((chord) => ({
                      rootPc: chord.rootPc,
                      qualityId: chord.quality.id,
                      anglo: chord.anglo,
                      latin: chord.latin,
                      bassPc: chord.bassPc,
                    })),
                )
                showNotice(x.loaded)
              }}
            >
              {x.toProgression}
            </button>
            <button type="button" className="cc-btn cc-btn--ghost sb-tools__more" onClick={() => setPrinting(true)}>
              {x.print}
            </button>
            <button type="button" className="cc-btn cc-btn--ghost sb-tools__more" onClick={() => void share()}>
              {x.share}
            </button>
            <button
              type="button"
              className={`cc-btn cc-btn--ghost sb-tools__more ${confirm ? 'is-confirm' : ''}`}
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
          {link && (
            <input
              className="strip-field"
              readOnly
              value={link}
              aria-label={x.copyHere}
              onFocus={(event) => event.currentTarget.select()}
              autoFocus
            />
          )}
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
            {parsed && <Lyrics sheet={parsed} notation={notation} live={live} chorusLabel={x.chorus} />}
          </div>
        )}
      </section>

      {printing &&
        parsed &&
        createPortal(
          <article className="print-sheet print-lyrics">
            <p className="print-sheet__brand">SERENDIPIA · {x.title}</p>
            <h1>{selected.name}</h1>
            <Lyrics sheet={parsed} notation={notation} live={-1} chorusLabel={x.chorus} />
          </article>,
          document.body,
        )}
    </div>
  )
}

function summary(chords: ParsedChord[], notation: string): string {
  return uniqueChords(chords, 6)
    .map((chord) => (notation === 'latin' ? chord.latin : chord.anglo))
    .join(' · ')
}

/** A song's first chords as a tiny constellation: one star per chord, coloured by its function in the song's key. */
function SongGlyph({ chords }: { chords: ParsedChord[] }) {
  const key = sheetKey(chords)
  const stars = uniqueChords(chords, 5)
  const points = stars.map((_, index) => [6 + index * 9, index % 2 === 0 ? 15 : 7] as const)
  return (
    <svg className="sb-glyph" viewBox="0 0 48 22" aria-hidden="true" focusable="false">
      {points.length > 1 && <polyline points={points.map((p) => p.join(',')).join(' ')} />}
      {points.length === 0 && <circle className="sb-glyph__empty" cx="24" cy="11" r="3" />}
      {stars.map((chord, index) => (
        <circle
          key={chord.anglo}
          cx={points[index][0]}
          cy={points[index][1]}
          r={index === 0 ? 3.4 : 2.6}
          data-fn={chordFunction(chord, key)}
        />
      ))}
    </svg>
  )
}

/** The empty songbook: three lines of lyrics, dotted like words, with chord stars over them. */
function EmptySky() {
  const stars: Array<[number, number, string]> = [
    [22, 18, 'tonic'],
    [92, 18, 'dominant'],
    [168, 18, 'tonic'],
    [48, 64, 'subdominant'],
    [130, 64, 'dominant'],
    [70, 110, 'subdominant'],
    [176, 110, 'borrowed'],
  ]
  return (
    <svg className="sb-empty__sky" viewBox="0 0 200 140" aria-hidden="true" focusable="false">
      {[34, 80, 126].map((y, index) => (
        <line key={y} className="sb-empty__words" x1="12" y1={y} x2={index === 2 ? 150 : 192} y2={y} />
      ))}
      {stars.map(([x, y, fn], index) => (
        <path
          key={index}
          className="sb-empty__star"
          data-fn={fn}
          style={{ ['--i' as string]: index }}
          transform={`translate(${x} ${y})`}
          d="M0,-7 Q1,-1 7,0 Q1,1 0,7 Q-1,1 -7,0 Q-1,-1 0,-7Z"
        />
      ))}
    </svg>
  )
}

type Block = { chorus: boolean; lines: Array<{ line: SheetLine; at: number }> }

/** Consecutive chorus lines (and the blank lines between them) form one block, set apart like a refrain. */
function blocksOf(lines: SheetLine[]): Block[] {
  const blocks: Block[] = []
  lines.forEach((line, at) => {
    const last = blocks[blocks.length - 1]
    const chorus = line.kind === 'lyrics' ? line.chorus : line.kind === 'blank' && Boolean(last?.chorus)
    if (last && last.chorus === chorus) last.lines.push({ line, at })
    else blocks.push({ chorus, lines: [{ line, at }] })
  })
  // A chorus never ends on a blank line: it belongs to what follows.
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i]
    while (block.chorus && block.lines.length > 1 && block.lines[block.lines.length - 1].line.kind === 'blank') {
      const moved = block.lines.pop()!
      const next = blocks[i + 1]
      if (next && !next.chorus) next.lines.unshift(moved)
      else blocks.splice(i + 1, 0, { chorus: false, lines: [moved] })
    }
  }
  return blocks
}

/**
 * Lines of lyrics, each chord set above the syllable it falls on and coloured by its function in the song's key.
 * Sections read as headings, the chorus as a set-apart block; while playing, the sung line glows and the past fades.
 */
function Lyrics({ sheet, notation, live, chorusLabel }: { sheet: ParsedSheet; notation: string; live: number; chorusLabel: string }) {
  const key = useMemo(() => sheetKey(sheet.chords), [sheet])
  const blocks = useMemo(() => blocksOf(sheet.lines), [sheet])

  const renderLine = (line: SheetLine, at: number) => {
    if (line.kind === 'blank') return <div key={at} className="sb-gap" />
    if (line.kind === 'comment')
      return (
        <p key={at} className="sb-comment">
          <span>{line.text}</span>
        </p>
      )
    const indices = line.segments.map((segment) => segment.index).filter((index) => index >= 0)
    const isLive = live >= 0 && indices.includes(live)
    const isPast = live >= 0 && indices.length > 0 && Math.max(...indices) < live
    return (
      <p key={at} className={`sb-line ${line.chorus ? 'is-chorus' : ''} ${isLive ? 'is-live' : ''} ${isPast ? 'is-past' : ''}`}>
        {line.segments.map((segment, index) => (
          <span
            key={index}
            className="sb-seg"
            data-chord-index={segment.index >= 0 ? segment.index : undefined}
            data-live={segment.index >= 0 && segment.index === live ? 'true' : undefined}
          >
            <span
              className={`sb-chord ${segment.chord && !segment.parsed ? 'is-unknown' : ''}`}
              data-fn={segment.parsed ? chordFunction(segment.parsed, key) : undefined}
              aria-hidden={segment.chord ? undefined : 'true'}
            >
              {segment.parsed ? (notation === 'latin' ? segment.parsed.latin : segment.parsed.anglo) : (segment.chord ?? ' ')}
            </span>
            <span className="sb-text">{segment.text || ' '}</span>
          </span>
        ))}
      </p>
    )
  }

  return (
    <div className="sb-lyrics">
      {blocks.map((block, index) =>
        block.chorus ? (
          <div key={index} className="sb-chorus">
            {sheet.lines[block.lines[0].at - 1]?.kind !== 'comment' && <p className="sb-chorus__label">{chorusLabel}</p>}
            {block.lines.map(({ line, at }) => renderLine(line, at))}
          </div>
        ) : (
          block.lines.map(({ line, at }) => renderLine(line, at))
        ),
      )}
    </div>
  )
}
