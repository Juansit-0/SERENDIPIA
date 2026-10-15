import { useEffect, useRef } from 'react'
import { CHANGELOG, helpText, type HelpSectionId } from '../i18n/help'
import { closeHelp, openHelp, useHelp } from '../state/help'
import { useStore } from '../state/store'
import { CloseIcon } from './icons'
import '../styles/help.css'

const REPO = 'https://github.com/Juansit-0/SERENDIPIA'

/** «¿Cómo se usa?»: one topic at a time, with the shortcuts, what is new and what the app is. */
export function HelpDialog() {
  const section = useHelp()
  const { lang } = useStore()
  const x = helpText[lang]
  const panel = useRef<HTMLDivElement | null>(null)
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!section) return
    if (!returnTo.current) returnTo.current = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('[aria-current="true"]')?.focus()
  }, [section])

  useEffect(() => {
    if (section) return
    returnTo.current?.focus?.()
    returnTo.current = null
  }, [section])

  if (!section) return null
  const current = x.sections.find((item) => item.id === section) ?? x.sections[0]

  return (
    <div
      className="help"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) closeHelp()
      }}
    >
      <div
        ref={panel}
        className="cc-module help__panel"
        role="dialog"
        aria-modal="true"
        aria-label={x.title}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            closeHelp()
          }
          if (event.key === 'Tab' && panel.current) {
            const focusable = [...panel.current.querySelectorAll<HTMLElement>('button, a[href]')]
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault()
              last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault()
              first.focus()
            }
          }
        }}
      >
        <div className="help__head">
          <h2>{x.title}</h2>
          <button type="button" className="cc-btn cc-btn--icon cc-btn--ghost" aria-label={x.close} onClick={closeHelp}>
            <CloseIcon size={16} />
          </button>
        </div>
        <nav className="help__nav" aria-label={x.nav}>
          {x.sections.map((item) => (
            <button key={item.id} type="button" aria-current={item.id === current.id ? 'true' : undefined} onClick={() => openHelp(item.id as HelpSectionId)}>
              {item.title}
            </button>
          ))}
        </nav>
        <section className="help__body" aria-live="polite">
          <h3>{current.title}</h3>
          {current.id === 'news' ? (
            <dl className="help__news">
              {CHANGELOG.map((entry) => (
                <div key={entry.version}>
                  <dt className="cc-num">{entry.version}</dt>
                  <dd>
                    <ul>
                      {entry[lang].map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <ul className={current.id === 'keys' ? 'help__keys' : undefined}>
              {current.items.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {current.id === 'about' && (
            <p className="help__links">
              <a href={REPO} target="_blank" rel="noopener noreferrer">
                github.com/Juansit-0/SERENDIPIA
              </a>{' '}
              · <span className="cc-num">v{__APP_VERSION__}</span>
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
