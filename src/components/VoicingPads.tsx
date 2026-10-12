import { useStore } from '../state/store'
import { chordText } from '../i18n/chord'
import { MiniPlate } from './MiniPlate'
import { Mesh } from './chord/Mesh'
import { voicingTitle } from './chord/voicingTitle'
import '../styles/chord.css'

/** The positions column: every voicing as a mini diagram, the active one filled; a × clears a marked one. */
export function VoicingPads({ activeIndex }: { activeIndex?: number }) {
  const { voicings, selectedVoicing, selectVoicing, markedVoicing, setMarkedVoicing, lang } = useStore()
  const c = chordText[lang]
  const active = activeIndex ?? selectedVoicing

  return (
    <section className="cc-module cv-pos" aria-label={c.positions}>
      <Mesh />
      <h2 className="cc-label cv-pos-head">{c.positions}</h2>
      {voicings.length === 0 ? (
        <p className="cv-pos-empty">{c.positionsEmpty}</p>
      ) : (
        <ul className="cv-pos-list">
          {voicings.map((voicing, index) => {
            const isMarked = voicing.source === 'marked'
            const selected = index === active
            const label = voicingTitle(voicing, c)
            return (
              <li key={voicing.signature} className="cv-pos-item">
                <button
                  type="button"
                  className="cv-pos-btn"
                  aria-pressed={selected}
                  onClick={() => selectVoicing(index)}
                >
                  <MiniPlate frets={voicing.frets} className="cv-pos-plate" />
                  <span className="cv-pos-text">
                    <span className="cv-pos-label">{label}</span>
                    <span className="cv-pos-meta">{c[voicing.difficulty]}</span>
                    <span className="cv-pos-frets cc-num">{voicing.frets.map((fret) => (fret === null ? 'x' : fret)).join(' ')}</span>
                  </span>
                </button>
                {isMarked && markedVoicing && (
                  <button
                    type="button"
                    className="cc-btn cc-btn--icon cv-pos-clear"
                    onClick={() => {
                      setMarkedVoicing(null)
                      selectVoicing(0, false)
                    }}
                    aria-label={c.clearMark}
                    title={c.clearMark}
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
