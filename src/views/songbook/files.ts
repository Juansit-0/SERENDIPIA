import { chordsOverLyrics, parseSheet } from '../../music/chordpro'
import { sheetId, type Sheet } from '../../state/sheets'

/** Files the songbook opens: ChordPro under its usual names, and plain text. */
export const SONG_FILE_TYPES = '.cho,.chopro,.chordpro,.crd,.pro,.txt,text/plain'
/** Anything bigger is not a songbook. */
export const MAX_SONG_FILE_BYTES = 1_000_000

const NEW_SONG = /^\s*\{\s*(?:new_song|ns)\s*\}\s*$/im

/**
 * The songs in a file: ChordPro as it is, or lyrics with the chords on the line above (converted to ChordPro).
 * Several songs in one file are separated by {new_song}. Each takes its {title}, else the file's name.
 */
export function songsFromFile(fileName: string, content: string): Sheet[] {
  const base = fileName.replace(/\.[^.]+$/, '').trim() || 'Canción'
  const chunks = content.replace(/\r\n?/g, '\n').split(NEW_SONG)
  const songs: Sheet[] = []
  chunks.forEach((chunk, index) => {
    let text = chunk.replace(/^\n+|\s+$/g, '')
    if (!text) return
    // Plain text with the chords above the lyrics: placed over their syllables, as when pasting.
    if (!/\[[^\]\n]+\]/.test(text)) {
      const converted = chordsOverLyrics(text)
      if (converted.converted) text = converted.text
    }
    const title = parseSheet(text).title
    const name = title || (chunks.length > 1 ? `${base} ${index + 1}` : base)
    songs.push({ id: sheetId(), name: name.slice(0, 80), text, savedAt: '' })
  })
  return songs
}

/** One song as ChordPro, with its title on top so it opens with the right name anywhere. */
export function songToChordPro(sheet: Sheet): string {
  const text = sheet.text.replace(/\r\n?/g, '\n').trim()
  return parseSheet(text).title ? `${text}\n` : `{title: ${sheet.name}}\n${text}\n`
}

/** The whole songbook in one ChordPro file, the songs separated by {new_song}. */
export function songbookToChordPro(sheets: Sheet[]): string {
  return sheets.map(songToChordPro).join('\n{new_song}\n')
}

/** A file name that works on every system. */
export function fileNameFor(name: string, extension = 'cho'): string {
  const clean = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
  return `${clean || 'cancion'}.${extension}`
}

export function downloadText(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
