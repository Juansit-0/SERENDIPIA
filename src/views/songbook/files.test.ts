import { describe, expect, it } from 'vitest'
import { fileNameFor, songbookToChordPro, songsFromFile, songToChordPro } from './files'

describe('song files', () => {
  it('opens ChordPro as it is, named by its title', () => {
    const [song] = songsFromFile('cancion.cho', '{title: Cielo de marzo}\n[C]Hoy el [G]cielo\r\n')
    expect(song.name).toBe('Cielo de marzo')
    expect(song.text).toBe('{title: Cielo de marzo}\n[C]Hoy el [G]cielo')
  })

  it('places chords written above the lyrics, and takes the file name when there is no title', () => {
    const [song] = songsFromFile('Cae la tarde.txt', 'G        D\nCae la tarde lenta')
    expect(song.name).toBe('Cae la tarde')
    expect(song.text).toBe('[G]Cae la ta[D]rde lenta')
  })

  it('a whole songbook goes out as one file and comes back as the same songs', () => {
    const sheets = [
      { id: 'a', name: 'Uno', text: '[C]uno', savedAt: '' },
      { id: 'b', name: 'Dos', text: '{title: Dos}\n[G]dos', savedAt: '' },
    ]
    const file = songbookToChordPro(sheets)
    expect(file).toBe('{title: Uno}\n[C]uno\n\n{new_song}\n{title: Dos}\n[G]dos\n')
    const back = songsFromFile('cancionero.cho', file)
    expect(back.map((song) => [song.name, song.text])).toEqual([
      ['Uno', '{title: Uno}\n[C]uno'],
      ['Dos', '{title: Dos}\n[G]dos'],
    ])
    expect(songToChordPro(sheets[1])).toBe('{title: Dos}\n[G]dos\n')
  })

  it('file names work everywhere', () => {
    expect(fileNameFor('Canción: ¿Qué será?')).toBe('cancion-que-sera.cho')
    expect(fileNameFor('***')).toBe('cancion.cho')
  })
})
