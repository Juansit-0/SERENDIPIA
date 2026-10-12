import { useCallback } from 'react'
import { BottomRow } from '../components/chord/BottomRow'
import { Fretboard } from '../components/chord/Fretboard'
import { GlossFind, GlossPulse, PhaseColumn } from '../components/chord/Gloss'
import { Hero } from '../components/chord/Hero'
import { InfoRow } from '../components/chord/InfoRow'
import { useChordModel } from '../components/chord/useChordModel'
import { VoicingPads } from '../components/VoicingPads'
import '../styles/chord.css'

/** The merged Acorde view (dictionary + detector): a poster collage around one interactive fretboard. */
export function ChordView() {
  const m = useChordModel()
  const { chartSource, chartFrets, playFrets, playVoicing, toggleChartFret, setChordInputFocused } = m

  const listen = useCallback(() => {
    if (chartSource === 'marks') playFrets(chartFrets)
    else playVoicing()
  }, [chartSource, chartFrets, playFrets, playVoicing])

  // The detector may rename the input only while the user is not typing: clicking the chart ends typing.
  const toggle = useCallback(
    (stringIndex: number, fret: number) => {
      const active = document.activeElement
      if (active instanceof HTMLInputElement && active.id === 'chord-input') active.blur()
      setChordInputFocused(false)
      toggleChartFret(stringIndex, fret)
    },
    [toggleChartFret, setChordInputFocused],
  )

  const activeIndex =
    chartSource === 'marks' ? (m.voicings[m.selectedVoicing]?.source === 'marked' ? m.selectedVoicing : -1) : m.selectedVoicing

  return (
    <div className="cv">
      <div className="cv-top">
        <Hero m={m} />
        <PhaseColumn />
        <GlossFind />
        <GlossPulse />
      </div>
      <InfoRow m={m} onListen={listen} />
      <div className="cv-mid">
        <VoicingPads activeIndex={activeIndex} />
        <Fretboard m={m} onToggle={toggle} />
      </div>
      <BottomRow m={m} onListen={listen} />
    </div>
  )
}
