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
  window.history.replaceState(null, '', `/${search}`)
  resetSongLinkForTests()
  return render(<App />)
}
