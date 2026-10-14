// @vitest-environment jsdom
import { cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { encodeSongLink, loadSongs, songId } from '../state/songs'
import { decodeShare } from '../state/share'
import { renderApp } from '../test/renderApp'

afterEach(cleanup)

const link = encodeSongLink({
  id: songId(),
  name: 'Para ti',
  savedAt: '',
  sections: [{ id: 'a', label: 'chorus', repeats: 2, source: 'Coro', progression: decodeShare('p=G_D_Em_C')! }],
})

describe('opening a song link', () => {
  it('adds the song, says so and cleans the address', () => {
    renderApp(`?song=${link}`)
    expect(loadSongs().map((song) => song.name)).toEqual(['Para ti'])
    expect(document.querySelector('.cc-notice')?.textContent).toContain('Canción añadida a ⋯ → Canciones: «Para ti»')
    expect(window.location.search).toBe('')
    // No welcome over a shared link.
    expect(document.querySelector('.welcome')).toBeNull()
  })
})
