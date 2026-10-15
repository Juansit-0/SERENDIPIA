import { useEffect, useMemo, useRef, useState } from 'react'
import { CloseIcon, PlayIcon } from '../../components/icons'
import { songbookText } from '../../i18n/songbook'
import { detectProgressionKey } from '../../music/analysis'
import { lineSlots, parseSheet, setChordAt, type WordSlot } from '../../music/chordpro'
import { parseChord } from '../../music/parseChord'
import { diatonicChords } from '../../music/scales'
import { resolveStepFrets } from '../../music/stepVoicing'
import { useStore } from '../../state/store'
import { chordFunction } from './sheetKey'

const DIRECTIVE = /^\s*\{.*\}\s*$/

/**
 * «Acordes»: every word of the lyrics is a button. Tapping one opens a palette — the song's own chords first,
 * then the key's — and the chosen chord lands on that word, sounding as it is picked. No brackets to type.
 */
export function ChordPlacer({ text, onChange }: { text: string; onChange: (next: string) => void }) {
  const { lang, notation, keyRootPc, keyMode, tuning, playFrets } = useStore()
  const x = songbookText[lang]
  const [open, setOpen] = useState<{ line: number; slot: number } | null>(null)
  const lines = text.replace(/\r\n?/g, '\n').split('\n')

  const sheet = useMemo(() => parseSheet(text), [text])
  const inSong = useMemo(() => [...new Set(sheet.chords.map((chord) => chord.anglo))], [sheet])
  const key = useMemo(() => {
    const steps = sheet.chords.map((chord) => ({
      rootPc: chord.rootPc,
      qualityId: chord.quality.id,
      anglo: chord.anglo,
      latin: chord.latin,
    }))
    return (steps.length >= 2 ? detectProgressionKey(steps) : null) ?? { rootPc: keyRootPc, mode: keyMode }
  }, [sheet, keyRootPc, keyMode])
  const inKey = useMemo(() => diatonicChords(key.rootPc, key.mode).map((degree) => degree.anglo), [key])

  const fnOfName = (anglo: string) => {
    const chord = parseChord(anglo)
    return chord ? chordFunction(chord, key) : undefined
  }

  const show = (anglo: string) => {
    const chord = parseChord(anglo)
    return chord ? (notation === 'latin' ? chord.latin : chord.anglo) : anglo
  }

  const hear = (anglo: string) => {
    const chord = parseChord(anglo)
    if (!chord) return
    const frets = resolveStepFrets({ rootPc: chord.rootPc, qualityId: chord.quality.id, bassPc: chord.bassPc }, tuning)
    if (frets) playFrets(frets)
  }

  const place = (lineIndex: number, slot: WordSlot, chord: string | null) => {
    const next = [...lines]
    next[lineIndex] = setChordAt(lines[lineIndex], slot, chord)
    onChange(next.join('\n'))
    setOpen(null)
  }

  if (!lines.some((line) => line.trim() && !DIRECTIVE.test(line))) return <p className="sb-help">{x.noLyrics}</p>

  return (
    <div className="sb-placer">
      <p className="sb-help">{x.placeHint}</p>
      {lines.map((raw, lineIndex) => {
        if (!raw.trim()) return <div key={lineIndex} className="sb-gap" />
        if (DIRECTIVE.test(raw)) {
          const comment = raw.match(/\{\s*(?:comment|c|ci)\s*:\s*(.*?)\s*\}/i)?.[1]
          return comment ? (
            <p key={lineIndex} className="sb-comment">
              {comment}
            </p>
          ) : null
        }
        const slots = lineSlots(raw)
        return (
          <p key={lineIndex} className="sb-line sb-line--place">
            {slots.map((slot, slotIndex) => {
              const isOpen = open?.line === lineIndex && open.slot === slotIndex
              return (
                <span key={slotIndex} className={`sb-place ${slots[slotIndex + 1]?.attached ? 'is-split' : ''}`}>
                  <button
                    type="button"
                    className="sb-word"
                    aria-expanded={isOpen}
                    aria-label={`${x.palette} «${slot.word || '…'}»${slot.chord ? `: ${show(slot.chord.name)}` : ''}`}
                    onClick={() => setOpen(isOpen ? null : { line: lineIndex, slot: slotIndex })}
                  >
                    <span
                      className={`sb-chord ${slot.chord ? '' : 'is-empty'}`}
                      data-fn={slot.chord ? fnOfName(slot.chord.name) : undefined}
                      aria-hidden="true"
                    >
                      {slot.chord ? show(slot.chord.name) : '+'}
                    </span>
                    <span className="sb-text" aria-hidden="true">
                      {slot.word || ' '}
                    </span>
                  </button>
                  {isOpen && (
                    <Palette
                      word={slot.word}
                      current={slot.chord?.name ?? null}
                      inSong={inSong}
                      inKey={inKey}
                      show={show}
                      fnOf={fnOfName}
                      onHear={hear}
                      onPick={(chord) => {
                        hear(chord)
                        place(lineIndex, slot, chord)
                      }}
                      onRemove={() => place(lineIndex, slot, null)}
                      onClose={() => setOpen(null)}
                    />
                  )}
                </span>
              )
            })}
          </p>
        )
      })}
    </div>
  )
}

