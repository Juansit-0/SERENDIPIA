import { useRef, useState } from 'react'
import { BACKING_STYLES, type BackingStyle } from '../audio/backing'
import { patternGlyph, STRUMS, type StrumId } from '../audio/strums'
import { TIMBRES, type TimbreId } from '../audio/types'
import { MAX_CAPO } from '../music/capo'
import { LATIN_SHARP, PITCH_SHARP } from '../music/notes'
import { BEAT_OPTIONS, TEMPO_MAX, TEMPO_MIN } from '../state/settings'
import { useStore, type Notation, type ViewId } from '../state/store'
import { useTheme } from '../state/theme'
import { openWelcome } from '../welcome/state'
import { tunerText } from '../i18n/tuner'
import { Tuner } from './topbar/Tuner'
import { topbarText } from '../i18n/topbar'
import '../styles/topbar.css'
import { BeatMoons } from './topbar/BeatMoons'
import { BrandMark } from './topbar/Brand'
import { Popover } from './topbar/Popover'
import { ChevronDownIcon, LoopIcon, MinusIcon, MoonIcon, PlayIcon, PlusIcon, SettingsIcon, SoundIcon, StopIcon, SunIcon, TunerIcon } from './icons'

const VIEWS: ViewId[] = ['chord', 'theory', 'practice']
const NOTATIONS: Notation[] = ['anglo', 'both', 'latin']
const OPEN_KEY = 'serendipia.transportOpen'

// Per-viewer convenience only: whether the phone layout shows every control.
function readOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) === '1'
  } catch {
    return false
  }
}

