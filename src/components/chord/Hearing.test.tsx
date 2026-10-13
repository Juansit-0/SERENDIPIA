// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectFromMidi, type DetectionCandidate } from '../../music/detectChord'
import { renderApp } from '../../test/renderApp'

// The microphone is stood in for: the test decides what the guitar «plays».
const ear: { onChord: ((candidate: DetectionCandidate) => void) | null } = { onChord: null }
const G = detectFromMidi([43, 47, 50, 55, 59, 67]).candidates[0]
vi.mock('../../audio/useChordListener', () => ({
  useChordListener: (onChord: (candidate: DetectionCandidate) => void) => {
    ear.onChord = onChord
    return { status: 'listening', heard: { candidate: G, alternatives: [], confidence: 0.9 }, start: async () => undefined, stop: () => undefined }
  },
}))

afterEach(cleanup)

const heroName = () => document.querySelector('.cv-name')?.textContent
const stepNames = () => Array.from(document.querySelectorAll('[data-step-index] .strip-name')).map((node) => node.textContent)

describe('Oír', () => {
  it('shows what it hears, follows it and adds it to the progression', () => {
    renderApp()
    expect(screen.getByText('Oigo').textContent).toContain('G')
    act(() => ear.onChord!(detectFromMidi([45, 52, 57, 60, 64]).candidates[0]))
    expect(heroName()).toBe('Am')
    fireEvent.click(screen.getByRole('button', { name: 'Añadir el acorde que oigo a la progresión' }))
    expect(stepNames().at(-1)).toBe('G')
  })

  it('with a capo, the chord heard becomes the shape to play', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /Subir capo|cejilla/i }))
    fireEvent.click(screen.getByRole('button', { name: /Subir capo|cejilla/i }))
    // D sounds with the capo at 2 when playing a C shape.
    act(() => ear.onChord!(detectFromMidi([50, 57, 62, 66]).candidates[0]))
    expect(heroName()).toBe('C')
  })
})
