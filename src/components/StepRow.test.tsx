// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

afterEach(cleanup)

const stepNames = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-step-index]')).map(
    (step) => step.querySelector('.fv-ui')?.textContent,
  )

describe('progression reordering without drag and drop', () => {
  it('moves a step with the picker buttons and announces it', () => {
    renderApp()
    expect(stepNames()).toEqual(['C', 'G', 'Am', 'F'])
    fireEvent.click(document.querySelector('[data-step-index="0"]')!)
    fireEvent.click(screen.getByRole('button', { name: 'Mover el paso a la derecha' }))
    expect(stepNames()).toEqual(['G', 'C', 'Am', 'F'])
    expect(screen.getByRole('status').textContent).toMatch(/^C: Paso en la posición 2/)
    expect(screen.getByRole('button', { name: 'Mover el paso a la izquierda' })).toHaveProperty('disabled', false)
  })

  it('moves a step with Alt+arrow and keeps focus on it', () => {
    renderApp()
    const first = document.querySelector<HTMLElement>('[data-step-index="0"]')!
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight', altKey: true })
    expect(stepNames()).toEqual(['G', 'C', 'Am', 'F'])
    expect(document.activeElement?.getAttribute('data-step-index')).toBe('1')
  })
})

describe('document language', () => {
  it('follows the interface language', () => {
    renderApp()
    expect(document.documentElement.lang).toBe('es')
    fireEvent.click(screen.getByRole('button', { name: /idioma/i }))
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toMatch(/chords/)
  })
})
