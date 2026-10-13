import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { prefetchAudioEngine } from '../audio/loader'
import { welcomeText } from '../i18n/welcome'
import { useStore } from '../state/store'
import { useTheme } from '../state/theme'
import type { Palette, WelcomeScene } from './scene'
import { closeWelcome, startEntrance } from './state'
import '../styles/welcome.css'

/** The scene's colours come from the live theme tokens, so the sky always matches the app. */
function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement)
  const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  const day = document.documentElement.dataset.theme === 'day'
  return {
    ground: token('--cc-ground', '#0d0b14'),
    ink: token('--cc-ink', '#ece5f8'),
    accent: token(day ? '--cc-accent-deep' : '--cc-accent', '#c7b3e8'),
    tonic: token('--cc-fn-tonic', '#c7b3e8'),
    sub: token('--cc-fn-sub', '#40e0d0'),
    dom: token('--cc-fn-dom', '#e8c37a'),
    borrowed: token('--cc-fn-borrowed', '#e2a4bf'),
  }
}

/** How long the warp and the opening circle last. */
const LEAVE_MS = 1050

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * First-visit welcome: a sky whose stars gather into the brand, a chord chart, a constellation and its
 * hallazgos, one per step, with a short text beside it. Skippable at any moment; Ajustes can show it again.
 */
export function Welcome() {
  const { lang } = useStore()
  const { theme } = useTheme()
  const text = welcomeText[lang]
  const [step, setStep] = useState(0)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const scene = useRef<WelcomeScene | null>(null)
  const dialog = useRef<HTMLDivElement | null>(null)
  const primary = useRef<HTMLButtonElement | null>(null)
  const [skyReady, setSkyReady] = useState(false)
  const last = text.steps.length - 1

  // three.js loads only here, after the welcome opens.
  useEffect(() => {
    let cancelled = false
    import('./scene')
      .then(({ createWelcomeScene }) => {
        if (cancelled || !canvas.current) return
        scene.current = createWelcomeScene(canvas.current, {
          reduced: reducedMotion(),
          palette: readPalette(),
          day: document.documentElement.dataset.theme === 'day',
        })
        setSkyReady(scene.current !== null)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      scene.current?.dispose()
      scene.current = null
    }
  }, [])

  useEffect(() => {
    scene.current?.show(step)
  }, [step, skyReady])

  useEffect(() => {
    scene.current?.setPalette(readPalette(), theme === 'day')
  }, [theme, skyReady])

  useEffect(() => {
    primary.current?.focus()
  }, [step])

  // Leaving: the stars jump to warp while a circle opens from the pressed button onto the app, which assembles itself.
  const [leaving, setLeaving] = useState<{ x: number; y: number } | null>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), [])

  const finish = useCallback(
    (origin?: HTMLElement | null) => {
      if (leaving) return
      prefetchAudioEngine()
      if (reducedMotion()) {
        closeWelcome()
        return
      }
      const box = origin?.getBoundingClientRect()
      setLeaving(
        box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      )
      scene.current?.warp(LEAVE_MS)
      timers.current.push(
        window.setTimeout(() => startEntrance(), 220),
        window.setTimeout(() => closeWelcome(), LEAVE_MS + 120),
      )
    },
    [leaving],
  )

  const go = (next: number) => setStep(Math.max(0, Math.min(last, next)))

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (leaving) {
      event.preventDefault()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      finish()
    } else if (event.key === 'ArrowRight' && !(event.target instanceof HTMLInputElement)) {
      if (step === last) return
      event.preventDefault()
      go(step + 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(step - 1)
    } else if (event.key === 'Tab' && dialog.current) {
      // Keep focus inside the welcome while it is open.
      const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled)'))
      const first = focusable[0]
      const end = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        end.focus()
      } else if (!event.shiftKey && document.activeElement === end) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  const current = text.steps[step]

  return (
    <>
      <div
        ref={dialog}
        className="welcome"
        data-sky={skyReady ? 'ready' : 'none'}
        data-leaving={leaving ? 'true' : undefined}
        style={
          leaving
            ? ({
                '--wx': `${leaving.x}px`,
                '--wy': `${leaving.y}px`,
              } as CSSProperties)
            : undefined
        }
        role="dialog"
        aria-modal="true"
        aria-label={text.label}
        onKeyDown={onKeyDown}
      >
        <canvas ref={canvas} className="welcome__sky" aria-hidden="true" />
        <div className="welcome__veil" aria-hidden="true" />

        <button type="button" className="cc-btn cc-btn--ghost welcome__skip" onClick={(event) => finish(event.currentTarget)}>
          {text.skip}
        </button>

        <section className="welcome__card" aria-live="polite">
          <div key={step} className="welcome__copy">
            <p className="welcome__kicker">{current.kicker}</p>
            <h1 className={step === 0 ? 'welcome__title welcome__title--brand' : 'welcome__title'}>{current.title}</h1>
            <p className="welcome__body">{current.body}</p>
          </div>

          <div className="welcome__nav">
            <ol className="welcome__dots" aria-label={`${text.progress} ${step + 1} ${text.of} ${text.steps.length}`}>
              {text.steps.map((item, index) => (
                <li key={item.title}>
                  <button
                    type="button"
                    className="welcome__dot"
                    aria-current={index === step ? 'step' : undefined}
                    aria-label={`${text.progress} ${index + 1}: ${item.title}`}
                    onClick={() => go(index)}
                  />
                </li>
              ))}
            </ol>
            <div className="welcome__actions">
              {step > 0 && (
                <button type="button" className="cc-btn cc-btn--ghost" onClick={() => go(step - 1)}>
                  {text.back}
                </button>
              )}
              <button
                ref={primary}
                type="button"
                className="cc-btn cc-btn--primary cc-btn--lg"
                onClick={(event) => (step === last ? finish(event.currentTarget) : go(step + 1))}
              >
                {step === 0 ? text.start : step === last ? text.play : text.next}
              </button>
            </div>
          </div>
        </section>
      </div>
      {leaving && (
        <div
          className="welcome-ring"
          aria-hidden="true"
          style={
            {
              '--wx': `${leaving.x}px`,
              '--wy': `${leaving.y}px`,
            } as CSSProperties
          }
        />
      )}
    </>
  )
}
