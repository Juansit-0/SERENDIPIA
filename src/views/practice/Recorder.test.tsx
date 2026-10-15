// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '../../test/renderApp'

// A microphone that records a few bytes.
const cancel = vi.fn()
vi.mock('../../audio/recorder', () => ({
  recordingSupported: () => true,
  startRecording: async () => ({ mime: 'audio/webm', stop: async () => new Blob(['guitar'], { type: 'audio/webm' }), cancel }),
}))

afterEach(cleanup)

describe('Práctica · Grabar', () => {
  it('records over the progression and keeps the take', async () => {
    renderApp('#practice')
    fireEvent.click(screen.getAllByRole('button', { name: 'Más' }).at(-1)!)
    fireEvent.click(screen.getByRole('button', { name: 'Grabar' }))
    expect(screen.getByText(/Aún no hay tomas/)).toBeTruthy()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Empezar a grabar' }))
    })
    expect(screen.getByRole('button', { name: /Parar y guardar/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('Grabando')).toBeTruthy()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Parar y guardar/ }))
    })
    expect(await screen.findByText('C · G · Am · F · 92 bpm')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Escuchar/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Con la banda' })).toBeTruthy()
  }, 20000)
})
