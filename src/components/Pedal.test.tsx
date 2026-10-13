// @vitest-environment jsdom
import { cleanup, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

afterEach(cleanup)

const heroName = () => document.querySelector('.cv-name')?.textContent

describe('pedal and arrow keys', () => {
  it('walk the progression chord by chord, wrapping around, and frame the current step', () => {
    renderApp()
    fireEvent.keyDown(document.body, { key: 'PageDown' })
    expect(heroName()).toBe('C')
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(heroName()).toBe('G')
    expect(document.querySelector('[data-step-index="1"]')?.classList.contains('is-cursor')).toBe(true)
    fireEvent.keyDown(document.body, { key: 'PageUp' })
    fireEvent.keyDown(document.body, { key: 'PageUp' })
    expect(heroName()).toBe('F')
  })

  it('leave text fields alone', () => {
    renderApp()
    const input = document.querySelector('input')!
    fireEvent.keyDown(input, { key: 'PageDown' })
    expect(document.querySelector('.is-cursor')).toBeNull()
  })
})
