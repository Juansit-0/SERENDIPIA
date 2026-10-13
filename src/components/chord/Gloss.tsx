import { chordText } from '../../i18n/chord'
import { useTheme } from '../../state/theme'
import { useStore } from '../../state/store'

const PHASES = [
  null,
  'M0,-9 A9,9 0 0 1 0,9 A5,9 0 0 0 0,-9Z',
  'M0,-9 A9,9 0 0 1 0,9Z',
  'M0,-9 A9,9 0 0 1 0,9 A5,9 0 0 1 0,-9Z',
  'M0,-9 A9,9 0 1 1 0,9 A9,9 0 1 1 0,-9Z',
  null,
]
const SUN = [180, 135, 90, 45, 0, -45]

/** Decoration: a static column of moon (night) or sun (day) phases. */
export function PhaseColumn() {
  const { theme } = useTheme()
  const current = 2 // quiet ornament: the top bar owns the beat indicator
  return (
    <div className="cc-module cv-phases" aria-hidden="true" data-current={current}>
      {PHASES.map((path, index) => {
        const rad = (SUN[index] * Math.PI) / 180
        return (
          <svg
            key={index}
            className={`cv-phase ${current === index ? 'is-now' : ''}`}
            viewBox="-13 -13 26 26"
            focusable="false"
          >
            <circle r="12" className="cv-phase-ring" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle r="9" fill="none" stroke="currentColor" strokeWidth="1.3" />
            {theme === 'night' ? (
              path && <path d={path} fill="currentColor" />
            ) : (
              <>
                <path d="M-9,0H9" stroke="currentColor" strokeWidth="1" strokeOpacity=".6" />
                <circle
                  cx={(9 * Math.cos(rad)).toFixed(2)}
                  cy={(-9 * Math.sin(rad)).toFixed(2)}
                  r="3.4"
                  fill="var(--cc-fn-sub-fill)"
                  stroke="currentColor"
                  strokeWidth="1.1"
                />
              </>
            )}
          </svg>
        )
      })}
    </div>
  )
}

const STAR = 'M0,-9 Q1.35,-1.35 9,0 Q1.35,1.35 0,9 Q-1.35,1.35 -9,0 Q-1.35,-1.35 0,-9Z'

/** «Hallazgo» dictionary entry. */
export function GlossFind() {
  const { lang } = useStore()
  const { theme } = useTheme()
  const c = chordText[lang]
  return (
    <section className="cc-module cv-gloss cv-gloss--find" aria-label={c.glossWord}>
      <svg className="cv-gloss-star cc-twinkle" viewBox="-10 -10 20 20" aria-hidden="true" focusable="false">
        <path d={STAR} fill="var(--cc-accent)" />
      </svg>
      <p className="cv-gloss-word">{c.glossWord}</p>
      <p className="cc-gloss cv-gloss-phon">{c.glossPhon}</p>
      <p className="cv-gloss-tag">{(theme === 'night' ? c.kickerNight : c.kickerDay).replace('\n', ' ')}</p>
      <p className="cc-gloss cv-gloss-def">{c.glossDef}</p>
    </section>
  )
}

/** «Pulso» (night) / «Luz» (day) entry with the tempo. */
export function GlossPulse() {
  const { lang, tempo } = useStore()
  const { theme } = useTheme()
  const c = chordText[lang]
  const night = theme === 'night'
  return (
    <section className="cc-module cv-gloss cv-gloss--pulse" aria-label={night ? c.pulseNight : c.pulseDay}>
      <p className="cv-gloss-word">{night ? c.pulseNight : c.pulseDay}</p>
      <p className="cc-gloss cv-gloss-phon">{night ? c.pulsePhonNight : c.pulsePhonDay}</p>
      <p className="cv-gloss-tempo cc-num">
        <span>{tempo} bpm</span>
        <span>4/4</span>
      </p>
    </section>
  )
}
