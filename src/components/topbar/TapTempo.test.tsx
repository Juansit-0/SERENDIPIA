// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '../../test/renderApp'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Marcar el tempo', () => {
  it('sets the tempo from taps, with the button or the T key', () => {
    let now = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /^Reproducción/ }))
    const tap = screen.getByRole('button', { name: /Toca al ritmo/ })
    for (let i = 0; i < 4; i += 1) {
      fireEvent.click(tap)
      now += 600
    }
    expect(screen.getByRole('button', { name: /Toca al ritmo/ }).textContent).toContain('100')
    now += 3000
    for (let i = 0; i < 3; i += 1) {
      fireEvent.keyDown(document.body, { key: 't' })
      now += 400
    }
    expect(screen.getByRole('button', { name: /Toca al ritmo/ }).textContent).toContain('150')
  })

  it('offers subdivisions once the metronome is on', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /^Reproducción/ }))
    expect(screen.queryByRole('group', { name: 'Subdivisión' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Click' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tresillos' }))
    expect(JSON.parse(localStorage.getItem('serendipia.settings.v2')!).subdivision).toBe(3)
  })
})
