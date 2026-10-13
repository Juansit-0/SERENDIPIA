import { Component, type ErrorInfo, type ReactNode } from 'react'
import { loadSettings } from '../state/settings'

/** Settings and view state that could keep the app crashing; the library and practice records are kept. */
const RESETTABLE_KEYS = ['serendipia.settings.v2', 'serendipia.settings.v1', 'serendipia.transportOpen', 'serendipia.session.v1']

const TEXT = {
  es: {
    title: 'Algo salió mal',
    body: 'SERENDIPIA encontró un error y no pudo seguir. Tus progresiones guardadas están a salvo.',
    reload: 'Recargar',
    reset: 'Restablecer ajustes y recargar',
    resetHint: 'Vuelve a los ajustes por defecto; no borra tu biblioteca ni tus récords.',
    details: 'Detalles técnicos',
  },
  en: {
    title: 'Something went wrong',
    body: 'SERENDIPIA hit an error and could not continue. Your saved progressions are safe.',
    reload: 'Reload',
    reset: 'Reset settings and reload',
    resetHint: 'Goes back to the default settings; your library and records are kept.',
    details: 'Technical details',
  },
}

/** Instead of a blank page, an error shows a calm way back (reload, or reset settings). */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SERENDIPIA crashed:', error, info.componentStack)
  }

  private resetAndReload = () => {
    try {
      for (const key of RESETTABLE_KEYS) localStorage.removeItem(key)
    } catch {
      // storage unavailable: a plain reload is all we can do
    }
    window.location.reload()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const text = TEXT[loadSettings().lang] ?? TEXT.es
    return (
      <div className="cc-ground grid min-h-dvh place-items-center p-6" role="alert">
        <section className="cc-module flex max-w-[34rem] flex-col gap-4 p-6">
          <h1 className="font-display text-[2.25rem] leading-none text-accent-deep">{text.title}</h1>
          <p className="font-serif text-[1.125rem] leading-snug text-ink-soft">{text.body}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="cc-btn cc-btn--primary cc-btn--lg" onClick={() => window.location.reload()}>
              {text.reload}
            </button>
            <button type="button" className="cc-btn cc-btn--lg" onClick={this.resetAndReload} title={text.resetHint}>
              {text.reset}
            </button>
          </div>
          <p className="text-[0.8125rem] text-ink-faint">{text.resetHint}</p>
          <details className="text-[0.8125rem] text-ink-faint">
            <summary className="cursor-pointer">{text.details}</summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap">{error.message}</pre>
          </details>
        </section>
      </div>
    )
  }
}
