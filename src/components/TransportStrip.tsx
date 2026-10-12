import { useState } from 'react'
import { STRUMS, type StrumId } from '../audio/strums'
import { TIMBRES, type TimbreId } from '../audio/types'
import { MAX_CAPO } from '../music/capo'
import { LATIN_SHARP, PITCH_SHARP } from '../music/notes'
import { usePlayheadBeat } from '../state/playhead'
import { BEAT_OPTIONS, TEMPO_MAX, TEMPO_MIN } from '../state/settings'
import { useStore, type Notation, type ViewId } from '../state/store'
import { RegMark } from './RegMark'

const VIEWS: ViewId[] = ['chord', 'theory', 'practice']
const NOTATIONS: Notation[] = ['anglo', 'both', 'latin']
const OPEN_KEY = 'serendipia.transportOpen'

// Per-viewer convenience only: whether the phone layout shows every transport setting.
function readOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) === '1'
  } catch {
    return false
  }
}

export function TransportStrip() {
  // Below `sm` the strip folds to: views, Run, tempo and a Settings toggle. From `sm` up it is always open.
  const [open, setOpen] = useState(readOpen)
  const toggleOpen = () => {
    setOpen((current) => {
      try {
        localStorage.setItem(OPEN_KEY, current ? '0' : '1')
      } catch {
        // storage unavailable: the toggle still works for this visit
      }
      return !current
    })
  }
  const foldable = open ? 'contents' : 'hidden sm:contents'
  const {
    t,
    lang,
    setLang,
    view,
    setView,
    notation,
    setNotation,
    tempo,
    setTempo,
    beatsPerChord,
    setBeatsPerChord,
    loop,
    setLoop,
    metronome,
    setMetronome,
    timbre,
    setTimbre,
    strum,
    setStrum,
    capo,
    setCapo,
    volume,
    setVolume,
    playing,
    togglePlay,
    progression,
    audioReady,
    audioLoading,
    audioFallback,
    enableAudio,
    keyRootPc,
    setKeyRootPc,
    keyMode,
    setKeyMode,
    keyAuto,
    setKeyAuto,
  } = useStore()

  return (
    <header className="plate dense relative flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:px-5 desk:gap-x-3 desk:gap-y-0.5 desk:py-0.5">
      <RegMark className="left-1.5 top-1.5" />
      <RegMark className="right-1.5 top-1.5" />
      <RegMark className="bottom-1.5 left-1.5" />
      <RegMark className="bottom-1.5 right-1.5" />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 desk:shrink-0 desk:flex-nowrap desk:gap-x-3">
        <h1 className="fv-display text-[1.0625rem] tracking-[0.24em] desk:text-[0.9375rem] desk:tracking-[0.18em]">SERENDIPIA</h1>
        <nav className="flex flex-wrap gap-1.5 desk:flex-nowrap desk:gap-1" aria-label={t('a11y.views')}>
          {VIEWS.map((item) => (
            <button
              key={item}
              type="button"
              className="stamp"
              aria-current={view === item ? 'page' : undefined}
              onClick={() => setView(item)}
            >
              {t(`tabs.${item}` as const)}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 desk:shrink-0 desk:flex-nowrap desk:gap-x-2">
        <button
          type="button"
          className={`stamp min-w-[86px] desk:min-w-[64px] ${playing ? 'stamp--live' : 'stamp--ink'}`}
          onClick={togglePlay}
          disabled={progression.length === 0 && !metronome}
        >
          {playing ? t('transport.stop') : t('transport.run')}
        </button>
        {playing && <BeatDots />}

        <div className="flex items-center gap-2 desk:gap-1">
          <span className="label-ink text-blue-ink desk:sr-only">{t('transport.tempo')}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="stamp px-2 py-0.5 desk:min-w-7"
              onClick={() => setTempo(Math.max(TEMPO_MIN, tempo - 4))}
              aria-label={t('a11y.tempoDown')}
            >
              −
            </button>
            <span className="ink-block font-mono text-[1.05rem] font-semibold tabular-nums desk:text-[0.9375rem]" aria-live="polite" aria-atomic="true">
              <span className="sr-only">{t('transport.tempo')} </span>
              {tempo}
            </span>
            <button
              type="button"
              className="stamp px-2 py-0.5 desk:min-w-7"
              onClick={() => setTempo(Math.min(TEMPO_MAX, tempo + 4))}
              aria-label={t('a11y.tempoUp')}
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          className="stamp sm:hidden"
          aria-expanded={open}
          aria-controls="transport-rhythm transport-settings"
          onClick={toggleOpen}
          title={t('a11y.transportMore')}
        >
          {t('transport.more')} <span aria-hidden="true">{open ? '▴' : '▾'}</span>
        </button>
        {!open && (
          <span className="readout text-[10px] text-ink-soft sm:hidden" aria-hidden="true">
            {beatsPerChord}/4{loop ? ' · loop' : ''}
            {metronome ? ' · click' : ''}
            {capo > 0 ? ` · capo ${capo}` : ''}
          </span>
        )}

        <div id="transport-rhythm" className={foldable}>
          <div className="flex items-center gap-1" role="group" aria-label={t('a11y.beats')}>
            <span className="label-ink text-blue-ink desk:sr-only">{t('transport.beats')}</span>
            {BEAT_OPTIONS.map((beats) => (
              <button
                key={beats}
                type="button"
                className="stamp px-1.5 py-0.5 desk:min-w-7"
                aria-pressed={beatsPerChord === beats}
                onClick={() => setBeatsPerChord(beats)}
              >
                {beats}
              </button>
            ))}
          </div>

          <button type="button" className="stamp" aria-pressed={loop} onClick={() => setLoop(!loop)}>
            {t('transport.loop')}
          </button>

          <button type="button" className="stamp" aria-pressed={metronome} onClick={() => setMetronome(!metronome)}>
            {t('transport.metronome')}
          </button>
        </div>

        {audioLoading && <span className="chip chip--blue">{t('audio.loading')}</span>}
        {audioFallback && <span className="chip">{t('audio.fallback')}</span>}
        {!audioReady && !audioLoading && (
          <button type="button" className="stamp stamp--live" onClick={() => void enableAudio()}>
            {t('audio.enable')}
          </button>
        )}
      </div>

      <div
        id="transport-settings"
        className={`ml-auto w-full flex-wrap items-center gap-x-4 gap-y-2 sm:flex sm:w-auto desk:min-w-0 desk:flex-nowrap desk:gap-x-2.5 ${open ? 'flex' : 'hidden'}`}
      >
        <div className="flex flex-wrap items-center gap-2 desk:flex-nowrap desk:gap-1">
          <span className="label-ink text-blue-ink desk:sr-only">{t('transport.timbre')}</span>
          <select
            className="stamp min-w-0 max-w-[9rem] flex-1 cursor-pointer appearance-none px-2 py-0.5 sm:flex-none desk:max-w-[7.5rem]"
            value={timbre}
            aria-label={t('transport.timbre')}
            onChange={(event) => setTimbre(event.target.value as TimbreId)}
          >
            {TIMBRES.map((item) => (
              <option key={item.id} value={item.id}>
                {lang === 'es' ? item.nameEs : item.nameEn}
              </option>
            ))}
          </select>
          <span className="label-ink text-blue-ink desk:sr-only">{t('transport.strum')}</span>
          <select
            className="stamp min-w-0 max-w-[11rem] flex-1 cursor-pointer appearance-none px-2 py-0.5 sm:flex-none desk:max-w-[8.5rem]"
            value={strum}
            aria-label={t('transport.strum')}
            onChange={(event) => setStrum(event.target.value as StrumId)}
          >
            {STRUMS.map((item) => (
              <option key={item.id} value={item.id}>
                {lang === 'es' ? item.nameEs : item.nameEn} {item.glyph}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 desk:flex-nowrap desk:gap-1">
          <span className="label-ink text-blue-ink">{t('transport.capo')}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="stamp px-2 py-0.5 desk:min-w-7"
              onClick={() => setCapo(capo - 1)}
              disabled={capo === 0}
              aria-label={t('a11y.capoDown')}
            >
              −
            </button>
            <span className="ink-block font-mono text-[0.9375rem] font-semibold tabular-nums desk:text-[0.8125rem]" aria-live="polite" aria-atomic="true">
              <span className="sr-only">{t('transport.capo')} </span>
              {capo}
            </span>
            <button
              type="button"
              className="stamp px-2 py-0.5 desk:min-w-7"
              onClick={() => setCapo(capo + 1)}
              disabled={capo >= MAX_CAPO}
              aria-label={t('a11y.capoUp')}
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 desk:flex-nowrap desk:gap-1">
          <span className="label-ink text-blue-ink desk:sr-only">{t('transport.key')}</span>
          <select
            className="stamp min-w-0 max-w-[9rem] flex-1 cursor-pointer appearance-none px-2 py-0.5 sm:flex-none desk:max-w-[6.5rem]"
            value={keyRootPc}
            aria-label={t('transport.key')}
            onChange={(event) => setKeyRootPc(Number(event.target.value))}
          >
            {PITCH_SHARP.map((name, index) => (
              <option key={name} value={index}>
                {name} / {LATIN_SHARP[index]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="stamp px-1.5 py-0.5"
            aria-pressed={keyMode === 'minor'}
            onClick={() => setKeyMode(keyMode === 'major' ? 'minor' : 'major')}
            aria-label={t('a11y.mode')}
          >
            {keyMode === 'major' ? t('theory.mode.major') : t('theory.mode.minor')}
          </button>
          <button
            type="button"
            className="stamp px-1.5 py-0.5"
            aria-pressed={keyAuto}
            onClick={() => setKeyAuto(!keyAuto)}
            aria-label={t('a11y.keyAuto')}
            title={t('a11y.keyAuto')}
          >
            {t('key.auto')}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1 desk:flex-nowrap" role="group" aria-label={t('transport.notation')}>
          <span className="label-ink text-blue-ink desk:sr-only">{t('transport.notation')}</span>
          {NOTATIONS.map((item) => (
            <button
              key={item}
              type="button"
              className="stamp px-1.5 py-0.5"
              aria-pressed={notation === item}
              onClick={() => setNotation(item)}
            >
              {t(`notation.${item}` as const)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 desk:flex-nowrap desk:gap-1">
          <span className="label-ink text-blue-ink desk:sr-only">{t('transport.volume')}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="w-20 desk:h-7 desk:w-16 desk:cursor-pointer"
            aria-label={t('transport.volume')}
          />
        </div>

        <button
          type="button"
          className="stamp px-1.5 py-0.5"
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
          aria-label={t('transport.lang')}
        >
          {lang === 'es' ? 'ES' : 'EN'}
        </button>
      </div>
    </header>
  )
}

function BeatDots() {
  const activeBeat = usePlayheadBeat()
  if (activeBeat < 0) return null
  return (
    <span className="flex items-center gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3].map((beat) => (
        <span
          key={beat}
          className={`h-[6px] w-[6px] rounded-full ${
            activeBeat % 4 === beat ? (beat === 0 ? 'bg-ink' : 'bg-ink-soft') : 'bg-rule'
          }`}
        />
      ))}
    </span>
  )
}
