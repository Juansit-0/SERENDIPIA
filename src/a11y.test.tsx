// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it } from 'vitest'
import { renderApp } from './test/renderApp'

afterEach(cleanup)

/** axe over the whole page; colour contrast needs real rendering, so it is checked in a browser instead. */
async function violations() {
  let result: axe.AxeResults | undefined
  await act(async () => {
    result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })
  })
  return result!.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

describe('accessibility (axe)', () => {
  it.each([
    ['Acorde', '', null],
    ['Teoría', '#theory', null],
    ['Teoría · Escalas', '#theory', 'Escalas'],
    ['Práctica', '#practice', null],
    ['Práctica · Oído', '#practice', 'Oído'],
    ['Práctica · Grabar', '#practice', 'Grabar'],
    ['Práctica · Progreso', '#practice', 'Progreso'],
  ])('%s has no violations', async (_, hash, tab) => {
    renderApp(hash)
    if (tab) fireEvent.click(screen.getByRole('button', { name: tab }))
    expect(await violations()).toEqual([])
  }, 20000)
})
