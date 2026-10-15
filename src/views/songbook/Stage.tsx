import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon, MinusIcon, PauseIcon, PlayIcon, PlusIcon, ScrollIcon, StopIcon } from '../../components/icons'
import { songbookText } from '../../i18n/songbook'
import type { ParsedSheet } from '../../music/chordpro'
import { useStore } from '../../state/store'
import { useWakeLock } from '../../state/wakeLock'
import { Lyrics } from './Lyrics'
import { SongShapes } from './SongShapes'

const PREFS_KEY = 'serendipia.stage.v1'
const SIZES = [1.6, 1.9, 2.2, 2.6, 3, 3.5]
/** Scroll speeds, pixels per second: from a slow ballad to a fast strum. */
const SPEEDS = [10, 16, 24, 34, 46, 60, 78]

function readPrefs(): { size: number; speed: number } {
  try {
    const value = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as { size?: number; speed?: number }
    return { size: clamp(value.size ?? 2, 0, SIZES.length - 1), speed: clamp(value.speed ?? 2, 0, SPEEDS.length - 1) }
  } catch {
    return { size: 2, speed: 2 }
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)))

/**
 * Modo escenario: the song alone on the whole screen, to read from the music stand. Big lyrics, the song's chord
 * diagrams on top, the page scrolling by itself at a chosen speed (or following the sounding chord while it plays),
 * a page-turner pedal or the arrows to move by hand, and the screen kept on.
 */
