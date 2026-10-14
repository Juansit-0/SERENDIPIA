// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { decodeSheetLink, encodeSheetLink, loadSheets, mergeSheets, removeSheet, saveSheet, sheetId } from './sheets'

const sheet = (name = 'Canción', text = '[C]Hoy el [G]cielo') => ({ id: sheetId(), name, text, savedAt: '' })

describe('songbook sheets', () => {
  beforeEach(() => localStorage.clear())

  it('saves newest first, replaces by id and removes', () => {
    const first = sheet('Una')
    saveSheet(first)
    saveSheet(sheet('Dos'))
    expect(loadSheets().map((item) => item.name)).toEqual(['Dos', 'Una'])
    saveSheet({ ...first, text: '[Am]nueva' })
    expect(loadSheets()[0]).toMatchObject({ name: 'Una', text: '[Am]nueva' })
    expect(removeSheet(first.id).map((item) => item.name)).toEqual(['Dos'])
  })

  it('travels by link, accents and line breaks included, and is not added twice', () => {
    const original = sheet('Canción ñ', '{title: Ñandú}\n[C]Aquí\n[G]allá')
    const back = decodeSheetLink(encodeSheetLink(original))!
    expect(back).toMatchObject({ name: 'Canción ñ', text: '{title: Ñandú}\n[C]Aquí\n[G]allá' })
    expect(mergeSheets([back]).added).toBe(1)
    expect(mergeSheets([back]).added).toBe(0)
    expect(decodeSheetLink('%%%')).toBeNull()
  })
})
