import { createElement, lazy, type ComponentType } from 'react'

/**
 * A view that loads with its own code and styles the first time it is opened. Once loaded it renders at once (no
 * Suspense flash when coming back to it), and `preload` fetches it ahead of time.
 */
function lazyView<M>(load: () => Promise<M>, pick: (module: M) => ComponentType): ComponentType & { preload: () => Promise<unknown> } {
  let loaded: ComponentType | null = null
  let pending: Promise<ComponentType> | null = null
  const preload = () => (pending ??= load().then((module) => (loaded = pick(module))))
  const Lazy = lazy(() => preload().then((component) => ({ default: component })))
  const View = () => (loaded ? createElement(loaded) : createElement(Lazy))
  return Object.assign(View, { preload })
}

export const TheoryView = lazyView(() => import('./TheoryView'), (module) => module.TheoryView)
export const SongbookView = lazyView(() => import('./SongbookView'), (module) => module.SongbookView)
export const TunerView = lazyView(() => import('./TunerView'), (module) => module.TunerView)
export const Welcome = lazyView(() => import('../welcome/Welcome'), (module) => module.Welcome)

/** Everything the first screen does not need, fetched while the browser is idle so any tab opens instantly. */
export function preloadViews(): Promise<unknown> {
  return Promise.all([TheoryView.preload(), SongbookView.preload(), TunerView.preload(), Welcome.preload()])
}
