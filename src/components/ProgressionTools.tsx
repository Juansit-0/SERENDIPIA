import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { ArrowRightIcon, CloseIcon, MoreIcon } from './icons'
import { useStrip } from './strip/useStrip'

type Panel = 'closed' | 'menu' | 'save' | 'library' | 'share'

/** The ⋯ menu of the progression strip: clear, save, my progressions, share link. */
export function ProgressionTools({ onAnnounce }: { onAnnounce: (message: string) => void }) {
  const {
    progression,
    library,
    saveToLibrary,
    loadFromLibrary,
    deleteFromLibrary,
    clearProgression,
    shareLink,
    notation,
    playing,
    t,
  } = useStore()
  const s = useStrip()
  const [panel, setPanel] = useState<Panel>('closed')
  const [name, setName] = useState('')
  const [link, setLink] = useState('')

  const root = useRef<HTMLDivElement | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const close = (restoreFocus = false) => {
    setPanel('closed')
    if (restoreFocus) trigger.current?.focus()
  }

  // Any open panel closes with Escape or a press outside the menu.
  useEffect(() => {
    if (panel === 'closed') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPanel('closed')
        trigger.current?.focus()
      }
    }
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setPanel('closed')
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [panel])

  // Land on the first enabled item when the menu opens.
  useEffect(() => {
    if (panel === 'menu') root.current?.querySelector<HTMLButtonElement>('.strip-menu__item:not(:disabled)')?.focus()
  }, [panel])

  const share = async () => {
    const url = shareLink()
    setLink(url)
    try {
      await navigator.clipboard.writeText(url)
      onAnnounce(t('share.copied'))
    } catch {
      // No clipboard access (e.g. insecure context): show the link to copy by hand.
    }
    setPanel('share')
  }

  const empty = progression.length === 0
  const heading = (title: string) => (
    <div className="strip-menu__head">
      <button type="button" className="cc-btn cc-btn--icon cc-btn--ghost strip__btn" onClick={() => setPanel('menu')} aria-label={s('back')} title={s('back')}>
        <ArrowRightIcon size={16} style={{ transform: 'scaleX(-1)' }} />
      </button>
      <span className="cc-label">{title}</span>
      <button type="button" className="cc-btn cc-btn--icon cc-btn--ghost strip__btn ml-auto" onClick={() => close(true)} aria-label={t('voicing.close')}>
        <CloseIcon size={16} />
      </button>
    </div>
  )

  return (
    <div ref={root} className="strip-tools">
      <button
        ref={trigger}
        type="button"
        className="cc-btn cc-btn--icon strip__btn"
        aria-label={s('more')}
        title={s('more')}
        aria-haspopup="true"
        aria-expanded={panel !== 'closed'}
        onClick={() => (panel === 'closed' ? setPanel('menu') : close())}
      >
        <MoreIcon size={18} />
      </button>

      {panel !== 'closed' && (
        <div className="cc-pop strip-menu" role="group" aria-label={s('more')}>
          {panel === 'menu' && (
            <div className="strip-menu__list">
              <button
                type="button"
                className="cc-btn strip-menu__item"
                disabled={empty}
                onClick={() => {
                  clearProgression()
                  onAnnounce(s('cleared'))
                  close(true)
                }}
              >
                {s('clearAll')}
              </button>
              <button type="button" className="cc-btn strip-menu__item" disabled={empty} onClick={() => setPanel('save')}>
                {s('save')}
              </button>
              <button type="button" className="cc-btn strip-menu__item" onClick={() => setPanel('library')}>
                {s('mine')} ({library.length})
              </button>
              <button type="button" className="cc-btn strip-menu__item" disabled={empty} onClick={() => void share()}>
                {s('share')}
              </button>
            </div>
          )}

          {panel === 'save' && (
            <>
              {heading(s('save'))}
              <form
                className="strip-menu__form"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!name.trim()) return
                  saveToLibrary(name)
                  onAnnounce(t('library.saved'))
                  setName('')
                  setPanel('library')
                }}
              >
                <label className="sr-only" htmlFor="library-name">
                  {t('library.name')}
                </label>
                <input
                  id="library-name"
                  className="strip-field"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t('library.namePlaceholder')}
                  maxLength={60}
                  autoComplete="off"
                  autoFocus
                />
                <button type="submit" className="cc-btn cc-btn--primary strip__btn" disabled={!name.trim()}>
                  {t('library.save')}
                </button>
              </form>
            </>
          )}

          {panel === 'share' && (
            <>
              {heading(s('share'))}
              <div className="strip-menu__form strip-menu__form--col">
                <label className="strip__muted" htmlFor="share-link">
                  {t('share.manual')}
                </label>
                <input
                  id="share-link"
                  className="strip-field"
                  value={link}
                  readOnly
                  onFocus={(event) => event.currentTarget.select()}
                />
              </div>
            </>
          )}

          {panel === 'library' && (
            <>
              {heading(s('mine'))}
              {library.length === 0 ? (
                <p className="strip-menu__empty">{t('library.empty')}</p>
              ) : (
                <ul className="strip-menu__library">
                  {library.map((entry) => (
                    <li key={entry.id}>
                      <div className="min-w-0">
                        <span className="strip-menu__name">{entry.name}</span>
                        <span className="strip-menu__steps">
                          {entry.progression.steps.map((step) => (notation === 'latin' ? step.latin : step.anglo)).join(' · ')}
                          {entry.progression.tempo ? ` · ${entry.progression.tempo} bpm` : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="cc-btn strip__btn"
                        disabled={playing}
                        onClick={() => {
                          loadFromLibrary(entry)
                          onAnnounce(`${t('library.loaded')}: ${entry.name}`)
                        }}
                      >
                        {s('open')}
                      </button>
                      <button
                        type="button"
                        className="cc-btn cc-btn--ghost strip__btn"
                        onClick={() => deleteFromLibrary(entry.id)}
                        aria-label={`${t('library.delete')}: ${entry.name}`}
                      >
                        {s('remove')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
