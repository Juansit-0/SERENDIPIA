// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('kaboom')
}

describe('ErrorBoundary', () => {
  const reload = vi.fn()
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, writable: true })
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    reload.mockReset()
  })

  it('renders its children when nothing fails', () => {
    render(
      <ErrorBoundary>
        <p>todo bien</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('todo bien')).toBeTruthy()
  })

  it('shows a way back instead of a blank page', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Algo salió mal' })).toBeTruthy()
    expect(screen.getByText('kaboom')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Recargar' }))
    expect(reload).toHaveBeenCalledOnce()
  })

  it('resets settings but keeps the library and records', () => {
    localStorage.setItem('serendipia.settings.v2', '{"lang":"es"}')
    localStorage.setItem('serendipia.library.v1', '[]')
    localStorage.setItem('serendipia.practice.v1', '{}')
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer ajustes y recargar' }))
    expect(localStorage.getItem('serendipia.settings.v2')).toBeNull()
    expect(localStorage.getItem('serendipia.library.v1')).toBe('[]')
    expect(localStorage.getItem('serendipia.practice.v1')).toBe('{}')
    expect(reload).toHaveBeenCalledOnce()
  })

  it('speaks English when that is the saved language', () => {
    localStorage.setItem('serendipia.settings.v2', '{"lang":"en"}')
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeTruthy()
  })
})
