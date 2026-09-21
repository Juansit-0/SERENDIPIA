import { bothNames, intervalName } from '../music/notes'
import { useStore } from '../state/store'
import { OffsetPlate } from './OffsetPlate'
import type { TKey } from '../i18n'

export function ChordSymbol() {
  const {
    chord,
    notation,
    t,
    playVoicing,
    addToProgression,
    chordInput,
    setChordInput,
    chordError,
    voicings,
    selectedVoicing,
  } = useStore()
  const voicing = voicings[selectedVoicing]

  return (
    <section className="plate flex flex-col gap-3 p-4">
      <label className="label-ink text-blue-ink" htmlFor="chord-input">
        {t('chord.input.label')}
      </label>
      <input
        id="chord-input"
        className={`field ${chordError ? 'field--error' : ''}`}
        value={chordInput}
        onChange={(event) => setChordInput(event.target.value)}
        placeholder={t('chord.input.placeholder')}
        spellCheck={false}
        autoComplete="off"
        autoFocus
      />
      {chordError && <p className="font-mono text-[11px] text-red">{t('chord.invalid')}</p>}

      <OffsetPlate offset={5}>
        <p
          className="fv-name halftone relative overflow-hidden bg-ink px-3 py-1 text-[clamp(2.5rem,5.5vw,5rem)] leading-[0.92] tracking-[-0.02em] text-paper"
          aria-live="polite"
        >
          {notation === 'latin' ? chord.latin : chord.anglo}
        </p>
      </OffsetPlate>
      {notation === 'both' && <p className="fv-display text-[1.15rem] text-ink-soft">{chord.latin}</p>}

      <dl className="flex flex-col gap-3 border-t border-rule pt-3">
        <div className="flex flex-col gap-1.5">
          <dt className="label-ink text-blue-ink">{t('chord.notes')}</dt>
          <dd className="flex flex-wrap gap-1.5">
            {chord.quality.intervals.map((interval, index) => {
              const names = bothNames((chord.rootPc + interval) % 12, chord.accidental)
              return (
                <span className="chip" key={`${interval}-${index}`}>
                  <span className="font-mono text-[10px] text-blue">{intervalName(interval)}</span>
                  <span className="fv-ui font-semibold text-ink">
                    {notation === 'latin' ? names.latin : names.anglo}
                  </span>
                  {notation === 'both' && <span className="text-ink-faint">{names.latin}</span>}
                </span>
              )
            })}
          </dd>
        </div>
        {voicing && (
          <div className="flex items-center gap-2">
            <dt className="label-ink text-blue-ink">{t('chord.position')}</dt>
            <dd className="readout text-[11px]">
              {voicing.baseFret} · {t('chord.span')} {voicing.span} · {t(`difficulty.${voicing.difficulty}` as TKey)}
            </dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" className="stamp stamp--ink" onClick={() => playVoicing()}>
          {t('chord.play')}
        </button>
        <button
          type="button"
          className="stamp"
          onClick={() =>
            addToProgression({
              rootPc: chord.rootPc,
              qualityId: chord.quality.id,
              anglo: chord.anglo,
              latin: chord.latin,
            })
          }
        >
          {t('progression.add')}
        </button>
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-rule pt-3">
        <h2 className="label-ink text-blue-ink">{t('legend.title')}</h2>
        <ul className="flex flex-col gap-1.5">
          {[
            { mark: '●', ink: 'text-turquoise', label: t('legend.pressed') },
            { mark: '○', ink: 'text-ink', label: t('legend.open') },
            { mark: '×', ink: 'text-red', label: t('legend.muted') },
            { mark: '·', ink: 'text-ink-faint', label: t('legend.empty') },
          ].map((item) => (
            <li className="flex items-center gap-2" key={item.label}>
              <span className={`w-4 text-center font-mono text-[13px] ${item.ink}`}>{item.mark}</span>
              <span className="text-[11px] text-ink-soft">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