export function Stage({
  name,
  sheet,
  live,
  canPlay,
  onPlay,
  onStop,
  onClose,
}: {
  name: string
  sheet: ParsedSheet
  live: number
  canPlay: boolean
  onPlay: () => void
  onStop: () => void
  onClose: () => void
}) {
  const { lang, notation } = useStore()
  const x = songbookText[lang]
  const [prefs, setPrefs] = useState(readPrefs)
  const [scrolling, setScrolling] = useState(false)
  const root = useRef<HTMLDivElement | null>(null)
  const page = useRef<HTMLDivElement | null>(null)
  useWakeLock(true)

  const save = (next: { size: number; speed: number }) => {
    setPrefs(next)
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next))
    } catch {
      // a preference only: fine to lose
    }
  }

  // Full screen when the browser allows it; focus inside so the keys reach the stage, and back where it was after.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    root.current?.focus()
    const element = document.documentElement
    if (element.requestFullscreen && !document.fullscreenElement) void element.requestFullscreen().catch(() => undefined)
    return () => {
      if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => undefined)
      before?.focus?.()
    }
  }, [])

  // Leaving full screen with the browser's own Escape closes the stage too.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) onClose()
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [onClose])

  // The page scrolls by itself; at the end it stops.
  useEffect(() => {
    if (!scrolling || live >= 0) return
    let frame = 0
    let last = performance.now()
    let carry = 0
    const step = (now: number) => {
      const node = page.current
      if (!node) return
      carry += (SPEEDS[prefs.speed] * (now - last)) / 1000
      last = now
      const whole = Math.floor(carry)
      if (whole > 0) {
        node.scrollTop += whole
        carry -= whole
      }
      if (node.scrollTop + node.clientHeight >= node.scrollHeight - 1) {
        setScrolling(false)
        return
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [scrolling, prefs.speed, live])

  // While the song plays, the sounding line stays in the upper third.
  useEffect(() => {
    if (live < 0) return
    const node = page.current?.querySelector<HTMLElement>(`[data-chord-index="${live}"]`)?.closest<HTMLElement>('.sb-line')
    const container = page.current
    if (!node || !container) return
    const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const top = node.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - container.clientHeight / 3
    container.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
  }, [live])

  const turn = useCallback((direction: 1 | -1) => {
    const node = page.current
    if (!node) return
    const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    node.scrollBy({ top: direction * node.clientHeight * 0.7, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key
    let handled = true
    if (key === 'Escape') onClose()
    else if (key === 'PageDown' || key === 'ArrowDown' || key === 'ArrowRight') turn(1)
    else if (key === 'PageUp' || key === 'ArrowUp' || key === 'ArrowLeft') turn(-1)
    else if (key === ' ' && !(event.target instanceof HTMLButtonElement)) setScrolling((value) => !value)
    else if (key === '+' || key === '=') save({ ...prefs, size: clamp(prefs.size + 1, 0, SIZES.length - 1) })
    else if (key === '-') save({ ...prefs, size: clamp(prefs.size - 1, 0, SIZES.length - 1) })
    else handled = false
    if (handled) {
      event.preventDefault()
      // The app's own shortcuts (Space plays the progression, the pedal walks the strip) stay out of the stage.
      event.stopPropagation()
    }
  }

  return createPortal(
    <div
      ref={root}
      className="sb-stage"
      role="dialog"
      aria-modal="true"
      aria-label={`${x.stage}: ${name}`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={{ ['--stage-size' as string]: `${SIZES[prefs.size]}rem` }}
    >
      <header className="sb-stage__bar">
        <h2 className="sb-stage__title">{name}</h2>
        <div className="sb-stage__tools">
          {live >= 0 ? (
            <button type="button" className="cc-btn cc-btn--primary" onClick={onStop}>
              <StopIcon size={14} /> {x.stop}
            </button>
          ) : (
            <button type="button" className="cc-btn cc-btn--primary" disabled={!canPlay} onClick={onPlay}>
              <PlayIcon size={14} /> {x.play}
            </button>
          )}
          <button
            type="button"
            className="cc-btn"
            aria-pressed={scrolling}
            disabled={live >= 0}
            onClick={() => setScrolling((value) => !value)}
          >
            {scrolling ? <PauseIcon size={14} /> : <ScrollIcon size={14} />} {scrolling ? x.pauseScroll : x.scroll}
          </button>
          <div className="sb-stage__stepper" role="group" aria-label={x.speed}>
            <span aria-hidden="true">{x.speed}</span>
            <button
              type="button"
              className="cc-btn cc-btn--icon"
              aria-label={x.slower}
              disabled={prefs.speed === 0}
              onClick={() => save({ ...prefs, speed: prefs.speed - 1 })}
            >
              <MinusIcon size={14} />
            </button>
            <span className="cc-num" aria-live="polite">
              {prefs.speed + 1}
            </span>
            <button
              type="button"
              className="cc-btn cc-btn--icon"
              aria-label={x.faster}
              disabled={prefs.speed === SPEEDS.length - 1}
              onClick={() => save({ ...prefs, speed: prefs.speed + 1 })}
            >
              <PlusIcon size={14} />
            </button>
          </div>
          <div className="sb-stage__stepper" role="group" aria-label={x.textSize}>
            <span aria-hidden="true">Aa</span>
            <button
              type="button"
              className="cc-btn cc-btn--icon"
              aria-label={x.smaller}
              disabled={prefs.size === 0}
              onClick={() => save({ ...prefs, size: prefs.size - 1 })}
            >
              <MinusIcon size={14} />
            </button>
            <button
              type="button"
              className="cc-btn cc-btn--icon"
              aria-label={x.bigger}
              disabled={prefs.size === SIZES.length - 1}
              onClick={() => save({ ...prefs, size: prefs.size + 1 })}
            >
              <PlusIcon size={14} />
            </button>
          </div>
          <button
            type="button"
            className="cc-btn cc-btn--icon cc-btn--ghost"
            aria-label={x.closeStage}
            title={x.closeStage}
            onClick={onClose}
          >
            <CloseIcon size={18} />
          </button>
        </div>
      </header>
      <div ref={page} className="sb-stage__page">
        <SongShapes chords={sheet.chords} />
        <Lyrics sheet={sheet} notation={notation} live={live} chorusLabel={x.chorus} />
        <p className="sb-stage__end" aria-hidden="true">
          ✦
        </p>
      </div>
      <p className="sb-stage__hint">{x.stageHint}</p>
    </div>,
    document.body,
  )
}
