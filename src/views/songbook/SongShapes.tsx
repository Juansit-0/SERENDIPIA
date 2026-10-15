import { useMemo } from 'react'
import { MiniPlate } from '../../components/MiniPlate'
import { songbookText } from '../../i18n/songbook'
import type { ParsedChord } from '../../music/parseChord'
import { resolveStepFrets } from '../../music/stepVoicing'
import { useStore } from '../../state/store'
import { chordFunction, sheetKey, uniqueChords } from './sheetKey'

/**
 * The song's chords as diagrams, once each, in the order they are first sung: the easiest shape for the current
 * tuning (the capo applies when they sound, as in the strip). Each is coloured by its function and sounds on tap.
 */
export function SongShapes({ chords }: { chords: ParsedChord[] }) {
  const { lang, notation, tuning, playFrets } = useStore()
  const x = songbookText[lang]
  const key = useMemo(() => sheetKey(chords), [chords])
  const shapes = useMemo(
    () =>
      uniqueChords(chords, 24).map((chord) => ({
        chord,
        frets: resolveStepFrets({ rootPc: chord.rootPc, qualityId: chord.quality.id, bassPc: chord.bassPc }, tuning),
      })),
    [chords, tuning],
  )
  if (shapes.length === 0) return null

  return (
    <div className="sb-shapes" role="group" aria-label={x.shapes}>
      {shapes.map(({ chord, frets }) => {
        const name = notation === 'latin' ? chord.latin : chord.anglo
        return (
          <button
            key={chord.anglo}
            type="button"
            className="sb-shape"
            data-fn={chordFunction(chord, key)}
            disabled={!frets}
            aria-label={`${x.hear} ${name}`}
            title={frets ? frets.map((fret) => (fret === null ? 'x' : fret)).join(' ') : undefined}
            onClick={() => frets && playFrets(frets)}
          >
            {frets ? <MiniPlate frets={frets} className="sb-shape__plate" /> : <span className="sb-shape__none">?</span>}
            <span className="sb-shape__name">{name}</span>
          </button>
        )
      })}
    </div>
  )
}
