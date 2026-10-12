import { decodeShare, encodeShare, type SharedProgression } from './share'

export interface LibraryEntry {
  id: string
  name: string
  savedAt: string
  progression: SharedProgression
}

const STORAGE_KEY = 'serendipia.library.v1'
export const LIBRARY_LIMIT = 50

// Entries are stored in the same compact form as share links, so both stay in sync.
interface StoredEntry {
  id: string
  name: string
  savedAt: string
  data: string
}

export function loadLibrary(): LibraryEntry[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((raw: Partial<StoredEntry> | null) => {
      if (!raw || typeof raw.id !== 'string' || typeof raw.name !== 'string' || typeof raw.data !== 'string') return []
      const progression = decodeShare(raw.data)
      if (!progression) return []
      return [{ id: raw.id, name: raw.name, savedAt: typeof raw.savedAt === 'string' ? raw.savedAt : '', progression }]
    })
  } catch {
    return []
  }
}

function persist(entries: LibraryEntry[]): void {
  const stored: StoredEntry[] = entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    savedAt: entry.savedAt,
    data: encodeShare(entry.progression),
  }))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    return
  }
}

/** Saves under `name`; an entry with the same name (ignoring case) is replaced. Newest first. */
export function saveToLibrary(name: string, progression: SharedProgression, now = new Date()): LibraryEntry[] {
  const trimmed = name.trim().slice(0, 60)
  if (!trimmed || progression.steps.length === 0) return loadLibrary()
  const others = loadLibrary().filter((entry) => entry.name.toLowerCase() !== trimmed.toLowerCase())
  const entry: LibraryEntry = {
    id: `lib-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmed,
    savedAt: now.toISOString(),
    progression,
  }
  const entries = [entry, ...others].slice(0, LIBRARY_LIMIT)
  persist(entries)
  return entries
}

export function removeFromLibrary(id: string): LibraryEntry[] {
  const entries = loadLibrary().filter((entry) => entry.id !== id)
  persist(entries)
  return entries
}
