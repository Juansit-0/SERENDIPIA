// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { logPractice } from '../../music/history'
import { renderApp } from '../../test/renderApp'

afterEach(cleanup)

const openProgress = () => fireEvent.click(screen.getByRole('button', { name: 'Progreso' }))

describe('Práctica · Progreso', () => {
  it('invites to practise when there is nothing yet', () => {
    renderApp('#practice')
    openProgress()
    expect(screen.getByText(/Aún no hay práctica registrada/)).toBeTruthy()
  })

  it('shows the streak, minutes per day and each pair', () => {
    renderApp('#practice')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    logPractice({ seconds: 600, round: { pair: 'C↔G', score: 18 } }, yesterday)
    logPractice({ seconds: 300, round: { pair: 'C↔G', score: 24 } }, today)
    logPractice({ seconds: 20, ear: { right: true } }, today)
    openProgress()
    expect(screen.getByText('Racha').parentElement?.textContent).toContain('2 días')
    expect(document.querySelectorAll('.pg-bar')).toHaveLength(2)
    expect(screen.getByText('C ↔ G')).toBeTruthy()
    expect(document.querySelector('.pg-pair__nums')?.textContent).toContain('24 última · 24 mejor')
    expect(screen.getByRole('table', { name: 'Minutos practicados por día' }).querySelectorAll('tbody tr')).toHaveLength(28)
    expect([...document.querySelectorAll('.pg-tile')].at(-1)?.textContent).toContain('100%')
  })
})
