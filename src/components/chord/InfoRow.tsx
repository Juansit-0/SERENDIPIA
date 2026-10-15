import { useCallback, useEffect, useRef } from 'react'
import { useChordListener } from '../../audio/useChordListener'
import { chordText } from '../../i18n/chord'
import { hearText } from '../../i18n/hear'
import { shapeChord } from '../../music/capo'
import type { DetectionCandidate } from '../../music/detectChord'
import { parseChord } from '../../music/parseChord'
import { useStore } from '../../state/store'
import { MicIcon } from '../icons'
import type { ChordModel } from './useChordModel'

const GLYPHS = [
  <path key="a" d="M-5,0H-1M-3,-2V2M1,0H5M3,-2V2" />,
  <path key="b" d="M-6,0H6M0,-6V6" />,
  <circle key="c" r="4" />,
  <path key="d" d="M0,-6 Q1,-1 6,0 Q1,1 0,6 Q-1,1 -6,0 Q-1,-1 0,-6Z" />,
  <path key="e" d="M0,-6 L6,0 L0,6 L-6,0Z" />,
]

/** Second row of the collage: the chord input, "suena" with the capo, the likely key, a glyph row. */
export function InfoRow({ m, onListen }: { m: ChordModel; onListen: () => void }) {
  const { lang, t, chord, chordInput, setChordInput, chordError, setChordInputFocused, capo, notation, keyTop, keyDiffers } = m
  const c = chordText[lang]
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Autofocus only with a precise pointer: on phones it would pop the keyboard on load.
  useEffect(() => {
    if (window.matchMedia?.('(pointer: fine)').matches) inputRef.current?.focus()
  }, [])
  // The input never keeps the "typing" flag if it unmounts while focused.
  useEffect(() => () => setChordInputFocused(false), [setChordInputFocused])

  const soundingName = notation === 'latin' ? m.sounding.latin : m.sounding.anglo
  const qualityName = lang === 'es' ? chord.quality.nameEs : chord.quality.nameEn

  // «Oír»: the microphone names the chord being strummed and the view follows it (as a shape under the capo).
  const { setChord, addToProgression } = useStore()
  const h = hearText[lang]
  const shapeOf = useCallback(
    (candidate: DetectionCandidate) => {
      const parsed = parseChord(candidate.anglo)
      return parsed ? shapeChord(parsed, capo) : null
    },
    [capo],
  )
  const follow = useCallback(
    (candidate: DetectionCandidate) => {
      const shape = shapeOf(candidate)
      if (shape) setChord(shape)
    },
    [shapeOf, setChord],
  )
  const ear = useChordListener(follow)
  const listening = ear.status === 'listening' || ear.status === 'starting'
  const earMessage =
    ear.status === 'denied' ? h.denied : ear.status === 'unsupported' ? h.unsupported : ear.status === 'error' ? h.error : null

  return (
    <div className="cv-info">
      <div className={`cc-module cv-input-mod ${chordError ? 'is-error' : ''}`}>
        <label className="cc-label" htmlFor="chord-input">
          {t('chord.input.label')}
        </label>
        <input
          id="chord-input"
          ref={inputRef}
          className="cv-input"
          aria-invalid={chordError}
          aria-describedby={chordError ? 'chord-input-error' : undefined}
          value={chordInput}
          onChange={(event) => setChordInput(event.target.value)}
          onFocus={() => setChordInputFocused(true)}
          onBlur={() => setChordInputFocused(false)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !chordError && chordInput.trim()) {
              event.preventDefault()
              onListen()
            }
          }}
          placeholder={t('chord.input.placeholder')}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          enterKeyHint="go"
        />
        <button
          type="button"
          className={`cc-btn cc-btn--icon cv-ear ${listening ? 'is-on' : ''}`}
          aria-pressed={listening}
          aria-label={listening ? h.stop : h.start}
          title={listening ? h.stop : h.start}
          onClick={() => (listening ? ear.stop() : void ear.start())}
        >
          <MicIcon size={18} />
        </button>
      </div>

      {listening || earMessage ? (
        <div className="cc-module cv-context cv-hearing" aria-live="polite">
          {earMessage ? (
            <p className="cv-error">{earMessage}</p>
          ) : ear.status === 'starting' ? (
            <p>{h.starting}</p>
          ) : ear.heard ? (
            <>
              <span className="cv-hear-dot" aria-hidden="true" />
              <p className="cv-hear-name">
                {h.heard}{' '}
                <b key={ear.heard.candidate.anglo}>{notation === 'latin' ? ear.heard.candidate.latin : ear.heard.candidate.anglo}</b>
                {ear.heard.alternatives.length > 0 && (
                  <span className="cv-hear-alt">
                    {' '}
                    {h.alsoMaybe}{' '}
                    {ear.heard.alternatives
                      .slice(0, 2)
                      .map((item) => (notation === 'latin' ? item.latin : item.anglo))
                      .join(', ')}
                  </span>
                )}
              </p>
              <span className="cv-hear-meter" role="img" aria-label={`${Math.round(ear.heard.confidence * 100)}% ${h.sure}`}>
                <i style={{ width: `${Math.round(ear.heard.confidence * 100)}%` }} />
              </span>
              <button
                type="button"
                className="cc-btn cv-use"
                aria-label={h.addLabel}
                title={h.addLabel}
                onClick={() => {
                  const shape = ear.heard && shapeOf(ear.heard.candidate)
                  if (!shape) return
                  addToProgression({
                    rootPc: shape.rootPc,
                    qualityId: shape.quality.id,
                    anglo: shape.anglo,
                    latin: shape.latin,
                    bassPc: shape.bassPc,
                    voicingSource: 'auto',
                  })
                }}
              >
                + {h.add}
              </button>
            </>
          ) : (
            <>
              <span className="cv-hear-dot is-waiting" aria-hidden="true" />
              <p>
                {h.waiting} <span className="cv-hear-alt">{h.follow}</span>
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="cc-module cv-context">
          {chordError ? (
            <p id="chord-input-error" className="cv-error" role="alert">
              {t('chord.invalid')}
            </p>
          ) : capo > 0 ? (
            <p>
              {c.capoSounds} <b className="cc-num">{capo}</b> {c.capoSoundsVerb} <b className="cv-sounds">{soundingName}</b>
            </p>
          ) : (
            <p>
              <span className="cv-quality-k">{c.quality}</span> {qualityName}
            </p>
          )}
          {!chordError && m.alternatives.length > 0 && (
            <div className="cv-alts" role="group" aria-label={c.alsoMaybe}>
              <span className="cc-label">{c.alsoMaybe}:</span>
              {m.alternatives.slice(0, 4).map((candidate) => (
                <button key={candidate.anglo} type="button" className="cc-btn cv-alt" onClick={() => m.pickDetectedName(candidate.anglo)}>
                  {notation === 'latin' ? candidate.latin : candidate.anglo}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {keyTop && keyDiffers && (
        <div className="cc-module cv-keymod">
          <span className="cc-chip cv-keychip">
            {c.keyProbable}:{' '}
            <b>
              {notation === 'latin' ? keyTop.keyLatin : keyTop.keyAnglo}{' '}
              {(keyTop.mode === 'major' ? t('theory.mode.major') : t('theory.mode.minor')).toLowerCase()}
            </b>
          </span>
          {keyDiffers && (
            <button
              type="button"
              className="cc-btn cv-use"
              onClick={() => {
                m.setKeyRootPc(keyTop.rootPc)
                m.setKeyMode(keyTop.mode)
              }}
              aria-label={`${c.keyUseLabel}: ${notation === 'latin' ? keyTop.keyLatin : keyTop.keyAnglo} ${
                keyTop.mode === 'major' ? t('theory.mode.major') : t('theory.mode.minor')
              }`}
            >
              {c.keyUse}
            </button>
          )}
        </div>
      )}

      <div className="cc-module cv-glyphs" aria-hidden="true">
        <span className="cc-hatch" />
        <span className="cv-glyph-row">
          {GLYPHS.map((glyph, index) => (
            <svg key={index} viewBox="-8 -8 16 16" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.1">
              {glyph}
            </svg>
          ))}
        </span>
      </div>
    </div>
  )
}
