import { useMemo } from 'react'
import { ChordSymbol } from '../components/ChordSymbol'
import { RegMark } from '../components/RegMark'
import { StepGrid } from '../components/StepGrid'
import { SuggestionsPanel } from '../components/SuggestionsPanel'
import { VoicingPads } from '../components/VoicingPads'
import { chordToneSpelling, QUALITY_LIST, QualityId, qualityById } from '../music/chords'
import { soundingChord } from '../music/capo'
import { LATIN_SHARP, PITCH_SHARP } from '../music/notes'
import { parseChord } from '../music/parseChord'
import { stringLabels } from '../music/voicings'
import { useStore } from '../state/store'

export function DictionaryView() {
  const {
    chord,
    voicings,
    selectedVoicing,
    t,
    lang,
    setChord,
    playFrets,
    capo,
    soundingTuning,
  } = useStore()
  const voicing = voicings[selectedVoicing]
  const sounding = soundingChord(chord, capo)
  const noteNames = useMemo(() => {
    const map: Record<number, string> = {}
    for (const tone of chordToneSpelling(sounding.rootPc, sounding.quality, sounding.accidental === 'flat')) {
      map[tone.pc] = tone.anglo
    }
    return map
  }, [sounding.rootPc, sounding.quality, sounding.accidental])

  const windowStart = useMemo(() => {
    if (!voicing) return capo > 0 ? capo : 1
    const fretted = voicing.frets.filter((fret): fret is number => fret !== null && fret > 0)
    if (fretted.length === 0) return capo > 0 ? capo : 1
    const minAbsolute = Math.min(...fretted) + capo
    const maxAbsolute = Math.max(...fretted) + capo
    if (capo > 0) return Math.max(capo, maxAbsolute - 4)
    return Math.max(1, minAbsolute)
  }, [voicing, capo])

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(280px,1fr)_minmax(420px,1.7fr)_minmax(250px,0.9fr)] desk:h-full desk:min-h-0 desk:grid-cols-[minmax(232px,1fr)_minmax(360px,1.75fr)_minmax(216px,0.9fr)] desk:grid-rows-[minmax(0,1fr)] desk:items-stretch desk:gap-3">
      <ChordSymbol />

      <section className="plate relative flex flex-col gap-4 p-4 desk:min-h-0 desk:gap-2 desk:p-3">
        <RegMark className="left-1.5 top-1.5" />
        <RegMark className="right-1.5 top-1.5" />
        <RegMark className="bottom-1.5 left-1.5" />
        <RegMark className="bottom-1.5 right-1.5" />

        <div className="flex items-center justify-between gap-3">
          <h2 className="label-ink text-blue-ink">{t('chord.voicings')}</h2>
          {voicing && (
            <span className="readout text-[11px]">
              {voicing.frets.map((fret) => (fret === null ? 'x' : fret)).join(' ')}
            </span>
          )}
        </div>

        {voicing && (
          <div className="desk:min-h-0 desk:flex-1">
          <StepGrid
            fill
            frets={voicing.frets}
            tuning={soundingTuning}
            stringLabels={stringLabels(soundingTuning)}
            accidental={chord.accidental}
            windowStart={windowStart}
            windowSize={5}
            capo={capo}
            noteNames={noteNames}
            onPlayString={(stringIndex) => {
              const single = voicing.frets.map((fret, index) => (index === stringIndex ? fret : null))
              playFrets(single)
            }}
          />
          </div>
        )}

        <VoicingPads />
      </section>

      <aside className="flex flex-col gap-4 desk:min-h-0 desk:gap-3">
        <section className="plate flex shrink-0 flex-col gap-3 p-4 desk:gap-1.5 desk:p-3">
          <h2 className="label-ink text-blue-ink">{t('chord.root')}</h2>
          <div className="grid grid-cols-6 gap-1.5">
            {PITCH_SHARP.map((name, pc) => (
              <button
                key={name}
                type="button"
                className="stamp flex-col gap-0 px-1 py-1 desk:min-h-[30px] desk:py-0.5 desk:[@media(min-height:900px)]:min-h-10"
                aria-pressed={pc === chord.rootPc}
                onClick={() => {
                  const next = parseChord(`${name}${chord.quality.suffix}`)
                  if (next) setChord(next)
                }}
              >
                <span className="text-[0.8125rem] font-bold leading-none">{name}</span>
                <span className="font-mono text-[10px] leading-none opacity-70">{LATIN_SHARP[pc]}</span>
              </button>
            ))}
          </div>

          <label className="label-ink text-blue-ink desk:mt-1" htmlFor="quality-select">
            {t('chord.quality')}
          </label>
          <select
            id="quality-select"
            className="stamp w-full cursor-pointer appearance-none px-2 py-1"
            value={chord.quality.id}
            onChange={(event) => {
              const quality = qualityById(event.target.value as QualityId)
              const next = parseChord(`${PITCH_SHARP[chord.rootPc]}${quality.suffix}`)
              if (next) setChord(next)
            }}
          >
            {QUALITY_LIST.map((quality) => (
              <option key={quality.id} value={quality.id}>
                {lang === 'es' ? quality.nameEs : quality.nameEn} · {PITCH_SHARP[chord.rootPc]}
                {quality.suffix}
              </option>
            ))}
          </select>
        </section>

        <SuggestionsPanel />
      </aside>

    </div>
  )
}
