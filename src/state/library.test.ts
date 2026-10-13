// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { decodeShare } from './share'
import { exportLibrary, importLibrary, LIBRARY_LIMIT, loadLibrary, removeFromLibrary, saveToLibrary } from './library'

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

  it('a full library refuses a new name instead of dropping the oldest', () => {
    for (let i = 0; i < LIBRARY_LIMIT; i += 1) saveToLibrary(`P${i}`, progression('C_G'))
    const entries = saveToLibrary('Otra', progression('Am'))
    expect(entries).toHaveLength(LIBRARY_LIMIT)
    expect(entries.some((entry) => entry.name === 'P0')).toBe(true)
    expect(entries.some((entry) => entry.name === 'Otra')).toBe(false)
  })

  it('keeps entries it cannot read when saving', () => {
    localStorage.setItem('serendipia.library.v1', '[{"id":"future","name":"Nueva","savedAt":"","data":"p=%3F%3F%3F"}]')
    saveToLibrary('Verso', progression('C_G'))
    const raw = JSON.parse(localStorage.getItem('serendipia.library.v1')!) as Array<{ id: string }>
    expect(raw.map((entry) => entry.id)).toContain('future')
  })

  it('a backup moves the library to another browser', () => {
    saveToLibrary('Mi favorita', progression('Am_F_C_G'))
    const file = exportLibrary(loadLibrary())
    localStorage.clear()
    const result = importLibrary(file)!
    expect(result.added).toBe(1)
    expect(loadLibrary()[0].name).toBe('Mi favorita')
    expect(loadLibrary()[0].progression.steps.map((step) => step.anglo)).toEqual(['Am', 'F', 'C', 'G'])
    expect(loadLibrary()[0].progression.tempo).toBe(100)
  })

  it('importing never replaces what is saved', () => {
    saveToLibrary('Verso', progression('C_G'))
    const file = exportLibrary(loadLibrary())
    expect(importLibrary(file)).toMatchObject({ added: 0, skipped: 1 })
    saveToLibrary('Verso', progression('Dm_G'))
    expect(importLibrary(file)).toMatchObject({ added: 1 })
    expect(loadLibrary().map((entry) => entry.name).sort()).toEqual(['Verso', 'Verso (2)'])
    expect(loadLibrary().find((entry) => entry.name === 'Verso')!.progression.steps[0].anglo).toBe('Dm')
  })

  it('rejects files that are not a backup', () => {
    expect(importLibrary('{oops')).toBeNull()
    expect(importLibrary('{"entries":[]}')).toBeNull()
  })
})
