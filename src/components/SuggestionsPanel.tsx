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
    <section className="plate flex flex-col gap-3 p-4 desk:min-h-0 desk:flex-1 desk:gap-2 desk:p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 desk:shrink-0">
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
      <p className="readout text-[11px] text-ink-soft desk:shrink-0" aria-live="polite">
        {t('suggestions.after')} <span className="text-ink">{context}</span>
      </p>

      {panelSuggestions.length === 0 && <p className="readout text-[11px] text-ink-faint">{t('suggestions.empty')}</p>}
      {/* On `desk` a long list scrolls inside the plate; the padding keeps the tilted sheets unclipped. */}
      <div className="flex flex-col gap-2 desk:-mx-1 desk:min-h-0 desk:flex-1 desk:gap-1.5 desk:overflow-y-auto desk:[@media(min-height:900px)]:gap-2.5 desk:px-1 desk:py-0.5">
        {panelSuggestions.map((suggestion) => {
          const current = isCurrent(suggestion.rootPc, suggestion.qualityId)
          return (
            <div className="flex items-stretch gap-2 desk:[@media(min-height:900px)]:max-h-28 desk:[@media(min-height:900px)]:flex-1" key={suggestion.anglo}>
              <button
                type="button"
                aria-pressed={current}
                className={`sheet flex flex-1 flex-col items-start justify-center gap-0.5 px-3 py-2 text-left desk:px-2.5 desk:py-1.5 desk:[@media(min-height:900px)]:py-2.5 ${
                  current ? 'border-ink bg-paper-deep' : ''
                }`}
                onClick={() => {
                  const parsed = parseChord(suggestion.anglo)
                  if (parsed) setChord(parsed)
                }}
              >
                <span className="fv-ui text-[1rem] font-bold desk:text-[0.9375rem] desk:leading-tight desk:[@media(min-height:900px)]:text-[1.125rem]">
                  {suggestion.roman ? `${suggestion.roman} · ` : ''}
                  {name(suggestion)}
                </span>
                <span className="text-[10px] leading-snug text-ink-soft desk:[@media(min-height:900px)]:text-[11px]">
                  {lang === 'es' ? suggestion.reasonEs : suggestion.reasonEn}
                </span>
              </button>
              <button
                type="button"
                className="stamp px-2 desk:min-w-9"
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
