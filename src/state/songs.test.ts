// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { exportLibrary, importLibrary, loadLibrary, saveToLibrary } from './library'
import { decodeShare } from './share'
import { flattenSong, loadSongs, removeSong, saveSong, songId, type Song } from './songs'

const progression = (p: string) => decodeShare(`p=${encodeURIComponent(p)}`)!

const song = (name = 'Mi canción'): Song => ({
  id: songId(),
  name,
  savedAt: '',
  sections: [
    { id: 'a', label: 'verse', repeats: 2, source: 'Verso', progression: progression('Am_F') },
    { id: 'b', label: 'chorus', repeats: 1, source: 'Coro', progression: progression('C_G_Am') },
  ],
})

describe('songs', () => {
  beforeEach(() => localStorage.clear())

  it('lays a song out step by step, repeats included', () => {
    const flat = flattenSong(song())
    expect(flat.map((item) => item.step.anglo)).toEqual(['Am', 'F', 'Am', 'F', 'C', 'G', 'Am'])
    expect(flat.map((item) => `${item.section}.${item.pass}.${item.local}`)).toEqual(['0.0.0', '0.0.1', '0.1.0', '0.1.1', '1.0.0', '1.0.1', '1.0.2'])
  })

  it('saves, loads back and removes songs', () => {
    const [saved] = saveSong(song())
    expect(loadSongs()[0].sections.map((section) => section.label)).toEqual(['verse', 'chorus'])
    expect(loadSongs()[0].sections[1].progression.steps).toHaveLength(3)
    expect(removeSong(saved.id)).toEqual([])
  })

  it('refuses a song without name or sections', () => {
    expect(saveSong({ ...song(), name: '  ' })).toEqual([])
    expect(saveSong({ ...song(), sections: [] })).toEqual([])
  })

  it('travels in the library backup with the progressions', () => {
    saveToLibrary('Verso', progression('Am_F'))
    saveSong(song())
    const file = exportLibrary(loadLibrary(), loadSongs())
    localStorage.clear()
    const result = importLibrary(file)!
    expect(result.added).toBe(1)
    expect(result.songsAdded).toBe(1)
    expect(loadSongs()[0].name).toBe('Mi canción')
    // Importing again adds nothing new.
    expect(importLibrary(file)!.songsAdded).toBe(0)
  })
})

describe('song links', () => {
  it('carries the whole song, accents included', async () => {
    const { encodeSongLink, decodeSongLink } = await import('./songs')
    const original = song('Canción de cuna ñ')
    const back = decodeSongLink(encodeSongLink(original))!
    expect(back.name).toBe('Canción de cuna ñ')
    expect(back.sections.map((section) => [section.label, section.repeats, section.progression.steps.map((step) => step.anglo).join(' ')])).toEqual([
      ['verse', 2, 'Am F'],
      ['chorus', 1, 'C G Am'],
    ])
    expect(encodeSongLink(original)).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeSongLink('###')).toBeNull()
  })
})