function Palette({
  word,
  current,
  inSong,
  inKey,
  show,
  fnOf,
  onHear,
  onPick,
  onRemove,
  onClose,
}: {
  word: string
  current: string | null
  inSong: string[]
  inKey: string[]
  show: (anglo: string) => string
  fnOf: (anglo: string) => string | undefined
  onHear: (anglo: string) => void
  onPick: (anglo: string) => void
  onRemove: () => void
  onClose: () => void
}) {
  const { lang } = useStore()
  const x = songbookText[lang]
  const [other, setOther] = useState('')
  const panel = useRef<HTMLDivElement | null>(null)
  const parsedOther = other.trim() ? parseChord(other) : null

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('.sb-palette__chip')?.focus()
    const onPointer = (event: PointerEvent) => {
      if (panel.current && !panel.current.parentElement?.contains(event.target as Node)) onClose()
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [onClose])

  const group = (title: string, names: string[]) =>
    names.length > 0 && (
      <div className="sb-palette__group" role="group" aria-label={title}>
        <span className="cc-label">{title}</span>
        <div className="sb-palette__chips">
          {names.map((name) => (
            <button
              key={name}
              type="button"
              className="cc-btn sb-palette__chip"
              data-fn={fnOf(name)}
              aria-pressed={current === name}
              onClick={() => onPick(name)}
            >
              {show(name)}
            </button>
          ))}
        </div>
      </div>
    )

  return (
    <div
      ref={panel}
      className="cc-pop sb-palette"
      role="dialog"
      aria-label={`${x.palette} «${word || '…'}»`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
        }
      }}
    >
      <div className="sb-palette__head">
        <span className="sb-palette__word">«{word || '…'}»</span>
        <button type="button" className="cc-btn cc-btn--icon cc-btn--ghost" aria-label={x.closePalette} onClick={onClose}>
          <CloseIcon size={14} />
        </button>
      </div>
      {group(x.inSong, inSong)}
      {group(
        x.inKey,
        inKey.filter((name) => !inSong.includes(name)),
      )}
      <form
        className="sb-palette__other"
        onSubmit={(event) => {
          event.preventDefault()
          if (parsedOther) onPick(parsedOther.anglo)
        }}
      >
        <label className="cc-label" htmlFor="sb-other">
          {x.other}
        </label>
        <input
          id="sb-other"
          className="strip-field"
          value={other}
          placeholder={x.otherPlaceholder}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-invalid={other.trim() !== '' && !parsedOther}
          onChange={(event) => setOther(event.target.value)}
        />
        <button
          type="button"
          className="cc-btn cc-btn--icon"
          disabled={!parsedOther}
          aria-label={x.listen}
          title={x.listen}
          onClick={() => parsedOther && onHear(parsedOther.anglo)}
        >
          <PlayIcon size={14} />
        </button>
        <button type="submit" className="cc-btn cc-btn--primary" disabled={!parsedOther}>
          {x.put}
        </button>
      </form>
      {current && (
        <button type="button" className="cc-btn cc-btn--ghost sb-palette__remove" onClick={onRemove}>
          {x.take}
        </button>
      )}
    </div>
  )
}
