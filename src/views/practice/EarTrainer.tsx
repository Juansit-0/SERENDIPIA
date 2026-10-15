import { useCallback, useEffect, useRef, useState } from 'react'
import { ListenIcon } from '../../components/icons'
import { earText } from '../../i18n/ear'
import { chordTones, qualityById, type QualityId } from '../../music/chords'
import { INTERVAL_NAMES, levelCount, loadEarRecords, makeQuestion, recordKey, saveEarStreak, type EarMode, type EarQuestion } from '../../music/ear'
import { logPractice } from '../../music/history'
import { useStore } from '../../state/store'

/** Ear training: the app plays a chord or an interval, the player names it; streaks are kept per mode and level. */
export function EarTrainer() {
  const { lang, playNotes } = useStore()
  const x = earText[lang]
  const [mode, setMode] = useState<EarMode>('quality')
  const [level, setLevel] = useState(0)
  const [arpeggio, setArpeggio] = useState(false)
  const [question, setQuestion] = useState<EarQuestion | null>(null)
  const [answered, setAnswered] = useState<{ choice: string; correct: boolean } | null>(null)
  const [streak, setStreak] = useState(0)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [records, setRecords] = useState(loadEarRecords)
  const [newBest, setNewBest] = useState(false)
  const nextTimer = useRef<number | undefined>(undefined)
  const askedAt = useRef(0)
  useEffect(() => () => window.clearTimeout(nextTimer.current), [])

  const label = useCallback(
    (choice: string) => (mode === 'quality' ? (lang === 'es' ? qualityById(choice as QualityId).nameEs : qualityById(choice as QualityId).nameEn) : INTERVAL_NAMES[Number(choice)][lang]),
    [mode, lang],
  )

  const play = useCallback((target: EarQuestion) => playNotes(target.midi, target.mode === 'interval' || arpeggio), [playNotes, arpeggio])

  const ask = useCallback(
    (previous?: EarQuestion | null) => {
      window.clearTimeout(nextTimer.current)
      const next = makeQuestion(mode, level, Math.random, previous ?? undefined)
      setQuestion(next)
      askedAt.current = Date.now()
      setAnswered(null)
      setNewBest(false)
      play(next)
    },
    [mode, level, play],
  )

  // Changing what is asked starts over.
  const reset = () => {
    window.clearTimeout(nextTimer.current)
    setQuestion(null)
    setAnswered(null)
    setStreak(0)
    setScore({ right: 0, total: 0 })
    setNewBest(false)
  }

  const answer = useCallback(
    (choice: string) => {
      if (!question || answered) return
      const correct = choice === question.answer
      setAnswered({ choice, correct })
      // Time listening counts as practice, up to half a minute per question.
      logPractice({ seconds: Math.min(30, (Date.now() - askedAt.current) / 1000), ear: { right: correct } })
      setScore((current) => ({ right: current.right + (correct ? 1 : 0), total: current.total + 1 }))
      if (correct) {
        const nextStreak = streak + 1
        setStreak(nextStreak)
        const saved = saveEarStreak(mode, level, nextStreak)
        setRecords(saved.records)
        if (saved.best && nextStreak > 1) setNewBest(true)
        nextTimer.current = window.setTimeout(() => ask(question), 1100)
      } else {
        setStreak(0)
      }
    },
    [question, answered, streak, mode, level, ask],
  )

  /** Plays what sounded, then what the player said, from the same root. */
  const compare = () => {
    if (!question || !answered) return
    play(question)
    const root = question.midi[0]
    const said =
      mode === 'quality'
        ? (() => {
            const midi = [root]
            for (const pc of chordTones(root % 12, qualityById(answered.choice as QualityId)).slice(1)) {
              let note = midi[midi.length - 1] + 1
              while (note % 12 !== pc) note += 1
              midi.push(note)
            }
            return midi
          })()
        : [root, root + Number(answered.choice)]
    window.setTimeout(() => playNotes(said, mode === 'interval' || arpeggio), 1600)
  }

  // Space hears again; 1–9 answer.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return
      if (event.code === 'Space') {
        if (target?.tagName === 'BUTTON') return
        event.preventDefault()
        if (question) play(question)
        else ask()
        return
      }
      const index = Number(event.key) - 1
      if (question && Number.isInteger(index) && index >= 0 && index < question.choices.length) answer(question.choices[index])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question, play, ask, answer])

  const best = records[recordKey(mode, level)] ?? 0
  const choices = question?.choices ?? makeQuestion(mode, level, () => 0).choices

  return (
    <div className="ear flex flex-col gap-3 desk:min-h-0 desk:flex-1 desk:gap-2">
      <div className="ear-top">
        <section className="cc-module ear-setup" aria-label={x.title}>
          <h2 className="cc-label">{x.title}</h2>
          <div className="ear-setup__row">
            <span className="ear-setup__k">{x.mode}</span>
            <div className="cc-seg" role="group" aria-label={x.mode}>
              {(['quality', 'interval'] as EarMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={mode === item}
                  onClick={() => {
                    setMode(item)
                    setLevel((current) => Math.min(current, levelCount(item) - 1))
                    reset()
                  }}
                >
                  {item === 'quality' ? x.modeQuality : x.modeInterval}
                </button>
              ))}
            </div>
          </div>
          <div className="ear-setup__row">
            <span className="ear-setup__k">{x.level}</span>
            <div className="cc-seg" role="group" aria-label={x.level}>
              {Array.from({ length: levelCount(mode) }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-pressed={level === index}
                  onClick={() => {
                    setLevel(index)
                    reset()
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
          {mode === 'quality' && (
            <div className="ear-setup__row">
              <span className="ear-setup__k">{x.style}</span>
              <div className="cc-seg" role="group" aria-label={x.style}>
                <button type="button" aria-pressed={!arpeggio} onClick={() => setArpeggio(false)}>
                  {x.together}
                </button>
                <button type="button" aria-pressed={arpeggio} onClick={() => setArpeggio(true)}>
                  {x.arpeggio}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="cc-module pv-stats ear-stats" aria-live="polite">
          <dl className="pv-stats__grid">
            {(
              [
                [x.streak, streak],
                [x.score, `${score.right}/${score.total}`],
                [x.best, best],
              ] as Array<[string, string | number]>
            ).map(([name, value]) => (
              <div className="pv-stat" key={name}>
                <dt className="cc-label">{name}</dt>
                <dd key={String(value)} className="pv-stat__value cc-num">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          {newBest && <span className="cc-chip ear-best">★ {x.newBest}</span>}
        </section>
      </div>

      <section className="cc-module ear-stage" data-state={answered ? (answered.correct ? 'right' : 'wrong') : 'asking'}>
        <button type="button" className="ear-play" onClick={() => (question ? play(question) : ask())}>
          <ListenIcon size={28} />
          <span>{question ? x.replay : x.begin}</span>
        </button>
        <p className="ear-ask">{question ? (mode === 'quality' ? x.askQuality : x.askInterval) : x.ready}</p>

        <div className="ear-choices" role="group" aria-label={mode === 'quality' ? x.askQuality : x.askInterval}>
          {choices.map((choice, index) => {
            const state = !answered || !question ? undefined : choice === question.answer ? 'right' : choice === answered.choice ? 'wrong' : undefined
            return (
              <button key={choice} type="button" className="cc-btn cc-btn--lg ear-choice" data-state={state} disabled={!question || Boolean(answered)} onClick={() => answer(choice)}>
                <small aria-hidden="true">{index + 1}</small>
                {label(choice)}
              </button>
            )
          })}
        </div>

        <p className="ear-feedback" role="status">
          {answered && question
            ? answered.correct
              ? `${x.right} ${label(question.answer)}.`
              : `${x.was} ${label(question.answer)} — ${x.youSaid} ${label(answered.choice)}.`
            : ' '}
        </p>
        <p className="ear-keys">{x.hint}</p>
        {answered && !answered.correct && (
          <div className="ear-after">
            <button type="button" className="cc-btn" onClick={compare}>
              {x.compare}
            </button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={() => ask(question)}>
              {x.next}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
