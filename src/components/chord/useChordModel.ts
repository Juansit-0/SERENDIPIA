import { useMemo } from 'react'
import { soundingChord } from '../../music/capo'
import { chordToneSpelling } from '../../music/chords'
import { keyCandidates, sameKey } from '../../music/keyDetection'
import { latinName, pitchName } from '../../music/notes'
import { useStore } from '../../state/store'
import { roleOfInterval, type NoteRole } from './roles'

export interface ToneInfo {
  interval: number
  pc: number
  name: string
  role: NoteRole
}

/** Everything the Acorde view derives from the store: the chord, its tones by role, the chart state. */
export function useChordModel() {
  const store = useStore()
  const { chord, capo, notation, chartSource, chartFrets, detection, keyRootPc, keyMode } = store

  const marksCount = chartFrets.filter((fret) => fret !== null).length
  const unrecognized = chartSource === 'marks' && marksCount > 0 && (detection?.candidates.length ?? 0) === 0
  const emptyMarks = chartSource === 'marks' && marksCount === 0
  /** The chart shows marks the detector could not name: roles would be guesses, so none are drawn. */
  const noChord = unrecognized || emptyMarks

  const sounding = useMemo(() => soundingChord(chord, capo), [chord, capo])
  const nameOf = (item: { anglo: string; latin: string }) => (notation === 'latin' ? item.latin : item.anglo)

  const tones = useMemo<ToneInfo[]>(
    () =>
      chordToneSpelling(sounding.rootPc, sounding.quality, sounding.accidental === 'flat').map((tone) => ({
        interval: tone.interval,
        pc: tone.pc,
        name: notation === 'latin' ? tone.latin : tone.anglo,
        role: roleOfInterval(tone.interval, sounding.quality.id),
      })),
    [sounding.rootPc, sounding.quality, sounding.accidental, notation],
  )

  const { noteNames, roles } = useMemo(() => {
    const names: Record<number, string> = {}
    const roleMap: Record<number, NoteRole> = {}
    for (let pc = 0; pc < 12; pc += 1) {
      names[pc] = notation === 'latin' ? latinName(pc, 'sharp') : pitchName(pc, 'sharp')
    }
    if (!noChord) {
      for (const tone of tones) {
        names[tone.pc] = tone.name
        roleMap[tone.pc] = tone.role
      }
    }
    return { noteNames: names, roles: roleMap }
  }, [tones, notation, noChord])

  const keyTop = useMemo(
    () => keyCandidates({ rootPc: chord.rootPc, qualityId: chord.quality.id }, 1)[0] ?? null,
    [chord.rootPc, chord.quality.id],
  )
  const keyDiffers = keyTop ? !sameKey(keyTop, { rootPc: keyRootPc, mode: keyMode }) : false

  const voicing = store.voicings[store.selectedVoicing] ?? null
  const activeVoicing = noChord || (chartSource === 'marks' && voicing?.source !== 'marked') ? null : voicing

  const alternatives = chartSource === 'marks' && detection ? detection.candidates.slice(1) : []

  return {
    ...store,
    marksCount,
    unrecognized,
    emptyMarks,
    noChord,
    sounding,
    tones,
    noteNames,
    roles,
    keyTop,
    keyDiffers,
    alternatives,
    activeVoicing,
    voicings: store.voicings,
    heroName: notation === 'latin' ? chord.latin : chord.anglo,
    otherName: notation === 'latin' ? chord.anglo : chord.latin,
    nameOf,
  }
}

export type ChordModel = ReturnType<typeof useChordModel>
