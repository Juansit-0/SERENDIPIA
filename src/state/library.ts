import { decodeShare, encodeShare, type SharedProgression } from './share'
import { encodeSong, mergeSongs, type Song } from './songs'
import { loadHistory, mergeHistory } from '../music/history'

export interface LibraryEntry {
  id: string
  name: string
  savedAt: string
  progression: SharedProgression
}

const STORAGE_KEY = 'serendipia.library.v1'
export const LIBRARY_LIMIT = 100

// Entries are stored in the same compact form as share links, so both stay in sync.
interface StoredEntry {
  id: string
  name: string
  savedAt: string
  data: string
}

function isStoredEntry(raw: unknown): raw is StoredEntry {
  const entry = raw as Partial<StoredEntry> | null
  return !!entry && typeof entry.id === 'string' && typeof entry.name === 'string' && typeof entry.data === 'string'
}

function readStored(): StoredEntry[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isStoredEntry).map((raw) => ({ ...raw, savedAt: typeof raw.savedAt === 'string' ? raw.savedAt : '' }))
  } catch {
    return []
  }
}

function toEntry(raw: StoredEntry): LibraryEntry | null {
  const progression = decodeShare(raw.data)
  return progression ? { id: raw.id, name: raw.name, savedAt: raw.savedAt, progression } : null
}

export function loadLibrary(): LibraryEntry[] {
  return readStored().flatMap((raw) => toEntry(raw) ?? [])
}

function persist(entries: LibraryEntry[]): void {
  const stored: StoredEntry[] = entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    savedAt: entry.savedAt,
    data: encodeShare(entry.progression),
  }))
  // Never drop what this version cannot read (e.g. saved by a newer one): keep it as it was.
  const kept = new Set(stored.map((entry) => entry.id))
  const unreadable = readStored().filter((raw) => !kept.has(raw.id) && !toEntry(raw))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...stored, ...unreadable]))
  } catch {
    return
  }
}

function newId(now: Date): string {
  return `lib-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Saves under `name`; an entry with the same name (ignoring case) is replaced. Newest first.
 * A full library refuses new names instead of silently dropping the oldest progression.
 */
export function saveToLibrary(name: string, progression: SharedProgression, now = new Date()): LibraryEntry[] {
  const trimmed = name.trim().slice(0, 60)
  const current = loadLibrary()
  if (!trimmed || progression.steps.length === 0) return current
  const others = current.filter((entry) => entry.name.toLowerCase() !== trimmed.toLowerCase())
  if (others.length >= LIBRARY_LIMIT) return current
  const entry: LibraryEntry = { id: newId(now), name: trimmed, savedAt: now.toISOString(), progression }
  const entries = [entry, ...others]
  persist(entries)
  return entries
}

export function isLibraryFull(entries: LibraryEntry[], name: string): boolean {
  const trimmed = name.trim().toLowerCase()
  return entries.length >= LIBRARY_LIMIT && !entries.some((entry) => entry.name.toLowerCase() === trimmed)
}

export function removeFromLibrary(id: string): LibraryEntry[] {
  const entries = loadLibrary().filter((entry) => entry.id !== id)
  persist(entries)
  return entries
}

const BACKUP_APP = 'serendipia'

/** A backup file with every saved progression (and song), to move them to another browser or keep them safe. */
export function exportLibrary(entries: LibraryEntry[], songs: Song[] = [], now = new Date()): string {
  const backup = {
    app: BACKUP_APP,
    version: 1,
    exportedAt: now.toISOString(),
    entries: entries.map((entry) => ({ name: entry.name, savedAt: entry.savedAt, data: encodeShare(entry.progression) })),
    songs: songs.map(encodeSong),
    history: loadHistory(),
  }
  return JSON.stringify(backup, null, 2)
}

/**
 * Adds the progressions of a backup file to the library; nothing already saved is replaced.
 * An identical progression under the same name is skipped; a different one with a taken name gets « (2)».
 * Returns null when the file is not a SERENDIPIA backup.
 */
export function importLibrary(
  text: string,
  now = new Date(),
): { entries: LibraryEntry[]; added: number; skipped: number; songs: Song[] | null; songsAdded: number } | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  const backup = parsed as { app?: unknown; entries?: unknown; songs?: unknown; history?: unknown } | null
  if (!backup || backup.app !== BACKUP_APP || !Array.isArray(backup.entries)) return null

  const entries = loadLibrary()
  let added = 0
  let skipped = 0
  for (const raw of backup.entries as Array<Partial<StoredEntry> | null>) {
    const progression = raw && typeof raw.data === 'string' ? decodeShare(raw.data) : null
    const name = raw && typeof raw.name === 'string' ? raw.name.trim().slice(0, 60) : ''
    if (!progression || !name) {
      skipped += 1
      continue
    }
    const data = encodeShare(progression)
    const sameName = (candidate: string) => entries.find((entry) => entry.name.toLowerCase() === candidate.toLowerCase())
    const existing = sameName(name)
    if (existing && encodeShare(existing.progression) === data) {
      skipped += 1
      continue
    }
    if (entries.length >= LIBRARY_LIMIT) {
      skipped += 1
      continue
    }
    let finalName = name
    for (let n = 2; sameName(finalName); n += 1) finalName = `${name.slice(0, 54)} (${n})`
    const savedAt = typeof raw?.savedAt === 'string' ? raw.savedAt : now.toISOString()
    entries.push({ id: newId(now), name: finalName, savedAt, progression })
    added += 1
  }
  if (added > 0) persist(entries)
  const merged = Array.isArray(backup.songs) ? mergeSongs(backup.songs, now) : null
  if (backup.history && typeof backup.history === 'object') mergeHistory(backup.history)
  return { entries, added, skipped, songs: merged?.songs ?? null, songsAdded: merged?.added ?? 0 }
}
