import { useRef, type CSSProperties } from 'react'
import { chordText } from '../../i18n/chord'
import { HeroOrbit } from './HeroOrbit'
import type { ChordModel } from './useChordModel'

/** The hero module: kicker, the chord name set huge inside a thin orbit, and the other spelling on its own line. */
export function Hero({ m }: { m: ChordModel }) {
  const c = chordText[m.lang]
  const showName = !m.noChord
  const name = m.heroName
  const stale = m.chordError && m.chartSource === 'voicing'
  const message = m.unrecognized ? c.unrecognized : c.empty
  const box = useRef<HTMLElement>(null)

  return (
    <section ref={box} className="cc-module cv-hero" aria-label={c.chordLabel}>
      <HeroOrbit box={box} name={showName ? name : ''} />
      <div className={`cv-name-wrap ${stale ? 'is-stale' : ''}`}>
        {showName ? (
          <p
            className="cc-hero cv-name"
            aria-live="polite"
            style={{ '--chars': Math.max(3, name.length), '--hero-max': 'var(--cv-hero-max)' } as CSSProperties}
          >
            {/* Keyed so each new name plays its arrival; the live region itself stays put for screen readers. */}
            <span key={name} className="cv-name-text">
              {name}
            </span>
          </p>
        ) : (
          <p className="cv-name-msg" role="status">
            {message}
          </p>
        )}
      </div>
      {showName && (
        <div className="cv-latin">
          <p className="cv-latin-name" lang={m.notation === 'latin' ? 'en' : 'es'}>
            <span key={m.otherName} className="cv-name-text">
              {m.otherName}
            </span>
          </p>
        </div>
      )}
    </section>
  )
}
