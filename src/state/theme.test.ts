// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/** A controllable `prefers-color-scheme: light` query, standing in for the operating system. */
function fakeSystem(light: boolean) {
  const listeners = new Set<() => void>()
  const query = {
    get matches() {
      return light
    },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }
  window.matchMedia = vi.fn((q: string) =>
    q.includes('prefers-color-scheme') ? query : { matches: false, addEventListener() {}, removeEventListener() {} },
  ) as unknown as typeof window.matchMedia
  return {
    set(next: boolean) {
      light = next
      for (const fn of listeners) fn()
    },
  }
}

async function load() {
  vi.resetModules()
  return import('./theme')
}

describe('theme preference', () => {
  beforeEach(() => localStorage.clear())

  it('follows the system by default', async () => {
    fakeSystem(true)
    const { useTheme } = await load()
    const { result } = renderHook(() => useTheme())
    expect(result.current.preference).toBe('auto')
    expect(result.current.theme).toBe('day')
    expect(document.documentElement.dataset.theme).toBe('day')
  })

  it('switches live when the system changes while on automatic', async () => {
    const system = fakeSystem(true)
    const { useTheme } = await load()
    const { result } = renderHook(() => useTheme())
    act(() => system.set(false))
    expect(result.current.theme).toBe('night')
    expect(document.documentElement.dataset.theme).toBe('night')
  })

  it('a fixed choice is remembered and ignores the system', async () => {
    const system = fakeSystem(true)
    const { useTheme } = await load()
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setPreference('night'))
    expect(result.current.theme).toBe('night')
    expect(localStorage.getItem('serendipia.theme')).toBe('night')
    act(() => system.set(true))
    expect(result.current.theme).toBe('night')
  })

  it('the toggle fixes the opposite theme', async () => {
    fakeSystem(false)
    const { useTheme } = await load()
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    expect(result.current.preference).toBe('day')
    expect(result.current.theme).toBe('day')
  })

  it('choosing automatic again forgets the choice and follows the system', async () => {
    const system = fakeSystem(true)
    localStorage.setItem('serendipia.theme', 'night')
    const { useTheme } = await load()
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('night')
    act(() => result.current.setPreference('auto'))
    expect(localStorage.getItem('serendipia.theme')).toBeNull()
    expect(result.current.theme).toBe('day')
    act(() => system.set(false))
    expect(result.current.theme).toBe('night')
  })
})
