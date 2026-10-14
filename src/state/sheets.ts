import { fromBase64Url, toBase64Url } from './base64url'

/** A songbook sheet: lyrics with chords, in ChordPro. */
export interface Sheet {
  id: string
  name: string
  text: string
  savedAt: string
}

const STORAGE_KEY = 'serendipia.sheets.v1'
export const SHEETS_LIMIT = 100
const TEXT_LIMIT = 20000

export function sheetId(): string {
  return `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function clean(raw: Partial<Sheet> | null): Sheet | null {
  if (!raw || typeof raw.name !== 'string' || typeof raw.text !== 'string') return null
  return {
    id: typeof raw.id === 'string' ? raw.id : sheetId(),
    name: raw.name.trim().slice(0, 80) || '—',
    text: raw.text.slice(0, TEXT_LIMIT),
    savedAt: typeof raw.savedAt === 'string' ? raw.savedAt : '',
  }
}

export function loadSheets(): Sheet[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.flatMap((raw) => clean(raw) ?? []) : []
  } catch {
    return []
  }
}

function persist(sheets: Sheet[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets))
  } catch {
    return
  }
}

/** Saves (or replaces, by id) a sheet, newest first. A full songbook refuses new sheets rather than dropping old ones. */
export function saveSheet(sheet: Sheet, now = new Date()): Sheet[] {
  const others = loadSheets().filter((item) => item.id !== sheet.id)
  const cleaned = clean({ ...sheet, savedAt: now.toISOString() })
  if (!cleaned || others.length >= SHEETS_LIMIT) return loadSheets()
  const sheets = [cleaned, ...others]
  persist(sheets)
  return sheets
}

export function removeSheet(id: string): Sheet[] {
  const sheets = loadSheets().filter((sheet) => sheet.id !== id)
  persist(sheets)
  return sheets
}

/** Adds sheets from a backup or a link; one with the same name and text is skipped. */
export function mergeSheets(raw: unknown[]): { sheets: Sheet[]; added: number } {
  const sheets = loadSheets()
  let added = 0
  for (const item of raw) {
    const sheet = clean(item as Partial<Sheet>)
    if (!sheet || sheets.length >= SHEETS_LIMIT) continue
    if (sheets.some((existing) => existing.name === sheet.name && existing.text === sheet.text)) continue
    sheets.push({ ...sheet, id: sheetId() })
    added += 1
  }
  if (added > 0) persist(sheets)
  return { sheets, added }
}

export function encodeSheetLink(sheet: Sheet): string {
  return toBase64Url(JSON.stringify({ n: sheet.name, t: sheet.text }))
}

export function decodeSheetLink(text: string): Sheet | null {
  const json = fromBase64Url(text)
  if (!json) return null
  try {
    const raw = JSON.parse(json) as { n?: unknown; t?: unknown }
    return clean({ name: raw.n as string, text: raw.t as string, savedAt: '' })
  } catch {
    return null
  }
}

export function sheetUrl(sheet: Sheet, location: { origin: string; pathname: string }): string {
  return `${location.origin}${location.pathname}?sheet=${encodeSheetLink(sheet)}#songbook`
}
