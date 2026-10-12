import { soundingChord } from '../music/capo'
import { chordToneSpelling } from '../music/chords'
import { keyCandidates, sameKey } from '../music/keyDetection'
import { voicingLabel } from '../music/stepVoicing'
import { intervalName } from '../music/notes'
import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { useStore } from '../state/store'
import { MiniPlate } from './MiniPlate'
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
    capo,
    keyRootPc,
    keyMode,
    setKeyRootPc,
    setKeyMode,
  } = useStore()
  const voicing = voicings[selectedVoicing]
  const heroName = notation === 'latin' ? chord.latin : chord.anglo
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Autofocus only with a precise pointer: on phones it would pop the keyboard on load.
  useEffect(() => {
    if (window.matchMedia?.('(pointer: fine)').matches) inputRef.current?.focus()
  }, [])
  const sounding = soundingChord(chord, capo)
  const keySuggestions = useMemo(
    () => keyCandidates({ rootPc: chord.rootPc, qualityId: chord.quality.id }, 2),
    [chord.rootPc, chord.quality.id],
  )
  const currentKey = { rootPc: keyRootPc, mode: keyMode }
  const shownKeys = keySuggestions.filter((candidate) => !sameKey(candidate, currentKey))

  return (
    // On `desk` the flex `order` lifts the action buttons right under the input and keeps the
  // whole plate within the column height; phones keep the document order.
  <section className="plate flex flex-col gap-3 p-4 desk:min-h-0 desk:gap-1.5 desk:overflow-y-auto desk:p-3">
      <label className="label-ink text-blue-ink" htmlFor="chord-input">
        {t('chord.input.label')}
      </label>
      <input
        id="chord-input"
        ref={inputRef}
        aria-invalid={chordError}
        aria-describedby={chordError ? 'chord-input-error' : undefined}
        className={`field ${chordError ? 'field--error' : ''}`}
        value={chordInput}
        onChange={(event) => setChordInput(event.target.value)}
        placeholder={t('chord.input.placeholder')}
        spellCheck={false}
        autoComplete="off"
      />
      {chordError && (
        <p id="chord-input-error" className="font-mono text-[11px] text-red-ink" role="alert">
          {t('chord.invalid')}
        </p>
      )}

      {shownKeys.length > 0 && (
        <p className="flex flex-wrap items-center gap-2 desk:order-3 desk:gap-1.5">
          <span className="label-ink text-blue-ink">{t('key.suggested')}</span>
          {shownKeys.map((candidate) => (
            <button
              key={`${candidate.keyAnglo}${candidate.mode}`}
              type="button"
              className="chip chip--blue hover:bg-turquoise hover:text-ink"
              onClick={() => {
                setKeyRootPc(candidate.rootPc)
                setKeyMode(candidate.mode)
              }}
              title={`${t('key.use')}: ${candidate.roman}`}
            >
              {candidate.harmonicFunction && (
                <span
                  className={`ink-rule--${candidate.harmonicFunction} h-2 w-2 rounded-full`}
                  aria-hidden="true"
                />
              )}
              {notation === 'latin' ? candidate.keyLatin : candidate.keyAnglo}{' '}
              {candidate.mode === 'major' ? t('theory.mode.major') : t('theory.mode.minor')} · {candidate.roman} —{' '}
              {t('key.use')}
            </button>
          ))}
        </p>
      )}

      <div className="@container desk:order-2 desk:mr-[5px] desk:mb-[5px]">
      <OffsetPlate offset={5}>
        <p
          className="hero-name fv-name halftone relative overflow-hidden whitespace-nowrap bg-ink px-3 py-1 leading-[0.92] tracking-[-0.02em] text-paper [--hero-max:clamp(2.5rem,5.5vw,5rem)] desk:[--hero-max:clamp(2rem,min(calc(16vh-60px),6vw),7.5rem)]"
          style={{ '--chars': Math.max(4, heroName.length) } as CSSProperties}
          aria-live="polite"
        >
          {heroName}
        </p>
      </OffsetPlate>
      </div>
      {notation === 'both' && <p className="fv-display text-[1.15rem] text-ink-soft desk:order-2 desk:text-[1rem]">{chord.latin}</p>}
      {capo > 0 && (
        <p className="flex flex-wrap items-center gap-2 desk:order-2">
          <span className="chip chip--blue">
            {t('capo.label')} {capo}
          </span>
          <span className="chip">
            {t('capo.sounds')} {notation === 'latin' ? sounding.latin : sounding.anglo}
          </span>
        </p>
      )}

      <dl className="flex flex-col gap-3 border-t border-rule pt-3 desk:order-3 desk:gap-1.5 desk:pt-2">
        <div className="flex flex-col gap-1.5 desk:gap-1">
          <dt className="label-ink text-blue-ink">{t('chord.notes')}</dt>
          <dd className="flex flex-wrap gap-1.5">
            {chordToneSpelling(sounding.rootPc, sounding.quality, sounding.accidental === 'flat').map((tone) => (
              <span className="chip" key={`${tone.interval}-${tone.pc}`}>
                <span className="font-mono text-[10px] text-blue-ink">{intervalName(tone.interval)}</span>
                <span className="fv-ui font-semibold text-ink">
                  {notation === 'latin' ? tone.latin : tone.anglo}
                </span>
                {notation === 'both' && <span className="text-ink-faint">{tone.latin}</span>}
              </span>
            ))}
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

      <div className="flex flex-wrap gap-2 pt-1 desk:order-1 desk:grid desk:grid-cols-2 desk:pt-0">
        <button type="button" className="stamp stamp--ink desk:min-h-9 desk:px-2 desk:[@media(min-height:900px)]:min-h-12 desk:[@media(min-height:900px)]:text-[0.8125rem]" onClick={() => playVoicing()}>
          {t('chord.play')}
        </button>
        <button
          type="button"
          className="stamp desk:min-h-9 desk:px-2 desk:[@media(min-height:900px)]:min-h-12 desk:[@media(min-height:900px)]:text-[0.8125rem]"
          onClick={() =>
            addToProgression({
              rootPc: chord.rootPc,
              qualityId: chord.quality.id,
              anglo: chord.anglo,
              latin: chord.latin,
              bassPc: chord.bassPc,
              frets: voicing?.frets ?? null,
              voicingLabel: voicing ? voicingLabel(voicing.frets) : undefined,
              voicingSource: voicing?.source === 'marked' ? 'marked' : voicing ? 'proof' : 'auto',
            })
          }
        >
          {t('progression.add')}
        </button>
      </div>

      {/* Tall desk screens: a large chart of the selected position fills the spare height. */}
      {voicing && (
        <div className="hidden min-h-0 flex-1 items-center justify-center desk:order-3 desk:[@media(min-height:900px)]:flex">
          <MiniPlate frets={voicing.frets} className="h-full max-h-[22rem] w-auto" />
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 border-t border-rule pt-3 desk:order-4 desk:gap-1 desk:pt-2">
        <h2 className="label-ink text-blue-ink">{t('legend.title')}</h2>
        <ul className="flex flex-col gap-1.5 desk:grid desk:grid-cols-2 desk:gap-x-2 desk:gap-y-0.5">
          {[
            { mark: '●', ink: 'text-turquoise [-webkit-text-stroke:1px_var(--color-ink)]', label: t('legend.pressed') },
            { mark: '○', ink: 'text-ink', label: t('legend.open') },
            { mark: '×', ink: 'text-red', label: t('legend.muted') },
            { mark: '·', ink: 'text-ink-faint', label: t('legend.empty') },
          ].map((item) => (
            <li className="flex items-center gap-2 desk:gap-1" key={item.label}>
              <span className={`w-4 text-center font-mono text-[13px] ${item.ink}`}>{item.mark}</span>
              <span className="text-[11px] text-ink-soft desk:text-[10px] desk:leading-tight">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
