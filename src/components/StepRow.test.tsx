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

describe('progression analysis', () => {
  it('marks each change and explains the latest one', () => {
    renderApp()
    const marks = screen.getAllByRole('button', { name: /^Cambio \d–\d:/ })
    expect(marks.map((mark) => mark.getAttribute('aria-label'))).toEqual([
      'Cambio 1–2: Semicadencia',
      'Cambio 2–3: Cadencia rota',
      'Cambio 3–4: Cambio suave',
    ])
    expect(screen.getByText(/^Am → F: comparten 2 notas/)).toBeTruthy()
    expect(screen.getByText('C mayor')).toBeTruthy()
    expect(screen.getByText('detectada')).toBeTruthy()
  })

  it('shows the picked change and roman numerals per step', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Cambio 2–3: Cadencia rota' }))
    expect(screen.getByText(/^G → Am: se espera la tónica/)).toBeTruthy()
    const romans = Array.from(document.querySelectorAll('[data-step-index]')).map(
      (step) => step.querySelector('.font-mono span')?.textContent,
    )
    expect(romans).toEqual(['I', 'V', 'vi', 'IV'])
  })

  it('suggests the next chord from the last chords of the progression', () => {
    renderApp()
    fireEvent.click(document.querySelector('[data-step-index="3"]')!)
    fireEvent.click(screen.getByRole('button', { name: 'Quitar paso' }))
    const firstGhost = document.querySelector('.cutline')
    expect(firstGhost?.textContent).toContain('F')
  })
})

describe('playability helpers', () => {
  it('chains a position onto every step', () => {
    renderApp()
    const voicingTags = () =>
      Array.from(document.querySelectorAll('[data-step-index]')).map(
        (step) => step.querySelectorAll('.font-mono')[1]?.textContent,
      )
    expect(voicingTags().every((tag) => tag === 'Auto')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /^Encadenar/ }))
    const tags = voicingTags()
    expect(tags.every((tag) => tag && tag !== 'Auto')).toBe(true)
    expect(tags[0]).toBe('x 3 2 0 1 0')
  })

  it('recommends and applies a capo for a barre-heavy progression', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Teoría' }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Tonalidad' }), { target: { value: '10' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Cargar' })[0])
    expect(stepNames()).toEqual(['Bb', 'F', 'Gm', 'Eb'])
    expect(screen.getByText('Capo recomendado')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(stepNames()).toEqual(['G', 'D', 'Em', 'C'])
    expect(screen.queryByText('Capo recomendado')).toBeNull()
  })
})
