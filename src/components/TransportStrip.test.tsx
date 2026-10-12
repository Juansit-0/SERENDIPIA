// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

afterEach(cleanup)

describe('foldable transport on phones', () => {
  it('starts folded with a summary and opens on demand', () => {
    renderApp()
    const toggle = screen.getByRole('button', { name: /^Ajustes/ })
    const settings = document.getElementById('transport-settings')!
    const rhythm = document.getElementById('transport-rhythm')!
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(toggle.getAttribute('aria-controls')).toBe('transport-rhythm transport-settings')
    expect(settings.className).toMatch(/(^|\s)hidden(\s|$)/)
    expect(rhythm.className).toBe('hidden sm:contents')
    // Run and tempo stay in the folded strip.
    expect(screen.getByRole('button', { name: 'Correr' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Subir tempo' })).toBeTruthy()
    expect(screen.getByText('4/4 · loop')).toBeTruthy()

    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(settings.className).not.toMatch(/(^|\s)hidden(\s|$)/)
    expect(rhythm.className).toBe('contents')
    expect(localStorage.getItem('serendipia.transportOpen')).toBe('1')
  })
})
