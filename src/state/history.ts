export interface History<T> {
  past: T[]
  present: T
  future: T[]
}

export const HISTORY_LIMIT = 50

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] }
}

/** Records a new present; a no-op change keeps the history untouched. */
export function pushHistory<T>(history: History<T>, next: T): History<T> {
  if (Object.is(next, history.present)) return history
  return { past: [...history.past, history.present].slice(-HISTORY_LIMIT), present: next, future: [] }
}

export function undoHistory<T>(history: History<T>): History<T> {
  if (history.past.length === 0) return history
  const previous = history.past[history.past.length - 1]
  return { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] }
}

export function redoHistory<T>(history: History<T>): History<T> {
  if (history.future.length === 0) return history
  const [next, ...rest] = history.future
  return { past: [...history.past, history.present], present: next, future: rest }
}
