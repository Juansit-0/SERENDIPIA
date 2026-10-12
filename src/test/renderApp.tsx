import { render } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../App'

vi.mock('../audio/loader', () => ({
  loadAudioEngine: () => new Promise(() => undefined),
  loadedAudioEngine: () => null,
  prefetchAudioEngine: () => undefined,
}))

export function renderApp() {
  localStorage.clear()
  window.location.hash = ''
  return render(<App />)
}
