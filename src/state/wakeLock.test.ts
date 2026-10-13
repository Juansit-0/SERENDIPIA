// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useWakeLock } from './wakeLock'

describe('useWakeLock', () => {
  it('holds the screen on only while active', async () => {
    const release = vi.fn(async () => undefined)
    const request = vi.fn(async () => ({ release, released: false }))
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
    const { rerender } = renderHook(({ active }) => useWakeLock(active), { initialProps: { active: false } })
    expect(request).not.toHaveBeenCalled()
    rerender({ active: true })
    expect(request).toHaveBeenCalledWith('screen')
    await Promise.resolve()
    rerender({ active: false })
    expect(release).toHaveBeenCalled()
  })
})