export function TopBar() {
  // Below `sm` the bar folds to: brand, Run, tempo and «Más». From `sm` up it is always open.
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
  const themeButton = useRef<HTMLButtonElement>(null)
  const { theme, preference, toggle, setPreference } = useTheme()
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
    customStrum,
    setCustomStrum,
    previewStrum,
    backing,
    setBacking,
    subdivision,
    setSubdivision,
    tapTempo,
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
  const x = topbarText[lang]

  const rootName = notation === 'latin' ? LATIN_SHARP[keyRootPc] : PITCH_SHARP[keyRootPc]
  const modeName = (keyMode === 'major' ? t('theory.mode.major') : t('theory.mode.minor')).toLowerCase()
  const keyLabel = `${rootName} ${modeName}`
  const audioState = audioLoading ? 'loading' : audioReady ? 'ready' : 'idle'
  const audioText = audioLoading ? t('audio.loading') : audioFallback ? t('audio.fallback') : audioReady ? x.statusReady : x.statusIdle

  return (
    <header className="cc-top">
      <div className="cc-top__inner">
        <h1 className="cc-brand">
          <BrandMark theme={theme} />
          <span className="cc-brand__word max-sm:sr-only">{x.brand}</span>
        </h1>

        <nav className="flex gap-1 max-sm:order-2 max-sm:w-full max-sm:min-w-0" aria-label={t('a11y.views')}>
          {VIEWS.map((item) => (
            <button
              key={item}
              type="button"
              className="cc-btn cc-btn--ghost max-sm:min-w-0 max-sm:flex-1 max-sm:px-2"
              aria-current={view === item ? 'page' : undefined}
              onClick={() => setView(item)}
            >
              {t(`tabs.${item}` as const)}
            </button>
          ))}
        </nav>

        <span className="cc-top__sep max-sm:hidden" aria-hidden="true" />

        <button
          type="button"
          className="cc-btn cc-btn--primary min-w-[6.25rem] justify-center"
          onClick={togglePlay}
          disabled={progression.length === 0 && !metronome}
        >
          {playing ? <StopIcon size={16} /> : <PlayIcon size={16} />}
          {playing ? t('transport.stop') : t('transport.run')}
        </button>

        <span className="max-sm:hidden desk:max-[1199px]:hidden">
          <BeatMoons label={x.beatIndicator} />
        </span>

        <div className="cc-stepper max-sm:ml-auto" role="group" aria-label={t('transport.tempo')}>
          <button
            type="button"
            className="cc-btn"
            onClick={() => setTempo(Math.max(TEMPO_MIN, tempo - 4))}
            aria-label={t('a11y.tempoDown')}
          >
            <MinusIcon size={14} />
          </button>
          <span className="cc-stepper__val cc-num" aria-live="polite" aria-atomic="true">
            <span className="sr-only">{t('transport.tempo')} </span>
            {tempo}
            <span className="cc-stepper__unit" aria-hidden="true">
              {x.bpm}
            </span>
          </span>
          <button
            type="button"
            className="cc-btn"
            onClick={() => setTempo(Math.min(TEMPO_MAX, tempo + 4))}
            aria-label={t('a11y.tempoUp')}
          >
            <PlusIcon size={14} />
          </button>
        </div>

        <button
          type="button"
          className="cc-btn sm:hidden"
          aria-expanded={open}
          aria-controls="topbar-more"
          onClick={toggleOpen}
          title={x.moreLabel}
        >
          {x.more}
          <ChevronDownIcon size={14} style={{ transform: open ? 'rotate(180deg)' : undefined }} />
        </button>

        <div id="topbar-more" className={`${foldable} max-sm:[&>*]:order-3`}>
          <span className="cc-top__sep" aria-hidden="true" />

          <div className="cc-stepper" role="group" aria-label={t('transport.capo')}>
            <span className="cc-stepper__unit pl-2.5 pr-1 uppercase" aria-hidden="true">
              {t('transport.capo')}
            </span>
            <button type="button" className="cc-btn" onClick={() => setCapo(capo - 1)} disabled={capo === 0} aria-label={t('a11y.capoDown')}>
              <MinusIcon size={14} />
            </button>
            <span className="cc-stepper__val cc-num !min-w-[1.6rem]" aria-live="polite" aria-atomic="true">
              <span className="sr-only">{t('transport.capo')} </span>
              {capo}
            </span>
            <button
              type="button"
              className="cc-btn"
              onClick={() => setCapo(capo + 1)}
              disabled={capo >= MAX_CAPO}
              aria-label={t('a11y.capoUp')}
            >
              <PlusIcon size={14} />
            </button>
          </div>

          <Popover
            label={t('transport.key')}
            triggerLabel={`${t('transport.key')}: ${keyLabel}`}
            align="start"
            trigger={
              <>
                <span>{keyLabel}</span>
                <ChevronDownIcon size={14} />
              </>
            }
          >
            {({ close }) => (
              <div className="w-[17rem]">
                <div className="cc-pop__row">
                  <span className="cc-label cc-pop__title">{x.keyRoot}</span>
                  <div className="cc-keygrid" role="group" aria-label={x.keyRoot}>
                    {PITCH_SHARP.map((name, index) => (
                      <button
                        key={name}
                        type="button"
                        className="cc-btn"
                        aria-pressed={keyRootPc === index}
                        aria-label={`${name} / ${LATIN_SHARP[index]}`}
                        onClick={() => {
                          setKeyRootPc(index)
                          close()
                        }}
                      >
                        <span aria-hidden="true">{name}</span>
                        <small aria-hidden="true">{LATIN_SHARP[index]}</small>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="cc-pop__row flex flex-wrap items-center gap-2">
                  <div className="cc-seg" role="group" aria-label={t('a11y.mode')}>
                    <button type="button" aria-pressed={keyMode === 'major'} onClick={() => setKeyMode('major')}>
                      {t('theory.mode.major')}
                    </button>
                    <button type="button" aria-pressed={keyMode === 'minor'} onClick={() => setKeyMode('minor')}>
                      {t('theory.mode.minor')}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="cc-btn"
                    aria-pressed={keyAuto}
                    aria-label={t('a11y.keyAuto')}
                    title={keyAuto ? x.keyAutoOn : x.keyAutoOff}
                    onClick={() => setKeyAuto(!keyAuto)}
                  >
                    {t('key.auto')}
                  </button>
                </div>
              </div>
            )}
          </Popover>

          <span className="cc-top__sep max-sm:hidden" aria-hidden="true" />
          <span className="max-sm:hidden desk:ml-auto" aria-hidden="true" />

          <Popover
            label={x.play}
            trigger={
              <>
                <LoopIcon size={15} />
                <span className="cc-btn__label--wide">{x.play}</span>
                <ChevronDownIcon size={14} />
              </>
            }
          >
            {() => (
              <div className="w-[17rem]">
                <div className="cc-pop__row">
                  <span className="cc-label cc-pop__title">{t('transport.beats')}</span>
                  <div className="cc-seg" role="group" aria-label={t('a11y.beats')}>
                    {BEAT_OPTIONS.map((beats) => (
                      <button key={beats} type="button" aria-pressed={beatsPerChord === beats} onClick={() => setBeatsPerChord(beats)}>
                        {beats}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="cc-pop__row flex flex-wrap gap-2">
                  <button type="button" className="cc-btn" aria-pressed={loop} onClick={() => setLoop(!loop)}>
                    {t('transport.loop')}
                  </button>
                  <button type="button" className="cc-btn" aria-pressed={metronome} onClick={() => setMetronome(!metronome)}>
                    {t('transport.metronome')}
                  </button>
                </div>
                <div className="cc-pop__row">
                  <label className="cc-label cc-pop__title" htmlFor="topbar-strum">
                    {t('transport.strum')}
                  </label>
                  <select
                    id="topbar-strum"
                    className="cc-select"
                    value={strum}
                    onChange={(event) => setStrum(event.target.value as StrumId)}
                  >
                    {STRUMS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {lang === 'es' ? item.nameEs : item.nameEn} {item.id === 'custom' ? patternGlyph(customStrum) : item.glyph}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cc-pop__row">
                  <span className="cc-label cc-pop__title">{x.tap}</span>
                  <button type="button" className="cc-btn cc-tap" title={x.tapHint} onClick={() => tapTempo()}>
                    {x.tapButton} · <span className="cc-num">{tempo}</span> bpm
                  </button>
                </div>
                {metronome && (
                  <div className="cc-pop__row">
                    <span className="cc-label cc-pop__title">{x.subdivision}</span>
                    <div className="cc-seg" role="group" aria-label={x.subdivision}>
                      {([1, 2, 3] as const).map((value) => (
                        <button key={value} type="button" aria-pressed={subdivision === value} onClick={() => setSubdivision(value)}>
                          {x.subdivisions[value - 1]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="cc-pop__row">
                  <label className="cc-label cc-pop__title" htmlFor="topbar-backing" title={x.backingHint}>
                    {x.backing}
                  </label>
                  <select id="topbar-backing" className="cc-select" value={backing} title={x.backingHint} onChange={(event) => setBacking(event.target.value as BackingStyle)}>
                    {BACKING_STYLES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {lang === 'es' ? item.nameEs : item.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                {strum === 'custom' && (
                  <div className="cc-pop__row">
                    <span className="cc-label cc-pop__title">{x.pattern}</span>
                    <div className="cc-pattern" role="group" aria-label={x.pattern} title={x.patternHint}>
                      {[...customStrum].map((slot, index) => {
                        const count = index % 2 === 0 ? String(index / 2 + 1) : lang === 'es' ? 'y' : '&'
                        return (
                          <button
                            key={index}
                            type="button"
                            className="cc-pattern__slot"
                            data-slot={slot}
                            aria-label={x.patternSlot(count, x.patternStates[slot])}
                            onClick={() => {
                              const next = slot === '.' ? 'D' : slot === 'D' ? 'U' : '.'
                              setCustomStrum(customStrum.slice(0, index) + next + customStrum.slice(index + 1))
                            }}
                          >
                            <span className="cc-pattern__stroke" aria-hidden="true">
                              {slot === 'D' ? '↓' : slot === 'U' ? '↑' : '·'}
                            </span>
                            <small aria-hidden="true">{count}</small>
                          </button>
                        )
                      })}
                    </div>
                    <div className="cc-pattern__foot">
                      <span className="cc-pattern__hint">{x.patternHint}</span>
                      <button type="button" className="cc-btn" onClick={() => previewStrum('custom')}>
                        {x.patternTry}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Popover>

          <Popover
            label={x.sound}
            trigger={
              <>
                <SoundIcon size={15} />
                <span className="cc-btn__label--wide">{x.sound}</span>
                <span className="cc-statusdot" data-state={audioState} aria-hidden="true" />
                <ChevronDownIcon size={14} />
              </>
            }
          >
            {() => (
              <div className="w-[17rem]">
                <div className="cc-pop__row">
                  <label className="cc-label cc-pop__title" htmlFor="topbar-timbre">
                    {t('transport.timbre')}
                  </label>
                  <select
                    id="topbar-timbre"
                    className="cc-select"
                    value={timbre}
                    onChange={(event) => setTimbre(event.target.value as TimbreId)}
                  >
                    {TIMBRES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {lang === 'es' ? item.nameEs : item.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cc-pop__row">
                  <label className="cc-label cc-pop__title" htmlFor="topbar-volume">
                    {t('transport.volume')}
                  </label>
                  <input
                    id="topbar-volume"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                    className="h-8 w-full cursor-pointer accent-[var(--cc-accent-deep)]"
                  />
                </div>
                <div className="cc-pop__row flex flex-wrap items-center gap-2">
                  <span className="cc-chip" role="status" aria-label={x.status}>
                    <span className="cc-statusdot" data-state={audioState} aria-hidden="true" />
                    {audioText}
                  </span>
                  {!audioReady && !audioLoading && (
                    <button type="button" className="cc-btn cc-btn--primary" onClick={() => void enableAudio()}>
                      {t('audio.enable')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </Popover>

          <Popover
            label={tunerText[lang].title}
            trigger={
              <>
                <TunerIcon size={15} />
                <span className="cc-btn__label--wide">{tunerText[lang].title}</span>
              </>
            }
          >
            {() => <Tuner />}
          </Popover>

          <Popover
            label={x.settings}
            triggerClassName="cc-btn--icon"
            trigger={<SettingsIcon size={16} />}
          >
            {({ close }) => (
              <div className="w-[16rem]">
                <div className="cc-pop__row">
                  <span className="cc-label cc-pop__title">{x.theme}</span>
                  <div className="cc-seg" role="group" aria-label={x.theme}>
                    {(
                      [
                        ['auto', x.themeAuto],
                        ['day', x.themeDay],
                        ['night', x.themeNight],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={preference === value}
                        title={value === 'auto' ? x.themeAutoHint : undefined}
                        onClick={(event) => setPreference(value, event.currentTarget)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="cc-pop__row">
                  <span className="cc-label cc-pop__title">{t('transport.notation')}</span>
                  <div className="cc-seg" role="group" aria-label={t('transport.notation')}>
                    {NOTATIONS.map((item) => (
                      <button key={item} type="button" aria-pressed={notation === item} onClick={() => setNotation(item)}>
                        {t(`notation.${item}` as const)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="cc-pop__row">
                  <span className="cc-label cc-pop__title">{t('transport.lang')}</span>
                  <div className="cc-seg" role="group" aria-label={t('transport.lang')}>
                    <button type="button" aria-pressed={lang === 'es'} onClick={() => setLang('es')}>
                      ES
                    </button>
                    <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
                      EN
                    </button>
                  </div>
                </div>
                <div className="cc-pop__row">
                  <button
                    type="button"
                    className="cc-btn cc-btn--ghost w-full"
                    onClick={() => {
                      close()
                      openWelcome()
                    }}
                  >
                    {x.welcomeAgain}
                  </button>
                </div>
                <div className="cc-pop__row">
                  <span className="cc-label cc-pop__title">{x.shortcuts}</span>
                  <dl className="cc-shortcuts">
                    {x.shortcutsList.map(([keys, action]) => (
                      <div key={keys}>
                        <dt>
                          <kbd>{keys}</kbd>
                        </dt>
                        <dd>{action}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="cc-pop__row cc-credits">
                  <span className="cc-label cc-pop__title">{x.credits}</span>
                  <p>
                    {x.creditsSounds}{' '}
                    <a href="https://github.com/gleitz/midi-js-soundfonts" target="_blank" rel="noopener noreferrer">
                      gleitz/midi-js-soundfonts
                    </a>
                    ,{' '}
                    <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">
                      {x.creditsSoundsLicense}
                    </a>
                    .
                  </p>
                  <p>{x.creditsFonts}</p>
                  <p>{x.creditsCode}</p>
                </div>
              </div>
            )}
          </Popover>

          <button
            ref={themeButton}
            type="button"
            className="cc-btn cc-btn--icon"
            aria-label={theme === 'night' ? x.toDay : x.toNight}
            aria-pressed={theme === 'day'}
            onClick={() => toggle(themeButton.current)}
          >
            <span key={theme} className="cc-theme-icon">
              {theme === 'night' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
