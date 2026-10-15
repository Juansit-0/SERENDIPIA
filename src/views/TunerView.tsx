import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTuner } from '../audio/useTuner'
import { MicIcon } from '../components/icons'
import { tunerText } from '../i18n/tuner'
import { LATIN_SHARP, PITCH_SHARP } from '../music/notes'
import { readTuner, tuneAdvice } from '../music/tuner'
import { TUNINGS } from '../music/voicings'
import { useStore } from '../state/store'
import { useTheme } from '../state/theme'
import type { TunerPalette, TunerScene } from '../tuner/scene'
import '../styles/tuner.css'

/** The dial spans ±60° from the top of the ring for ±50 cents. */
const SPAN = 50
const SWEEP = 60

function readPalette(): TunerPalette {
  const css = getComputedStyle(document.documentElement)
  const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  return {
    ink: token('--cc-ink', '#ece5f8'),
    accent: token('--cc-accent', '#c7b3e8'),
    tune: token('--cc-fn-sub-fill', '#40e0d0'),
    flat: token('--cc-fn-tonic-fill', '#c7b3e8'),
    sharp: token('--cc-fn-dom-fill', '#e8c37a'),
  }
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** A point on a circle of radius `r`, `angle` degrees clockwise from the top. */
function polar(angle: number, r: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180
  return [r * Math.cos(rad), r * Math.sin(rad)]
}

/**
 * Afinador: a ring of stars in the middle of the sky. Out of tune it vibrates and turns (lilac when flat, gold when
 * sharp); in tune it settles turquoise and sends ripples out. The dial over the ring reads the cents, the headstock
 * beside it picks a string.
 */
export function TunerView() {
  const { lang, notation, tuning, tuningId, setTuningId, playOpenString } = useStore()
  const { theme } = useTheme()
  const x = tunerText[lang]
  const { status, frequency, start, stop } = useTuner()
  const [target, setTarget] = useState<number | null>(null)

  const stage = useRef<HTMLDivElement | null>(null)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const scene = useRef<TunerScene | null>(null)
  const [radius, setRadius] = useState(150)
  const [skyReady, setSkyReady] = useState(false)

  const reading = frequency ? readTuner(frequency, tuning, target) : null
  const advice = reading ? tuneAdvice(reading.stringCents) : null
  const cents = reading ? Math.max(-SPAN, Math.min(SPAN, reading.stringCents)) : null
  const needle = cents === null ? 0 : (cents / SPAN) * SWEEP

  const noteName = (midi: number) => {
    const pc = ((midi % 12) + 12) % 12
    return notation === 'latin' ? LATIN_SHARP[pc] : PITCH_SHARP[pc]
  }
  const stringLabel = (midi: number) => {
    const pc = ((midi % 12) + 12) % 12
    if (notation === 'latin') return LATIN_SHARP[pc]
    if (notation === 'anglo') return PITCH_SHARP[pc]
    return `${PITCH_SHARP[pc]} · ${LATIN_SHARP[pc]}`
  }

  // The microphone closes when leaving the view.
  useEffect(() => stop, [stop])

  // three.js loads only here.
  useEffect(() => {
    let cancelled = false
    import('../tuner/scene')
      .then(({ createTunerScene }) => {
        if (cancelled || !canvas.current) return
        scene.current = createTunerScene(canvas.current, {
          reduced: reducedMotion(),
          palette: readPalette(),
          day: document.documentElement.dataset.theme === 'day',
        })
        if (import.meta.env.DEV) (window as unknown as { __tunerScene?: unknown }).__tunerScene = scene.current
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
    scene.current?.setPalette(readPalette(), theme === 'day')
  }, [theme, skyReady])

  useEffect(() => {
    scene.current?.update({ cents, inTune: advice === 'in-tune' })
  }, [cents, advice, skyReady])

  useLayoutEffect(() => {
    const host = stage.current
    if (!host || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const box = host.getBoundingClientRect()
      setRadius(Math.max(90, Math.min(box.width * 0.4, box.height * 0.34, 230)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    scene.current?.layout(radius)
  }, [radius, skyReady])

  const message =
    status === 'starting'
      ? x.starting
      : status === 'denied'
        ? x.denied
        : status === 'unsupported'
          ? x.unsupported
          : status === 'error'
            ? x.error
            : null
  const listening = status === 'listening'
  const size = radius * 2 + 120
  const half = size / 2
  const [nx, ny] = polar(needle, radius + 18)

  return (
    <div className="tn" data-advice={advice ?? 'none'} data-listening={listening}>
      <h2 className="sr-only">{x.title}</h2>
      <div ref={stage} className="tn-stage">
        <canvas ref={canvas} className="tn-sky" aria-hidden="true" />
        <svg
          className="tn-dial"
          width={size}
          height={size}
          viewBox={`${-half} ${-half} ${size} ${size}`}
          role="img"
          aria-label={reading ? `${x.gauge}: ${reading.stringCents} ${x.cents}` : x.gauge}
        >
          {!skyReady && <circle className="tn-ring-fallback" r={radius} />}
          {Array.from({ length: 21 }, (_, i) => {
            const value = -SPAN + i * 5
            const angle = (value / SPAN) * SWEEP
            const long = value % 25 === 0
            const [x1, y1] = polar(angle, radius + (value === 0 ? 4 : long ? 8 : 11))
            const [x2, y2] = polar(angle, radius + (value === 0 ? 34 : long ? 26 : 20))
            return <line key={value} className={`tn-tick ${value === 0 ? 'is-zero' : ''}`} x1={x1} y1={y1} x2={x2} y2={y2} />
          })}
          <text className="tn-scale" x={polar(-SWEEP - 9, radius + 22)[0]} y={polar(-SWEEP - 9, radius + 22)[1] + 6} textAnchor="middle">
            ♭
          </text>
          <text className="tn-scale" x={polar(SWEEP + 9, radius + 22)[0]} y={polar(SWEEP + 9, radius + 22)[1] + 6} textAnchor="middle">
            ♯
          </text>
          {cents !== null && Math.abs(needle) > 0.5 && (
            <path
              className={`tn-trace ${cents < 0 ? 'is-flat' : 'is-sharp'}`}
              d={`M${polar(0, radius + 18).join(' ')} A${radius + 18} ${radius + 18} 0 0 ${needle > 0 ? 1 : 0} ${nx} ${ny}`}
            />
          )}
          <g className="tn-needle" style={{ transform: `translate(${nx}px, ${ny}px)`, opacity: reading ? 1 : 0.4 }}>
            <path d="M0,-12 Q1.6,-1.6 12,0 Q1.6,1.6 0,12 Q-1.6,1.6 -12,0 Q-1.6,-1.6 0,-12Z" />
          </g>
        </svg>

        <div className="tn-core" style={{ width: radius * 1.5 }}>
          {listening || reading ? (
            <>
              <p className="tn-note" key={reading ? reading.midi : 'none'}>
                {reading ? noteName(reading.midi) : '—'}
              </p>
              <p className="tn-cents cc-num">
                {reading
                  ? `${reading.stringCents > 0 ? '+' : reading.stringCents < 0 ? '−' : ''}${Math.abs(reading.stringCents)} ${x.cents}`
                  : ' '}
              </p>
              <p className="tn-advice" aria-live="polite">
                {advice === 'in-tune'
                  ? x.inTune
                  : advice === 'tighten'
                    ? `${x.tighten} ↑`
                    : advice === 'loosen'
                      ? `${x.loosen} ↓`
                      : x.listen}
              </p>
            </>
          ) : (
            <>
              <p className="tn-lead">{x.lead}</p>
              <button
                type="button"
                className="cc-btn cc-btn--primary tn-start"
                disabled={status === 'starting' || status === 'unsupported'}
                onClick={() => void start()}
              >
                <MicIcon size={16} />
                {x.start}
              </button>
              {message && <p className={`tn-message ${status === 'starting' ? '' : 'is-error'}`}>{message}</p>}
            </>
          )}
        </div>
      </div>

      <aside className="tn-side">
        <div className="tn-field">
          <label className="cc-label" htmlFor="tuner-tuning">
            {x.tuning}
          </label>
          <select id="tuner-tuning" className="cc-select" value={tuningId} onChange={(event) => setTuningId(event.target.value)}>
            {TUNINGS.map((item) => (
              <option key={item.id} value={item.id}>
                {x.tunings[item.id as keyof typeof x.tunings] ?? item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="tn-field">
          <span className="cc-label" title={x.stringsHint}>
            {x.strings} · {target === null ? x.auto : `${x.string} ${6 - target}`}
          </span>
          {/* A headstock: the three low strings' pegs on the left, the three high ones on the right. */}
          <div className="tn-headstock" role="group" aria-label={x.strings}>
            <span className="tn-headstock__wood" aria-hidden="true" />
            {tuning.map((midi, index) => (
              <button
                key={index}
                type="button"
                className="tn-peg"
                style={{ gridColumn: index < 3 ? 1 : 3, gridRow: index < 3 ? 3 - index : index - 2 }}
                aria-pressed={target === index}
                data-near={reading?.stringIndex === index ? 'true' : undefined}
                aria-label={`${x.string} ${6 - index}: ${stringLabel(midi)}`}
                title={x.stringsHint}
                onClick={() => {
                  if (target === index) {
                    setTarget(null)
                    return
                  }
                  setTarget(index)
                  playOpenString(index)
                }}
              >
                <small aria-hidden="true">{6 - index}</small>
                <span aria-hidden="true">{noteName(midi)}</span>
              </button>
            ))}
          </div>
          <p className="tn-hint">{x.stringsHint}</p>
        </div>

        <p className="tn-explain">{x.explain}</p>

        {listening && (
          <button type="button" className="cc-btn cc-btn--ghost tn-stop" onClick={stop}>
            {x.stop}
          </button>
        )}
      </aside>
    </div>
  )
}
