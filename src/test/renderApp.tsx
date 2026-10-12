import { render } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../App'

vi.mock('../audio/loader', () => ({
  loadAudioEngine: () => new Promise(() => undefined),
  loadedAudioEngine: () => null,
  prefetchAudioEngine: () => undefined,
}))

export function renderApp(search = '') {
  localStorage.clear()
  window.history.replaceState(null, '', `/${search}`)
  return render(<App />)
}
