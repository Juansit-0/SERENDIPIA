// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { deleteTake, listTakes, saveTake, takeExtension, TAKES_KEPT, type Take } from './takes'

const take = (n: number): Take => ({
  id: `t${n}`,
  createdAt: new Date(2026, 9, 14, 10, n).toISOString(),
  durationMs: 1000 * n,
  mime: 'audio/webm',
  blob: new Blob([`take ${n}`], { type: 'audio/webm' }),
  title: `C G Am F · ${n}`,
  tempo: 92,
})

describe('recorded takes', () => {
  it('keeps takes newest first, drops the oldest beyond the limit, deletes on request', async () => {
    for (let n = 1; n <= TAKES_KEPT + 2; n += 1) await saveTake(take(n))
    const takes = await listTakes()
    expect(takes).toHaveLength(TAKES_KEPT)
    expect(takes[0].id).toBe(`t${TAKES_KEPT + 2}`)
    expect(takes.some((item) => item.id === 't1')).toBe(false)
    await deleteTake(takes[0].id)
    expect((await listTakes())[0].id).toBe(`t${TAKES_KEPT + 1}`)
  })

  it('names the file after its format', () => {
    expect(takeExtension('audio/webm;codecs=opus')).toBe('webm')
    expect(takeExtension('audio/mp4')).toBe('m4a')
  })
})
