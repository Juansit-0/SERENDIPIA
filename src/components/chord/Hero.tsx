import type { CSSProperties } from 'react'
import { chordText } from '../../i18n/chord'
import { useTheme } from '../../state/theme'
import type { ChordModel } from './useChordModel'

/** The hero module: kicker, the chord name set huge inside a thin orbit, and the other spelling on its own line. */
export function Hero({ m }: { m: ChordModel }) {
  const { theme } = useTheme()
  const c = chordText[m.lang]
  const kicker = (theme === 'night' ? c.kickerNight : c.kickerDay).split('\n')
  const showName = !m.noChord
  const name = m.heroName
  const stale = m.chordError && m.chartSource === 'voicing'
  const message = m.unrecognized ? c.unrecognized : c.empty
  const otherLabel = m.notation === 'latin' ? c.angloName : c.latinName

  return (
    <section className="cc-module cv-hero" aria-label={c.chordLabel}>
      <div className="cv-orbit-clip" aria-hidden="true">
        <svg className="cv-orbit" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
          <ellipse cx="50" cy="64" rx="49" ry="23" className="cv-orbit-a" vectorEffect="non-scaling-stroke" />
          <ellipse cx="50" cy="64" rx="46" ry="17" className="cv-orbit-b" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <p className="cv-kicker">
        {kicker.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      <div className={`cv-name-wrap ${stale ? 'is-stale' : ''}`}>
        {showName ? (
          <p
            className="cc-hero cv-name"
            aria-live="polite"
            style={{ '--chars': Math.max(3, name.length), '--hero-max': 'var(--cv-hero-max)' } as CSSProperties}
          >
            {name}
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
            {m.otherName}
          </p>
          <span className="cc-label cv-latin-label">{otherLabel}</span>
        </div>
      )}
      <span className="cc-hatch cv-hero-hatch" aria-hidden="true" />
    </section>
  )
}
