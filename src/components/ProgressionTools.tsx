import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useStore } from '../state/store'

type Panel = 'none' | 'save' | 'library' | 'share'

export function ProgressionTools({ onAnnounce }: { onAnnounce: (message: string) => void }) {
  const { progression, library, saveToLibrary, loadFromLibrary, deleteFromLibrary, shareLink, notation, playing, t } =
    useStore()
  const [panel, setPanel] = useState<Panel>('none')
  const [name, setName] = useState('')
  const [link, setLink] = useState('')

  const root = useRef<HTMLDivElement | null>(null)
  const toggle = (next: Panel) => setPanel((current) => (current === next ? 'none' : next))
  const close = () => setPanel('none')

  // Any open panel closes with Escape or a press outside the tools.
  useEffect(() => {
    if (panel === 'none') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanel('none')
    }
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setPanel('none')
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [panel])

  const share = async () => {
    const url = shareLink()
    setLink(url)
    try {
      await navigator.clipboard.writeText(url)
      onAnnounce(t('share.copied'))
      setPanel('share')
    } catch {
      // No clipboard access (e.g. insecure context): show the link to copy by hand.
      setPanel('share')
    }
  }

  return (
    // On `desk` the buttons sit in the strip's header row and the panels float above the strip.
    <div ref={root} className="flex flex-col gap-2 border-t border-rule pt-2 desk:relative desk:col-start-2 desk:row-start-1 desk:border-0 desk:pt-0">
      <div className="flex flex-wrap items-center gap-1.5 desk:flex-nowrap desk:gap-1">
        <button
          type="button"
          className="stamp"
          aria-expanded={panel === 'save'}
          disabled={progression.length === 0}
          onClick={() => toggle('save')}
        >
          {t('library.save')}
        </button>
        <button type="button" className="stamp" aria-expanded={panel === 'library'} onClick={() => toggle('library')}>
          {t('library.open')} ({library.length})
        </button>
        <button
          type="button"
          className="stamp"
          aria-expanded={panel === 'share'}
          disabled={progression.length === 0}
          onClick={() => (panel === 'share' ? close() : void share())}
        >
          {t('share.copy')}
        </button>
      </div>

      {panel === 'save' && (
        <PanelFrame width="desk:w-[27rem]" closeLabel={t('voicing.close')} onClose={close}>
        <form
          className="flex flex-wrap items-center gap-2 desk:flex-nowrap"
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
            className="field max-w-[16rem] text-[1rem]"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('library.namePlaceholder')}
            maxLength={60}
            autoComplete="off"
            autoFocus
          />
          <button type="submit" className="stamp stamp--ink" disabled={!name.trim()}>
            {t('library.save')}
          </button>
          <button type="button" className="stamp" onClick={close}>
            {t('library.cancel')}
          </button>
        </form>
        </PanelFrame>
      )}

      {panel === 'share' && link && (
        <PanelFrame width="desk:w-[32rem]" closeLabel={t('voicing.close')} onClose={close}>
        <div className="flex flex-col gap-1">
          <label className="label-ink text-blue-ink" htmlFor="share-link">
            {t('share.manual')}
          </label>
          <input
            id="share-link"
            className="field readout text-[0.8125rem]"
            value={link}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
        </PanelFrame>
      )}

      {panel === 'library' && (
        <PanelFrame width="desk:w-[30rem]" closeLabel={t('voicing.close')} onClose={close}>
        {library.length === 0 ? (
          <p className="text-[12px] text-ink-soft">{t('library.empty')}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {library.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="fv-ui truncate text-[0.9375rem] font-semibold">{entry.name}</span>
                  <span className="readout truncate text-[10px] text-ink-soft">
                    {entry.progression.steps.map((step) => (notation === 'latin' ? step.latin : step.anglo)).join(' · ')}
                    {entry.progression.tempo ? ` · ${entry.progression.tempo} bpm` : ''}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className="stamp"
                    disabled={playing}
                    onClick={() => {
                      loadFromLibrary(entry)
                      onAnnounce(`${t('library.loaded')}: ${entry.name}`)
                    }}
                  >
                    {t('library.load')}
                  </button>
                  <button
                    type="button"
                    className="stamp"
                    onClick={() => deleteFromLibrary(entry.id)}
                    aria-label={`${t('library.delete')}: ${entry.name}`}
                  >
                    {t('library.delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        </PanelFrame>
      )}
    </div>
  )
}

// Inline on small screens; on `desk` a popover floating above the strip, with its own close stamp.
function PanelFrame({
  width,
  closeLabel,
  onClose,
  children,
}: {
  width: string
  closeLabel: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className={`desk-pop flex items-start gap-2 desk:right-0 desk:bottom-full desk:mb-3 ${width}`}>
      <div className="min-w-0 flex-1">{children}</div>
      <button type="button" className="stamp shrink-0 px-2 py-0.5" onClick={onClose} aria-label={closeLabel}>
        ×
      </button>
    </div>
  )
}
