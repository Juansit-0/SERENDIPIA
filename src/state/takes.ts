/*
 * Recorded takes, kept in this browser's IndexedDB (audio is too big for localStorage).
 * The newest TAKES_KEPT are kept; older ones go when a new take is saved.
 */

export interface Take {
  id: string
  createdAt: string
  durationMs: number
  mime: string
  blob: Blob
  /** What was played: the chords, tempo and backing, for the list. */
  title: string
  tempo: number
}

const DB_NAME = 'serendipia'
const STORE = 'takes'
export const TAKES_KEPT = 20

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const request = work(transaction.objectStore(STORE))
        transaction.oncomplete = () => {
          db.close()
          resolve(request ? request.result : undefined)
        }
        transaction.onerror = () => reject(transaction.error)
      }),
  )
}

/** Newest first. */
export async function listTakes(): Promise<Take[]> {
  const takes = ((await run('readonly', (store) => store.getAll())) ?? []) as Take[]
  return takes.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function saveTake(take: Take): Promise<Take[]> {
  await run('readwrite', (store) => store.put(take))
  const takes = await listTakes()
  for (const old of takes.slice(TAKES_KEPT)) await deleteTake(old.id)
  return takes.slice(0, TAKES_KEPT)
}

export async function deleteTake(id: string): Promise<void> {
  await run('readwrite', (store) => store.delete(id))
}

export function takeExtension(mime: string): string {
  return mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm'
}
