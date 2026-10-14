// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

afterEach(cleanup)

describe('«Mi patrón»', () => {
  it('is written slot by slot, kept in the settings and named in the pattern list', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /^Reproducción/ }))
    fireEvent.change(screen.getByLabelText('Ritmo'), { target: { value: 'custom' } })
    const editor = screen.getByRole('group', { name: 'Mi patrón' })
    // The second eighth («y» of 1) starts as a rest: tap once → down, again → up.
    const slot = within(editor).getAllByRole('button')[1]
    expect(slot.getAttribute('aria-label')).toBe('Corchea y: silencio')
    fireEvent.click(slot)
    fireEvent.click(within(editor).getAllByRole('button')[1])
    expect(within(editor).getAllByRole('button')[1].getAttribute('aria-label')).toBe('Corchea y: arriba')
    expect(JSON.parse(localStorage.getItem('serendipia.settings.v2')!).customStrum).toBe('DUDU.UDU')
    expect(screen.getByRole('option', { name: /Mi patrón ↓↑↓↑·↑↓↑/ })).toBeTruthy()
  })
})
