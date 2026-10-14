import { useCallback, useMemo, useRef, useState } from 'react'
import { loadedAudioEngine } from '../audio/loader'
import type { PlayPattern } from '../audio/types'
import { shapeChord } from '../music/capo'
import { detectChord } from '../music/detectChord'
import { parseChord, type ParsedChord } from '../music/parseChord'
import { voicingLabel } from '../music/stepVoicing'
import { voicingFromFrets, voicingsFor, type Voicing } from '../music/voicings'
import { emitPluck } from './pluck'
import { toggleDetectorFret } from './progressionOps'
import type { ChartSource, MarkedVoicing } from './storeTypes'

/**
 * The Acorde view's state: the chord in view (typed, picked or heard), its voicings, and the one fretboard
 * that shows either a voicing or the player's own marks — naming the chord the marks make, in both directions.
 */
export function useChordChart({
  tuning,
  capo,
  soundingTuning,
  enableAudio,
}: {
  tuning: number[]
  capo: number
  soundingTuning: number[]
  enableAudio: () => Promise<void>
}) {
  const [chordInput, setChordInputState] = useState('Am7')
  const [chord, setChordState] = useState<ParsedChord>(() => parseChord('Am7')!)
  const [chordError, setChordError] = useState(false)
  const [selectedVoicing, setSelectedVoicing] = useState(0)
  const [detectorFrets, setDetectorFrets] = useState<(number | null)[]>([0, 0, 0, 0, 0, 0])
  const [chartSource, setChartSource] = useState<ChartSource>('voicing')
  const chordInputFocused = useRef(false)
  const [markedVoicing, setMarkedVoicingState] = useState<MarkedVoicing | null>(null)

  const voicings = useMemo(() => {
    const shapes = voicingsFor(chord.rootPc, chord.quality, tuning, { bassPc: chord.bassPc, limit: 9 })
    const shift = (voicing: Voicing): Voicing => (capo === 0 ? voicing : { ...voicing, midi: voicing.midi.map((midi) => midi + capo) })
    if (!markedVoicing || markedVoicing.rootPc !== chord.rootPc || markedVoicing.qualityId !== chord.quality.id) {
      return shapes.map(shift)
    }
    const marked = voicingFromFrets(markedVoicing.frets, tuning, chord.rootPc, chord.quality, 'marked')
    if (!marked) return shapes.map(shift)
    return [shift(marked), ...shapes.filter((voicing) => voicing.signature !== marked.signature).map(shift)]
  }, [chord, tuning, capo, markedVoicing])

  const playVoicing = useCallback(
    (index?: number, pattern: PlayPattern = 'strum-down') => {
      const target = voicings[index ?? selectedVoicing]
      if (!target) return
      emitPluck(target.frets)
      void enableAudio().then(() => {
        loadedAudioEngine()?.playFrets(target.frets, soundingTuning, pattern)
      })
    },
    [voicings, selectedVoicing, soundingTuning, enableAudio],
  )

  const selectVoicing = useCallback(
    (index: number, play = true) => {
      setSelectedVoicing(index)
      setChartSource('voicing')
      if (play) playVoicing(index)
    },
    [playVoicing],
  )

  const setChordInput = useCallback((value: string) => {
    setChordInputState(value)
    const parsed = parseChord(value)
    if (parsed) {
      setChordState(parsed)
      setSelectedVoicing(0)
      setChartSource('voicing')
      setChordError(false)
    } else {
      setChordError(value.trim().length > 0)
    }
  }, [])

  const setMarkedVoicing = useCallback((voicing: MarkedVoicing | null) => {
    setMarkedVoicingState(voicing)
  }, [])

  const setChord = useCallback((next: ParsedChord) => {
    setChordState(next)
    setSelectedVoicing(0)
    setChartSource('voicing')
    setChordInputState(next.anglo)
    setChordError(false)
  }, [])

  const toggleDetectorString = useCallback(
    (stringIndex: number, fret: number) => {
      setDetectorFrets((previous) => toggleDetectorFret(previous, stringIndex, fret, capo))
    },
    [capo],
  )

  const chartFrets = useMemo<(number | null)[]>(
    () => (chartSource === 'marks' ? detectorFrets : (voicings[selectedVoicing]?.frets ?? [null, null, null, null, null, null])),
    [chartSource, detectorFrets, voicings, selectedVoicing],
  )

  const detection = useMemo(
    () => (chartSource === 'marks' ? detectChord(detectorFrets, soundingTuning) : null),
    [chartSource, detectorFrets, soundingTuning],
  )

  /** Name the chord the marks make (as the shape played behind the capo) without touching the marks. */
  const adoptMarks = useCallback(
    (marks: (number | null)[], anglo: string | null) => {
      const sounding = anglo ? parseChord(anglo) : null
      if (!sounding) return
      const shape = shapeChord(sounding, capo)
      setChordState(shape)
      setSelectedVoicing(0)
      setChordError(false)
      setMarkedVoicingState({ rootPc: shape.rootPc, qualityId: shape.quality.id, frets: marks, label: voicingLabel(marks), capo })
      if (!chordInputFocused.current) setChordInputState(shape.anglo)
    },
    [capo],
  )

  const toggleChartFret = useCallback(
    (stringIndex: number, fret: number) => {
      const next = toggleDetectorFret(chartFrets, stringIndex, fret, capo)
      setDetectorFrets(next)
      setChartSource('marks')
      adoptMarks(next, detectChord(next, soundingTuning).candidates[0]?.anglo ?? null)
    },
    [chartFrets, capo, soundingTuning, adoptMarks],
  )

  const pickDetectedName = useCallback(
    (anglo: string) => {
      setChartSource('marks')
      adoptMarks(detectorFrets, anglo)
    },
    [detectorFrets, adoptMarks],
  )

  const clearChartMarks = useCallback(() => {
    setDetectorFrets([null, null, null, null, null, null])
    setChartSource('marks')
    setMarkedVoicingState(null)
  }, [])

  const setChordInputFocused = useCallback((focused: boolean) => {
    chordInputFocused.current = focused
  }, [])

  return {
    chord,
    chordInput,
    chordError,
    setChordInput,
    setChord,
    voicings,
    selectedVoicing,
    setSelectedVoicing,
    selectVoicing,
    playVoicing,
    markedVoicing,
    setMarkedVoicing,
    detectorFrets,
    setDetectorFrets,
    toggleDetectorString,
    chartSource,
    chartFrets,
    detection,
    toggleChartFret,
    pickDetectedName,
    clearChartMarks,
    setChordInputFocused,
  }
}
