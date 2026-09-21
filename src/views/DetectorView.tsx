import { useMemo } from 'react'
import { OffsetPlate } from '../components/OffsetPlate'
import { RegMark } from '../components/RegMark'
import { StepGrid } from '../components/StepGrid'
import { detectChord } from '../music/detectChord'
import { LATIN_SHARP, PITCH_SHARP, chordAccidental } from '../music/notes'
import { parseChord } from '../music/parseChord'
import { shapeChord } from '../music/capo'
import { chordToneSpelling } from '../music/chords'
import { isPlayableFrets, voicingLabel } from '../music/stepVoicing'
import { stringLabels } from '../music/voicings'
import { useStore } from '../state/store'

const OPEN: (number | null)[] = [0, 0, 0, 0, 0, 0]

export function DetectorView() {
  const {
    soundingTuning,
    capo,
    t,
    lang,
    notation,
    setChord,
    setView,
    playFrets,
    detectorFrets,
    setDetectorFrets,
    toggleDetectorString,
    setMarkedVoicing,
  } = useStore()
  const frets = detectorFrets

  const detection = useMemo(() => detectChord(frets, soundingTuning), [frets, soundingTuning])
  const best = detection.candidates[0]
  const shape = best ? shapeChord(parseChord(best.anglo) ?? parseChord('C')!, capo) : null
  const noteNames = useMemo(() => {
    if (!best) return undefined
    const map: Record<number, string> = {}
    for (const tone of chordToneSpelling(best.rootPc, best.quality, chordAccidental(best.rootPc) === 'flat')) {
      map[tone.pc] = tone.anglo
    }
    return map
  }, [best])

  const toggle = (stringIndex: number, fret: number) => {
    toggleDetectorString(stringIndex, fret)
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(420px,1.6fr)_minmax(280px,1fr)]">
      <section className="plate relative flex flex-col gap-4 p-4">
        <RegMark className="left-1.5 top-1.5" />
        <RegMark className="right-1.5 top-1.5" />
        <RegMark className="bottom-1.5 left-1.5" />
        <RegMark className="bottom-1.5 right-1.5" />

        <div className="flex items-center justify-between gap-3">
          <h2 className="label-ink text-blue-ink">{t('detector.title')}</h2>
          <button type="button" className="stamp" onClick={() => setDetectorFrets(OPEN)}>
            {t('detector.clear')}
          </button>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="min-w-[560px]">
            <StepGrid
              frets={frets}
              tuning={soundingTuning}
              stringLabels={stringLabels(soundingTuning)}
              accidental={best ? chordAccidental(best.rootPc) : 'sharp'}
              windowStart={1}
              windowSize={12}
              capo={capo}
              interactive
              onToggle={toggle}
              showNotes
              noteNames={noteNames}
            />
          </div>
        </div>

        <p className="readout text-[11px] text-ink-faint">{t('detector.hint')}</p>
      </section>

      <aside className="plate flex flex-col gap-4 p-4">
        <h2 className="label-ink text-blue-ink">{t('detector.detected')}</h2>
        {best ? (
          <>
            <OffsetPlate offset={5}>
              <p
                className="fv-name halftone overflow-hidden bg-ink px-3 py-1 text-[clamp(2.25rem,4vw,3.5rem)] leading-[0.95] text-paper"
                aria-live="polite"
              >
                {notation === 'latin' ? best.latin : best.anglo}
              </p>
            </OffsetPlate>
            {notation === 'both' && <p className="text-[1.1rem] text-ink-soft">{best.latin}</p>}

            <div className="flex flex-wrap gap-1.5">
              <span className="chip chip--ink">{lang === 'es' ? best.quality.nameEs : best.quality.nameEn}</span>
              {detection.bassPc !== null && (
                <span className="chip">
                  {t('detector.bass')}: {PITCH_SHARP[detection.bassPc]} / {LATIN_SHARP[detection.bassPc]}
                </span>
              )}
              <span className="chip">
                {best.inversion === 0
                  ? t('detector.rootPosition')
                  : `${t('detector.inversion')}: ${best.inversion}`}
              </span>
              {capo > 0 && shape && (
                <span className="chip chip--blue">
                  {t('capo.shape')}: {notation === 'latin' ? shape.latin : shape.anglo}
                </span>
              )}
              {detection.notes.map((note, index) => (
                <span className="chip" key={`${note.midi}-${index}`}>
                  {notation === 'latin' ? note.latin : note.anglo}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="stamp stamp--ink" onClick={() => playFrets(frets)}>
                {t('chord.play')}
              </button>
              <button
                type="button"
                className="stamp"
                onClick={() => {
                  const parsed = shape ?? parseChord(best.anglo)
                  if (!parsed) return
                  setChord(parsed)
                  if (shape && isPlayableFrets(frets)) {
                    setMarkedVoicing({
                      rootPc: shape.rootPc,
                      qualityId: shape.quality.id,
                      frets,
                      label: voicingLabel(frets),
                      capo,
                    })
                  }
                  setView('dictionary')
                }}
              >
                {t('detector.toDictionary')}
              </button>
            </div>

            {detection.candidates.length > 1 && (
              <div className="flex flex-col gap-2 border-t border-rule pt-3">
                <h3 className="label-ink text-blue-ink">{t('detector.alternatives')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {detection.candidates.slice(1).map((candidate) => (
                    <button
                      key={candidate.anglo}
                      type="button"
                      className="stamp flex-col items-start gap-0 px-2 py-1"
                      onClick={() => {
                        const parsed = parseChord(candidate.anglo)
                        if (parsed) setChord(shapeChord(parsed, capo))
                      }}
                    >
                      <span className="text-[0.8125rem] font-bold normal-case">{candidate.anglo}</span>
                      <span className="font-mono text-[8px] opacity-70">
                        {lang === 'es' ? candidate.quality.nameEs : candidate.quality.nameEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-[1.05rem] text-ink-soft">{t('detector.none')}</p>
        )}
      </aside>
    </div>
  )
}
