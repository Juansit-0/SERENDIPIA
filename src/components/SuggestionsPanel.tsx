import { parseChord } from '../music/parseChord'
import { useStore } from '../state/store'

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
    notation,
    lang,
    t,
  } = useStore()

  const name = (item: { anglo: string; latin: string }) => (notation === 'latin' ? item.latin : item.anglo)
  const context = panelFollowsProgression ? progression.slice(-3).map(name).join(' → ') : name(chord)
  const isCurrent = (rootPc: number, qualityId: string) =>
    chord.bassPc === null && chord.rootPc === rootPc && chord.quality.id === qualityId

  return (
    <section className="plate flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="label-ink text-blue-ink">{t('suggestions.title')}</h2>
        {progression.length > 0 && (
          <div className="flex gap-1" role="group" aria-label={t('a11y.suggestFrom')}>
            {(['progression', 'chord'] as const).map((from) => (
              <button
                key={from}
                type="button"
                className="stamp px-1.5 py-0.5"
                aria-pressed={suggestFrom === from}
                onClick={() => setSuggestFrom(from)}
              >
                {t(from === 'progression' ? 'suggestions.fromProgression' : 'suggestions.fromChord')}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="readout text-[11px] text-ink-soft" aria-live="polite">
        {t('suggestions.after')} <span className="text-ink">{context}</span>
      </p>

      {panelSuggestions.length === 0 && <p className="readout text-[11px] text-ink-faint">{t('suggestions.empty')}</p>}
      <div className="flex flex-col gap-2">
        {panelSuggestions.map((suggestion) => {
          const current = isCurrent(suggestion.rootPc, suggestion.qualityId)
          return (
            <div className="flex items-stretch gap-2" key={suggestion.anglo}>
              <button
                type="button"
                aria-pressed={current}
                className={`sheet flex flex-1 flex-col items-start gap-0.5 px-3 py-2 text-left ${
                  current ? 'border-ink bg-paper-deep' : ''
                }`}
                onClick={() => {
                  const parsed = parseChord(suggestion.anglo)
                  if (parsed) setChord(parsed)
                }}
              >
                <span className="fv-ui text-[1rem] font-bold">
                  {suggestion.roman ? `${suggestion.roman} · ` : ''}
                  {name(suggestion)}
                </span>
                <span className="text-[10px] leading-snug text-ink-soft">
                  {lang === 'es' ? suggestion.reasonEs : suggestion.reasonEn}
                </span>
              </button>
              <button
                type="button"
                className="stamp px-2"
                onClick={() => addSuggestion(suggestion)}
                aria-label={`${t('progression.add')}: ${name(suggestion)}`}
              >
                +
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
