import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadedAudioEngine } from '../audio/loader'
import { ArrowRightIcon, MinusIcon, PlayIcon, PlusIcon, StopIcon } from '../components/icons'
import { useViewsText } from '../i18n/views'
import { parseChord } from '../music/parseChord'
import { chainVoicings } from '../music/playability'
import {
  DEFAULT_RAMP,
  changesPerMinute,
  loadRecords,
  pairKey,
  rampTempo,
  saveRecord,
  type PracticeRecord,
} from '../music/practice'
import { TEMPO_MAX, TEMPO_MIN } from '../state/settings'
import { useStore } from '../state/store'
import { ChordSlot } from './practice/ChordSlot'
import '../styles/views.css'

type Mode = 'minute' | 'metronome'

const MINUTE_MS = 60000
const BEAT_CHOICES = [4, 2, 1]

export function PracticeView() {
  const { t, notation, progression, tuning, soundingTuning, enableAudio, stopPlayback, playing, tempo: globalTempo } = useStore()
  const v = useViewsText()

  const [inputA, setInputA] = useState(progression[0]?.anglo ?? 'C')
  const [inputB, setInputB] = useState(progression[1]?.anglo ?? 'G')
  const chordA = useMemo(() => parseChord(inputA), [inputA])
  const chordB = useMemo(() => parseChord(inputB), [inputB])
  const shapes = useMemo(() => {
    if (!chordA || !chordB) return [null, null]
    return chainVoicings(
      [chordA, chordB].map((chord) => ({ rootPc: chord.rootPc, qualityId: chord.quality.id, bassPc: chord.bassPc })),
      tuning,
    )
  }, [chordA, chordB, tuning])
  const ready = Boolean(chordA && chordB && shapes[0] && shapes[1])
  const key = chordA && chordB ? pairKey(chordA.anglo, chordB.anglo) : null

  const [mode, setMode] = useState<Mode>('minute')
  const [records, setRecords] = useState<Record<string, PracticeRecord>>(loadRecords)
  const [running, setRunning] = useState(false)
  const [count, setCount] = useState(0)
  const [active, setActive] = useState<0 | 1>(0)
  const [result, setResult] = useState<{ score: number; newBest: boolean } | null>(null)

  // One-minute mode
  const [remaining, setRemaining] = useState(60)
  const countRef = useRef(0)

  // Metronome mode
  // The practice tempo is its own: it starts from the top bar tempo when the view opens and never flows back.
  const [startTempo, setStartTempo] = useState(() => Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, globalTempo)))
  const [beats, setBeats] = useState(4)
  const [ramp, setRamp] = useState(true)
  const [tempo, setTempo] = useState(startTempo)
  const session = useRef({ changes: 0, base: startTempo, tempo: startTempo, top: 0, steps: 0 })
  const tapRef = useRef<HTMLButtonElement>(null)

  const finish = useCallback(
    (score: number, recordKey: string | null) => {
      setRunning(false)
      if (!recordKey) return
      const newBest = saveRecord(recordKey, score)
      setRecords(loadRecords())
      setResult({ score, newBest })
    },
    [],
  )

  const stopMetronome = useCallback(() => {
    loadedAudioEngine()?.stopProgression()
    finish(session.current.top, key ? `${key}@tempo` : null)
  }, [finish, key])

  // Pressing the main Run button takes over the engine, which ends a metronome session.
  const live = running && !(mode === 'metronome' && playing)
  const ownsEngine = useRef(false)
  useEffect(() => {
    ownsEngine.current = live && mode === 'metronome'
  }, [live, mode])
  // Stop practice audio when leaving the view, but never the main progression.
  useEffect(
    () => () => {
      if (ownsEngine.current) loadedAudioEngine()?.stopProgression()
    },
    [],
  )

  // Focus the big button so Space taps it instead of re-pressing Empezar/Terminar.
  useEffect(() => {
    if (live && mode === 'minute') tapRef.current?.focus()
  }, [live, mode])

  useEffect(() => {
    if (!running || mode !== 'minute') return
    const started = Date.now()
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - started
      if (elapsed >= MINUTE_MS) {
        window.clearInterval(timer)
        finish(changesPerMinute(countRef.current, MINUTE_MS), key)
        return
      }
      setRemaining(Math.ceil((MINUTE_MS - elapsed) / 1000))
    }, 200)
    return () => window.clearInterval(timer)
  }, [running, mode, finish, key])

  const tap = useCallback(() => {
    if (!running || mode !== 'minute') return
    countRef.current += 1
    setCount(countRef.current)
    setActive((current) => (current === 0 ? 1 : 0))
  }, [running, mode])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON') return
      event.preventDefault()
      tap()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [tap])

  const start = async () => {
    if (!ready) return
    stopPlayback()
    setResult(null)
    setCount(0)
    setActive(0)
    countRef.current = 0
    if (mode === 'minute') {
      setRemaining(60)
      setRunning(true)
      return
    }
    await enableAudio()
    const engine = loadedAudioEngine()
    if (!engine?.isStarted) return
    session.current = { changes: 0, base: startTempo, tempo: startTempo, top: startTempo, steps: 0 }
    setTempo(startTempo)
    engine.playProgression({
      stepCount: 2,
      tempo: startTempo,
      loop: true,
      beatsPerChord: beats,
      tuning: soundingTuning,
      metronome: true,
      getFrets: (index) => shapes[index] ?? null,
      onStep: (index) => {
        setActive(index === 0 ? 0 : 1)
        const current = session.current
        current.steps += 1
        if (current.steps === 1) return
        current.changes += 1
        setCount(current.changes)
        if (!ramp) return
        const next = rampTempo(current.changes, { ...DEFAULT_RAMP, start: current.base, max: TEMPO_MAX })
        if (next !== current.tempo) {
          current.tempo = next
          current.top = Math.max(current.top, next)
          setTempo(next)
          loadedAudioEngine()?.updateProgression({ tempo: next })
        }
      },
    })
    setRunning(true)
  }

  const slower = () => {
    const current = session.current
    const next = Math.max(TEMPO_MIN, current.tempo - 8)
    // Restart the ramp from the slower tempo.
    current.base = next
    current.tempo = next
    current.changes = 0
    setTempo(next)
    loadedAudioEngine()?.updateProgression({ tempo: next })
  }

  const stop = () => {
    if (mode === 'metronome') stopMetronome()
    else finish(changesPerMinute(countRef.current, MINUTE_MS - remaining * 1000), null)
  }

  const nameOf = (chord: NonNullable<typeof chordA>) => (notation === 'latin' ? chord.latin : chord.anglo)
  const best = key ? records[mode === 'minute' ? key : `${key}@tempo`]?.best : undefined
  const slots = [
    [inputA, setInputA, chordA, shapes[0], 'practice.chordA', 'practice-a'],
    [inputB, setInputB, chordB, shapes[1], 'practice.chordB', 'practice-b'],
  ] as const

  const readouts: Array<[string, string | number, boolean]> = [
    mode === 'minute'
      ? [t('practice.left'), `${live ? remaining : 60}${t('practice.seconds')}`, false]
      : [v('practice.ownTempo'), live ? tempo : startTempo, false],
    [t('practice.changes'), count, false],
    [mode === 'minute' ? t('practice.best') : t('practice.bestTempo'), best ?? v('practice.noRecord'), true],
  ]

  return (
    <div className="pv flex flex-col gap-3 desk:h-full desk:min-h-0 desk:gap-2">
      <div className="pv-top">
        {slots.map(([value, setValue, chord, frets, label, id], index) => (
          <Fragment key={id}>
            {index === 1 && (
              <span className="pv-link" aria-hidden="true">
                <ArrowRightIcon size={20} />
              </span>
            )}
            <ChordSlot
              id={id}
              label={t(label)}
              value={value}
              onChange={setValue}
              name={chord ? nameOf(chord) : null}
              frets={frets}
              disabled={live}
              playing={live && active === index}
              playingLabel={v('practice.playing')}
              invalidLabel={t('practice.invalid')}
            />
          </Fragment>
        ))}

        <section className="cc-module pv-setup" aria-label={v('practice.setup')}>
          <h2 className="cc-label">{t('practice.title')}</h2>
          <div className="cc-seg pv-setup__modes" role="group" aria-label={v('practice.mode')}>
            {(['minute', 'metronome'] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={mode === item}
                disabled={live}
                onClick={() => {
                  setMode(item)
                  setResult(null)
                }}
              >
                {t(item === 'minute' ? 'practice.minute' : 'practice.metronome')}
              </button>
            ))}
          </div>
          {mode === 'metronome' ? (
            <div className="pv-setup__row">
              <div className="pv-stepper" role="group" aria-label={v('practice.ownTempo')} title={v('practice.ownTempoHint')}>
                <span className="pv-stepper__label">{v('practice.ownTempo')}</span>
                <button type="button" className="cc-btn cc-btn--icon" disabled={live} onClick={() => setStartTempo((n) => Math.max(TEMPO_MIN, n - 4))} aria-label={t('a11y.tempoDown')}>
                  <MinusIcon size={16} />
                </button>
                <span className="pv-stepper__value cc-num" aria-live="polite">
                  {startTempo}
                </span>
                <button type="button" className="cc-btn cc-btn--icon" disabled={live} onClick={() => setStartTempo((n) => Math.min(TEMPO_MAX, n + 4))} aria-label={t('a11y.tempoUp')}>
                  <PlusIcon size={16} />
                </button>
              </div>
              <div className="pv-stepper" role="group" aria-label={t('a11y.beats')}>
                <span className="pv-stepper__label">{t('transport.beats')}</span>
                <div className="cc-seg">
                  {BEAT_CHOICES.map((choice) => (
                    <button key={choice} type="button" aria-pressed={beats === choice} disabled={live} onClick={() => setBeats(choice)}>
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" className="cc-btn" aria-pressed={ramp} disabled={live} onClick={() => setRamp(!ramp)} title={t('practice.rampHint')}>
                {t('practice.ramp')}
              </button>
            </div>
          ) : null}
          <ol className="pv-steps">
            <li>{v('practice.how1')}</li>
            <li>{v('practice.how2')}</li>
            <li>{v(mode === 'minute' ? 'practice.how3.minute' : 'practice.how3.metronome')}</li>
          </ol>
        </section>
      </div>

      <section className="cc-module pv-stats" aria-label={v('practice.round')} aria-live="polite">
        <dl className="pv-stats__grid">
          {readouts.map(([label, value, soft]) => (
            <div className="pv-stat" key={label}>
              <dt className="cc-label">{label}</dt>
              <dd className={`pv-stat__value cc-num ${soft ? 'is-soft' : ''} ${soft && typeof value === 'string' ? 'is-empty' : ''}`}>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="pv-stats__actions">
          {live && mode === 'metronome' && (
            <button type="button" className="cc-btn" onClick={slower}>
              {t('practice.slower')}
            </button>
          )}
          {live ? (
            <button type="button" className="cc-btn cc-btn--lg pv-end" onClick={stop}>
              <StopIcon size={18} />
              {v('practice.endRound')}
            </button>
          ) : (
            <button type="button" className="cc-btn cc-btn--lg cc-btn--primary" onClick={() => void start()} disabled={!ready}>
              <PlayIcon size={18} />
              {v('practice.startRound')}
            </button>
          )}
        </div>
      </section>

      <section className="cc-module pv-stage" data-mode={mode}>
        {mode === 'minute' ? (
          <>
            <button type="button" ref={tapRef} className="pv-tap" onClick={tap} disabled={!live}>
              <svg className="pv-tap__rings" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
                <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
                  <circle cx="200" cy="100" r="50" />
                  <circle cx="200" cy="100" r="90" />
                  <circle cx="200" cy="100" r="140" />
                  <circle cx="200" cy="100" r="200" />
                </g>
              </svg>
              <span className="pv-tap__label">{t('practice.tap')}</span>
            </button>
            <span className="pv-stage__key cc-label">{v('practice.space')}</span>
          </>
        ) : (
          <div className="pv-follow" aria-hidden="true">
            <svg className="pv-tap__rings" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" focusable="false">
              <g fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
                <circle cx="200" cy="100" r="50" />
                <circle cx="200" cy="100" r="90" />
                <circle cx="200" cy="100" r="140" />
              </g>
            </svg>
            <span className="pv-follow__chord">{live && (active === 0 ? chordA : chordB) ? nameOf((active === 0 ? chordA : chordB)!) : '·'}</span>
          </div>
        )}
        {result && (
          <p className="pv-result" role="status">
            <span className="cc-label">{t('practice.result')}</span>
            <span className="pv-result__score cc-num">
              {result.score} {mode === 'minute' ? t('practice.perMinute') : 'bpm'}
            </span>
            {result.newBest && <span className="cc-chip pv-result__best">{t('practice.newBest')}</span>}
          </p>
        )}
      </section>
    </div>
  )
}
