import { describe, expect, it } from 'vitest'
import { HISTORY_LIMIT, createHistory, pushHistory, redoHistory, undoHistory } from './history'

describe('history', () => {
  it('undoes and redoes in order', () => {
    let history = createHistory('a')
    history = pushHistory(history, 'b')
    history = pushHistory(history, 'c')
    history = undoHistory(history)
    expect(history.present).toBe('b')
    history = undoHistory(history)
    expect(history.present).toBe('a')
    history = undoHistory(history)
    expect(history.present).toBe('a')
    history = redoHistory(redoHistory(history))
    expect(history.present).toBe('c')
    expect(redoHistory(history)).toBe(history)
  })

  it('drops the redo branch after a new change', () => {
    let history = pushHistory(pushHistory(createHistory(1), 2), 3)
    history = pushHistory(undoHistory(history), 9)
    expect(history.future).toEqual([])
    expect(undoHistory(history).present).toBe(2)
  })

  it('ignores no-op changes and caps its length', () => {
    const start = createHistory('x')
    expect(pushHistory(start, 'x')).toBe(start)
    let history = createHistory(0)
    for (let index = 1; index <= HISTORY_LIMIT + 20; index += 1) history = pushHistory(history, index)
    expect(history.past).toHaveLength(HISTORY_LIMIT)
  })
})
