import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadedAudioEngine } from '../audio/loader'
import { MiniPlate } from '../components/MiniPlate'
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
import { voicingLabel } from '../music/stepVoicing'
import { TEMPO_MAX, TEMPO_MIN } from '../state/settings'
import { useStore } from '../state/store'

type Mode = 'minute' | 'metronome'

const MINUTE_MS = 60000
const BEAT_CHOICES = [4, 2, 1]

export function PracticeView() {
  const { t, notation, progression, tuning, soundingTuning, enableAudio, stopPlayback, playing } = useStore()

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
  const [startTempo, setStartTempo] = useState(DEFAULT_RAMP.start)
  const [beats, setBeats] = useState(4)
  const [ramp, setRamp] = useState(true)
  const [tempo, setTempo] = useState(DEFAULT_RAMP.start)
  const session = useRef({ changes: 0, base: DEFAULT_RAMP.start, tempo: DEFAULT_RAMP.start, top: 0, steps: 0 })

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

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(320px,1fr)_minmax(320px,1fr)]">
      <section className="plate flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="label-ink text-blue-ink">{t('practice.title')}</h2>
          <p className="text-[12px] leading-snug text-ink-soft">{t('practice.intro')}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              [inputA, setInputA, chordA, shapes[0], 'practice.chordA', 'practice-a'],
              [inputB, setInputB, chordB, shapes[1], 'practice.chordB', 'practice-b'],
            ] as const
          ).map(([value, setValue, chord, frets, label, id], index) => (
            <div
              key={id}
              className={`sheet flex flex-col items-center gap-2 p-3 ${live && active === index ? 'border-ink bg-paper-deep' : ''}`}
            >
              <label className="label-ink self-start text-blue-ink" htmlFor={id}>
                {t(label)}
              </label>
              <input
                id={id}
                className={`field text-center ${chord ? '' : 'field--error'}`}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                disabled={live}
                spellCheck={false}
                autoComplete="off"
                aria-invalid={!chord}
              />
              {chord && frets ? (
                <>
                  <MiniPlate frets={frets} className="h-[92px] w-[80px]" />
                  <span className="fv-ui text-[1.25rem] font-bold">{nameOf(chord)}</span>
                  <span className="readout text-[10px] text-ink-soft">{voicingLabel(frets)}</span>
                </>
              ) : (
                <span className="font-mono text-[11px] text-red-ink" role="alert">
                  {t('practice.invalid')}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('practice.title')}>
          {(['minute', 'metronome'] as const).map((item) => (
            <button
              key={item}
              type="button"
              className="stamp"
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

        {mode === 'metronome' && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1">
              <span className="label-ink text-blue-ink">{t('practice.startTempo')}</span>
              <button type="button" className="stamp px-2 py-0.5" disabled={live} onClick={() => setStartTempo((v) => Math.max(TEMPO_MIN, v - 4))} aria-label={t('a11y.tempoDown')}>
                −
              </button>
              <span className="ink-block font-mono text-[1rem] font-semibold tabular-nums" aria-live="polite">
                {startTempo}
              </span>
              <button type="button" className="stamp px-2 py-0.5" disabled={live} onClick={() => setStartTempo((v) => Math.min(TEMPO_MAX, v + 4))} aria-label={t('a11y.tempoUp')}>
                +
              </button>
            </div>
            <div className="flex items-center gap-1" role="group" aria-label={t('a11y.beats')}>
              <span className="label-ink text-blue-ink">{t('transport.beats')}</span>
              {BEAT_CHOICES.map((choice) => (
                <button key={choice} type="button" className="stamp px-1.5 py-0.5" aria-pressed={beats === choice} disabled={live} onClick={() => setBeats(choice)}>
                  {choice}
                </button>
              ))}
            </div>
            <button type="button" className="stamp" aria-pressed={ramp} disabled={live} onClick={() => setRamp(!ramp)} title={t('practice.rampHint')}>
              {t('practice.ramp')}
            </button>
          </div>
        )}

        <p className="text-[12px] leading-snug text-ink-soft">
          {mode === 'minute' ? t('practice.tapHint') : t('practice.metronomeHint')}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {live ? (
            <button type="button" className="stamp stamp--live min-w-[110px]" onClick={stop}>
              {t('practice.stop')}
            </button>
          ) : (
            <button type="button" className="stamp stamp--ink min-w-[110px]" onClick={() => void start()} disabled={!ready}>
              {t('practice.start')}
            </button>
          )}
          {live && mode === 'metronome' && (
            <button type="button" className="stamp" onClick={slower}>
              {t('practice.slower')}
            </button>
          )}
        </div>
      </section>

      <section className="plate flex flex-col gap-4 p-4" aria-live="polite">
        <div className="flex flex-wrap items-end gap-6">
          {mode === 'minute' && (
            <div className="flex flex-col">
              <span className="label-ink text-blue-ink">{t('practice.left')}</span>
              <span className="font-mono text-[2.5rem] font-semibold leading-none tabular-nums">
                {live ? remaining : 60}
                <span className="text-[1rem]">{t('practice.seconds')}</span>
              </span>
            </div>
          )}
          {mode === 'metronome' && (
            <div className="flex flex-col">
              <span className="label-ink text-blue-ink">{t('practice.tempo')}</span>
              <span className="font-mono text-[2.5rem] font-semibold leading-none tabular-nums">{live ? tempo : startTempo}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="label-ink text-blue-ink">{t('practice.changes')}</span>
            <span className="font-mono text-[2.5rem] font-semibold leading-none tabular-nums">{count}</span>
          </div>
          <div className="flex flex-col">
            <span className="label-ink text-blue-ink">{mode === 'minute' ? t('practice.best') : t('practice.bestTempo')}</span>
            <span className="font-mono text-[2.5rem] font-semibold leading-none tabular-nums text-ink-soft">{best ?? '—'}</span>
          </div>
        </div>

        {mode === 'minute' && (
          <button
            type="button"
            className="sheet grid min-h-[120px] place-items-center text-[1.75rem] font-bold disabled:opacity-40"
            onClick={tap}
            disabled={!live}
          >
            <span className="fv-display tracking-[0.08em]">{t('practice.tap')}</span>
          </button>
        )}

        {result && (
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="label-ink text-blue-ink">{t('practice.result')}</span>
            <span className="fv-ui text-[1.1rem] font-bold">
              {result.score} {mode === 'minute' ? t('practice.perMinute') : 'bpm'}
            </span>
            {result.newBest && <span className="chip bg-turquoise text-ink">{t('practice.newBest')}</span>}
          </p>
        )}
      </section>
    </div>
  )
}
