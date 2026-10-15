import { render } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../App'
import { resetSongLinkForTests } from '../state/store'

vi.mock('../audio/loader', () => ({
  loadAudioEngine: () => new Promise(() => undefined),
  loadedAudioEngine: () => null,
  prefetchAudioEngine: () => undefined,
}))

export function renderApp(search = '') {
  localStorage.clear()
  localStorage.setItem('serendipia.welcome.v1', 'seen')
  // «Novedades» stays quiet unless a test asks for it.
  localStorage.setItem('serendipia.seen.v1', __APP_VERSION__)
  window.history.replaceState(null, '', `/${search}`)
  resetSongLinkForTests()
  return render(<App />)
}
