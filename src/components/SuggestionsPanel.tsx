import { chordText } from '../i18n/chord'
import { parseChord } from '../music/parseChord'
import { useStore } from '../state/store'
import { FN_VAR, suggestionFunction } from './chord/suggestFn'
import '../styles/chord.css'

/** "Puede seguir": next-chord ideas after the progression's last chords, or after the selected chord. */
export function SuggestionsPanel() {
  const {
    panelSuggestions,
    panelFollowsProgression,
    suggestFrom,
    setSuggestFrom,
    progression,
    chord,
    setChord,
    addSuggestion,
    keyRootPc,
    keyMode,
    notation,
    lang,
    t,
  } = useStore()
  const c = chordText[lang]

  const name = (item: { anglo: string; latin: string }) => (notation === 'latin' ? item.latin : item.anglo)
  const context = panelFollowsProgression ? progression.slice(-3).map(name).join(' → ') : name(chord)
  const isCurrent = (rootPc: number, qualityId: string) =>
    chord.bassPc === null && chord.rootPc === rootPc && chord.quality.id === qualityId

  return (
    <section className="cv-sugp">
      <div className="cv-sugp-head">
        <h2 className="cc-label">{t('suggestions.title')}</h2>
        {progression.length > 0 && (
          <div className="cc-seg" role="group" aria-label={t('a11y.suggestFrom')}>
            {(['progression', 'chord'] as const).map((from) => (
              <button
                key={from}
                type="button"
                aria-pressed={suggestFrom === from}
                onClick={() => setSuggestFrom(from)}
              >
                {t(from === 'progression' ? 'suggestions.fromProgression' : 'suggestions.fromChord')}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="cv-sugp-ctx" aria-live="polite">
        {t('suggestions.after')} <span>{context}</span>
      </p>

      {panelSuggestions.length === 0 && <p className="cv-sugp-ctx">{t('suggestions.empty')}</p>}
      <ul className="cv-sugp-list">
        {panelSuggestions.map((suggestion) => {
          const current = isCurrent(suggestion.rootPc, suggestion.qualityId)
          const fn = suggestionFunction(suggestion, keyRootPc, keyMode)
          return (
            <li className="cv-sugp-row" key={suggestion.anglo}>
              <button
                type="button"
                aria-pressed={current}
                className="cv-sugp-idea"
                style={{ '--fn': FN_VAR[fn] } as React.CSSProperties}
                onClick={() => {
                  const parsed = parseChord(suggestion.anglo)
                  if (parsed) setChord(parsed)
                }}
              >
                <span className="cv-sugp-name">
                  <i className="cv-fn-dot" aria-hidden="true" />
                  {suggestion.roman ? `${suggestion.roman} · ` : ''}
                  {name(suggestion)}
                  <span className="cv-sugp-fn">{c.fn[fn]}</span>
                </span>
                <span className="cv-sugp-reason">{lang === 'es' ? suggestion.reasonEs : suggestion.reasonEn}</span>
              </button>
              <button
                type="button"
                className="cc-btn cc-btn--icon cv-sugp-add"
                onClick={() => addSuggestion(suggestion)}
                aria-label={`${t('progression.add')}: ${name(suggestion)}`}
                title={t('progression.add')}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
