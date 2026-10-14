import { useCallback, useEffect, useRef, useState } from 'react'
import { BACKING_STYLES } from '../../audio/backing'
import { startRecording, type Recording, type RecorderFailure } from '../../audio/recorder'
import { PlayIcon, StopIcon } from '../../components/icons'
import { recorderText } from '../../i18n/recorder'
import { showNotice } from '../../state/notice'
import { useStore } from '../../state/store'
import { deleteTake, listTakes, saveTake, takeExtension, type Take } from '../../state/takes'

const clock = (ms: number) => {
  const seconds = Math.round(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** Práctica → Grabar: record yourself over the progression, then listen back alone or with the band. */
export function Recorder() {
  const { lang, notation, progression, tempo, backing, playing, togglePlay, stopPlayback } = useStore()
  const x = recorderText[lang]
  const [status, setStatus] = useState<'idle' | 'starting' | 'recording' | RecorderFailure>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [takes, setTakes] = useState<Take[]>([])
  const [listening, setListening] = useState<{ id: string; band: boolean } | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const recording = useRef<{ session: Recording; startedAt: number } | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    void listTakes().then(setTakes).catch(() => setTakes([]))
  }, [])

  // What is being listened to, also as a ref so stopping never depends on a stale render.
  const listeningRef = useRef<{ id: string; band: boolean } | null>(null)
  const stopListening = useCallback(() => {
    if (audio.current) {
      audio.current.pause()
      URL.revokeObjectURL(audio.current.src)
      audio.current = null
    }
    if (listeningRef.current?.band) stopPlayback()
    listeningRef.current = null
    setListening(null)
  }, [stopPlayback])

  // Leaving the section: no recording or playback goes on behind it.
  useEffect(
    () => () => {
      recording.current?.session.cancel()
      recording.current = null
      audio.current?.pause()
    },
    [],
  )

  useEffect(() => {
    if (status !== 'recording') return
    const timer = window.setInterval(() => setElapsed(performance.now() - (recording.current?.startedAt ?? performance.now())), 250)
    return () => window.clearInterval(timer)
  }, [status])

  const start = async () => {
    stopListening()
    stopPlayback()
    setStatus('starting')
    const session = await startRecording()
    if (typeof session === 'string') {
      setStatus(session)
      return
    }
    recording.current = { session, startedAt: performance.now() }
    setElapsed(0)
    setStatus('recording')
    if (progression.length > 0) togglePlay()
  }

  const stop = async () => {
    const current = recording.current
    recording.current = null
    if (!current) return
    stopPlayback()
    const blob = await current.session.stop()
    const style = BACKING_STYLES.find((item) => item.id === backing)
    const chords = progression.map((step) => (notation === 'latin' ? step.latin : step.anglo)).join(' · ')
    const title = [chords, `${tempo} bpm`, backing !== 'none' && style ? (lang === 'es' ? style.nameEs : style.nameEn) : null].filter(Boolean).join(' · ')
    const take: Take = {
      id: `take-${Date.now()}`,
      createdAt: new Date().toISOString(),
      durationMs: performance.now() - current.startedAt,
      mime: current.session.mime,
      blob,
      title,
      tempo,
    }
    setStatus('idle')
    try {
      setTakes(await saveTake(take))
      showNotice(x.saved)
    } catch {
      setStatus('error')
    }
  }

  const listen = (take: Take, band: boolean) => {
    stopListening()
    const player = new Audio(URL.createObjectURL(take.blob))
    audio.current = player
    player.onended = stopListening
    listeningRef.current = { id: take.id, band }
    setListening({ id: take.id, band })
    if (band && progression.length > 0 && !playing) togglePlay()
    void player.play().catch(stopListening)
  }

  const download = (take: Take) => {
    const url = URL.createObjectURL(take.blob)
    const anchor = document.createElement('a')
    const stamp = take.createdAt.slice(0, 16).replace(/[T:]/g, '-')
    anchor.href = url
    anchor.download = `serendipia-${stamp}.${takeExtension(take.mime)}`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const message = status === 'denied' ? x.denied : status === 'unsupported' ? x.unsupported : status === 'error' ? x.error : null
  const dateLabel = (iso: string) => new Date(iso).toLocaleString(lang === 'es' ? 'es' : 'en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="rec flex flex-col gap-3 desk:min-h-0 desk:flex-1 desk:gap-2">
      <section className="cc-module rec-stage" data-state={status}>
        <h2 className="cc-label">{x.title}</h2>
        <button
          type="button"
          className="rec-button"
          aria-pressed={status === 'recording'}
          disabled={status === 'starting'}
          onClick={() => void (status === 'recording' ? stop() : start())}
        >
          <span className="rec-button__dot" aria-hidden="true" />
          <span>{status === 'recording' ? x.stop : status === 'starting' ? x.starting : x.record}</span>
        </button>
        <p className="rec-status" aria-live="polite">
          {status === 'recording' ? (
            <>
              <b>{x.recording}</b> <span className="cc-num">{clock(elapsed)}</span>
            </>
          ) : (
            (message ?? x.how)
          )}
        </p>
        <p className="rec-hint">{x.headphones}</p>
      </section>

      <section className="cc-module rec-takes">
        <h3 className="cc-label">{x.takes}</h3>
        {takes.length === 0 ? (
          <p className="pg-empty">{x.none}</p>
        ) : (
          <ul>
            {takes.map((take) => {
              const live = listening?.id === take.id
              return (
                <li key={take.id}>
                  <div className="min-w-0">
                    <span className="rec-take__when">
                      {dateLabel(take.createdAt)} · <span className="cc-num">{clock(take.durationMs)}</span>
                    </span>
                    <span className="rec-take__title">{take.title}</span>
                  </div>
                  <div className="rec-take__actions">
                    {live ? (
                      <button type="button" className="cc-btn cc-btn--primary" onClick={stopListening}>
                        <StopIcon size={14} /> {x.stopListening}
                      </button>
                    ) : (
                      <>
                        <button type="button" className="cc-btn" onClick={() => listen(take, false)}>
                          <PlayIcon size={14} /> {x.listen}
                        </button>
                        <button type="button" className="cc-btn" onClick={() => listen(take, true)} disabled={progression.length === 0}>
                          {x.withBand}
                        </button>
                      </>
                    )}
                    <button type="button" className="cc-btn cc-btn--ghost" onClick={() => download(take)}>
                      {x.download}
                    </button>
                    <button
                      type="button"
                      className="cc-btn cc-btn--ghost"
                      onBlur={() => setConfirmId((current) => (current === take.id ? null : current))}
                      onClick={() => {
                        if (confirmId !== take.id) {
                          setConfirmId(take.id)
                          return
                        }
                        if (live) stopListening()
                        void deleteTake(take.id).then(() => setTakes((current) => current.filter((item) => item.id !== take.id)))
                        setConfirmId(null)
                      }}
                    >
                      {confirmId === take.id ? x.removeConfirm : x.remove}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <p className="rec-hint">{x.kept}</p>
      </section>
    </div>
  )
}
