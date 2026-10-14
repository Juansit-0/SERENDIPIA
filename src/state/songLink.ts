import type { Lang } from '../i18n'
import { songsText } from '../i18n/songs'
import { decodeSongLink, encodeSong, loadSongs, mergeSongs, type Song } from './songs'

/** Reads ?song=… once per page load (StrictMode may ask twice) and merges it into the saved songs. */
let songLink: { songs: Song[]; notice: string } | null | undefined
export function songLinkImport(lang: Lang): { songs: Song[]; notice: string } | null {
  if (songLink !== undefined || typeof window === 'undefined') return songLink ?? null
  const raw = new URLSearchParams(window.location.search).get('song')
  if (!raw) return (songLink = null)
  const x = songsText[lang]
  const song = decodeSongLink(raw)
  if (!song) return (songLink = { songs: loadSongs(), notice: x.linkBroken })
  const result = mergeSongs([encodeSong(song)])
  return (songLink = { songs: result.songs, notice: result.added > 0 ? `${x.linkAdded}: «${song.name}»` : `${x.linkAlready}: «${song.name}»` })
}

/** Tests load the app many times in one module: start each from the current address. */
export function resetSongLinkForTests(): void {
  songLink = undefined
}

