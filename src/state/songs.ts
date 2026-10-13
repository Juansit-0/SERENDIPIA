import { decodeShare, encodeShare, type SharedProgression, type SharedStep } from './share'

export const SECTION_LABELS = ['intro', 'verse', 'prechorus', 'chorus', 'bridge', 'solo', 'outro'] as const
export type SectionLabel = (typeof SECTION_LABELS)[number]
export const MAX_REPEATS = 8
export const MAX_SECTIONS = 24
export const SONGS_LIMIT = 50

export interface SongSection {
  id: string
  label: SectionLabel
  repeats: number
  /** Name of the progression it was taken from (shown in the editor). */
  source: string
  progression: SharedProgression
}

export interface Song {
  id: string
  name: string
  savedAt: string
  sections: SongSection[]
}

const STORAGE_KEY = 'serendipia.songs.v1'

// Each section keeps its own copy of the chords, in the share-link form: a song survives its progressions being deleted.
interface StoredSection {
  id: string
  label: string
  repeats: number
  source: string
  data: string
}

interface StoredSong {
  id: string
  name: string
  savedAt: string
  sections: StoredSection[]
}

const isLabel = (value: unknown): value is SectionLabel => SECTION_LABELS.includes(value as SectionLabel)

export function songId(prefix = 'song'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function decodeSong(raw: Partial<StoredSong> | null): Song | null {
  if (!raw || typeof raw.id !== 'string' || typeof raw.name !== 'string' || !Array.isArray(raw.sections)) return null
  const sections = raw.sections.flatMap((section: Partial<StoredSection> | null): SongSection[] => {
    const progression = section && typeof section.data === 'string' ? decodeShare(section.data) : null
    if (!section || !progression) return []
    return [
      {
        id: typeof section.id === 'string' ? section.id : songId('sec'),
        label: isLabel(section.label) ? section.label : 'verse',
        repeats: Number.isInteger(section.repeats) ? Math.min(MAX_REPEATS, Math.max(1, section.repeats as number)) : 1,
        source: typeof section.source === 'string' ? section.source : '',
        progression,
      },
    ]
  })
  return { id: raw.id, name: raw.name, savedAt: typeof raw.savedAt === 'string' ? raw.savedAt : '', sections }
}

export function encodeSong(song: Song): StoredSong {
  return {
    id: song.id,
    name: song.name,
    savedAt: song.savedAt,
    sections: song.sections.map((section) => ({
      id: section.id,
      label: section.label,
      repeats: section.repeats,
      source: section.source,
      data: encodeShare(section.progression),
    })),
  }
}

export function loadSongs(): Song[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((raw) => decodeSong(raw) ?? [])
  } catch {
    return []
  }
}

function persist(songs: Song[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs.map(encodeSong)))
  } catch {
    return
  }
}

/** Saves (or replaces, by id) a song; newest first. A full list refuses new songs instead of dropping old ones. */
export function saveSong(song: Song, now = new Date()): Song[] {
  const others = loadSongs().filter((entry) => entry.id !== song.id)
  const name = song.name.trim().slice(0, 60)
  if (!name || song.sections.length === 0 || others.length >= SONGS_LIMIT) return loadSongs()
  const songs = [{ ...song, name, savedAt: now.toISOString(), sections: song.sections.slice(0, MAX_SECTIONS) }, ...others]
  persist(songs)
  return songs
}

export function removeSong(id: string): Song[] {
  const songs = loadSongs().filter((song) => song.id !== id)
  persist(songs)
  return songs
}

/** Adds backed-up songs; one with the same name and the same sections is skipped. Returns how many were added. */
export function mergeSongs(raw: unknown[], now = new Date()): { songs: Song[]; added: number } {
  const songs = loadSongs()
  let added = 0
  for (const item of raw) {
    const song = decodeSong(item as Partial<StoredSong>)
    if (!song || song.sections.length === 0 || songs.length >= SONGS_LIMIT) continue
    const same = songs.find(
      (existing) => existing.name.toLowerCase() === song.name.toLowerCase() && JSON.stringify(encodeSong(existing).sections.map((s) => s.data)) === JSON.stringify(encodeSong(song).sections.map((s) => s.data)),
    )
    if (same) continue
    let name = song.name
    for (let n = 2; songs.some((existing) => existing.name.toLowerCase() === name.toLowerCase()); n += 1) name = `${song.name.slice(0, 54)} (${n})`
    songs.push({ ...song, id: songId(), name, savedAt: song.savedAt || now.toISOString() })
    added += 1
  }
  if (added > 0) persist(songs)
  return { songs, added }
}

export interface SongStep {
  section: number
  pass: number
  local: number
  step: SharedStep
}

/** The whole song laid out step by step, repeats included: what the player walks through. */
export function flattenSong(song: Song): SongStep[] {
  return song.sections.flatMap((section, sectionIndex) =>
    Array.from({ length: section.repeats }, (_, pass) =>
      section.progression.steps.map((step, local) => ({ section: sectionIndex, pass, local, step })),
    ).flat(),
  )
}
