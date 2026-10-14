import { useCallback, useEffect, useState } from 'react'
import type { Lang } from '../i18n'
import {
  importLibrary as mergeBackup,
  isLibraryFull,
  loadLibrary,
  removeFromLibrary,
  saveToLibrary as storeInLibrary,
  type LibraryEntry,
} from './library'
import { showNotice } from './notice'
import type { SharedProgression } from './share'
import { sheetLinkImport, songLinkImport } from './songLink'
import { loadSheets, removeSheet, saveSheet as storeSheet, type Sheet } from './sheets'
import { loadSongs, removeSong, saveSong as storeSong, type Song } from './songs'

/** The player's saved things: progressions (the library) and songs, with backups and song links. */
export function useCollections(lang: Lang, snapshot: () => SharedProgression) {
  const [library, setLibrary] = useState<LibraryEntry[]>(loadLibrary)
  const [songs, setSongs] = useState<Song[]>(() => songLinkImport(lang)?.songs ?? loadSongs())
  const [sheets, setSheets] = useState<Sheet[]>(() => sheetLinkImport(lang)?.sheets ?? loadSheets())

  // A shared song link (?song=…) joins the song list as the list is created; the notice and the clean address follow.
  useEffect(() => {
    const result = songLinkImport(lang) ?? sheetLinkImport(lang)
    if (!result) return
    const params = new URLSearchParams(window.location.search)
    params.delete('song')
    params.delete('sheet')
    const query = params.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
    showNotice(result.notice)
  }, [lang])

  const saveToLibrary = useCallback(
    (name: string) => {
      if (isLibraryFull(loadLibrary(), name)) return false
      setLibrary(storeInLibrary(name, snapshot()))
      return true
    },
    [snapshot],
  )

  const importLibrary = useCallback((text: string) => {
    const result = mergeBackup(text)
    if (result) setLibrary(result.entries)
    if (result?.songs) setSongs(result.songs)
    if (result?.sheets) setSheets(result.sheets)
    return result ? { added: result.added, skipped: result.skipped, songsAdded: result.songsAdded } : null
  }, [])

  const deleteFromLibrary = useCallback((id: string) => setLibrary(removeFromLibrary(id)), [])
  const saveSong = useCallback((song: Song) => setSongs(storeSong(song)), [])
  const deleteSong = useCallback((id: string) => setSongs(removeSong(id)), [])
  const saveSheet = useCallback((sheet: Sheet) => setSheets(storeSheet(sheet)), [])
  const deleteSheet = useCallback((id: string) => setSheets(removeSheet(id)), [])

  return { library, songs, sheets, saveToLibrary, importLibrary, deleteFromLibrary, saveSong, deleteSong, saveSheet, deleteSheet }
}
