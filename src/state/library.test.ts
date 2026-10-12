// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { decodeShare } from './share'
import { loadLibrary, removeFromLibrary, saveToLibrary } from './library'

const progression = (p: string) => decodeShare(`p=${encodeURIComponent(p)}&t=100`)!

describe('library', () => {
  beforeEach(() => localStorage.clear())

  it('saves newest first and loads it back', () => {
    saveToLibrary('Verso', progression('C_G_Am_F'))
    saveToLibrary('Coro', progression('F_G_C'))
    const entries = loadLibrary()
    expect(entries.map((entry) => entry.name)).toEqual(['Coro', 'Verso'])
    expect(entries[1].progression.steps.map((step) => step.anglo)).toEqual(['C', 'G', 'Am', 'F'])
    expect(entries[1].progression.tempo).toBe(100)
  })

  it('replaces an entry with the same name', () => {
    saveToLibrary('Verso', progression('C_G'))
    saveToLibrary('verso ', progression('Dm_G_C'))
    const entries = loadLibrary()
    expect(entries).toHaveLength(1)
    expect(entries[0].progression.steps).toHaveLength(3)
  })

  it('ignores blank names, empty progressions and corrupt storage', () => {
    expect(saveToLibrary('   ', progression('C'))).toEqual([])
    localStorage.setItem('serendipia.library.v1', '[{"id":1},{"id":"a","name":"ok","data":"p=Em"},"junk"]')
    expect(loadLibrary().map((entry) => entry.name)).toEqual(['ok'])
    localStorage.setItem('serendipia.library.v1', '{oops')
    expect(loadLibrary()).toEqual([])
  })

  it('removes by id', () => {
    const [entry] = saveToLibrary('Puente', progression('Am_E7'))
    expect(removeFromLibrary(entry.id)).toEqual([])
  })
})
