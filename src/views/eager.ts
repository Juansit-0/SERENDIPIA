// Tests only (aliased for `./views/lazy` in vite.config.ts): the same views, imported directly, so a click on a
// tab shows the view at once and each test's module mocks apply to them as usual.
export { TheoryView } from './TheoryView'
export { SongbookView } from './SongbookView'
export { TunerView } from './TunerView'
export { Welcome } from '../welcome/Welcome'

export function preloadViews(): Promise<unknown> {
  return Promise.resolve()
}
