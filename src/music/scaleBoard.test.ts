import { describe, expect, it } from 'vitest'
import { boardNotes, scaleById, scalePositions } from './scaleBoard'

const STANDARD = [40, 45, 50, 55, 59, 64]

describe('scales on the neck', () => {
  it('A minor pentatonic: the famous box at the 5th fret', () => {
    const notes = boardNotes(9, scaleById('pentMinor').intervals, STANDARD)
    const box = notes.filter((note) => note.fret >= 5 && note.fret <= 8).map((note) => `${note.string}:${note.fret}`)
    expect(box).toEqual(['0:5', '0:8', '1:5', '1:7', '2:5', '2:7', '3:5', '3:7', '4:5', '4:8', '5:5', '5:8'])
    expect(notes.find((note) => note.string === 0 && note.fret === 5)?.degree).toBe(0)
  })

  it('every note is in the scale, with its degree from the root', () => {
    const scale = scaleById('major')
    for (const note of boardNotes(0, scale.intervals, STANDARD)) {
      expect(scale.intervals).toContain(note.degree)
      expect(note.midi).toBe(STANDARD[note.string] + note.fret)
    }
  })

  it('one position starts on each scale note of the low string', () => {
    const positions = scalePositions(9, scaleById('pentMinor').intervals, STANDARD)
    expect(positions.map((position) => position.from)).toEqual([0, 3, 5, 8, 10])
    expect(positions[2]).toEqual({ from: 5, to: 9 })
  })
})
