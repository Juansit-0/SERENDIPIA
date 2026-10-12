import { useState } from 'react'
import { useStore } from '../state/store'

type Panel = 'none' | 'save' | 'library' | 'share'

export function ProgressionTools({ onAnnounce }: { onAnnounce: (message: string) => void }) {
  const { progression, library, saveToLibrary, loadFromLibrary, deleteFromLibrary, shareLink, notation, playing, t } =
    useStore()
  const [panel, setPanel] = useState<Panel>('none')
  const [name, setName] = useState('')
  const [link, setLink] = useState('')

  const toggle = (next: Panel) => setPanel((current) => (current === next ? 'none' : next))

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
    <div className="flex flex-col gap-2 border-t border-rule pt-2">
      <div className="flex flex-wrap items-center gap-1.5">
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
        <button type="button" className="stamp" disabled={progression.length === 0} onClick={() => void share()}>
          {t('share.copy')}
        </button>
      </div>

      {panel === 'save' && (
        <form
          className="flex flex-wrap items-center gap-2"
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
          <button type="button" className="stamp" onClick={() => setPanel('none')}>
            {t('library.cancel')}
          </button>
        </form>
      )}

      {panel === 'share' && link && (
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
      )}

      {panel === 'library' &&
        (library.length === 0 ? (
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
        ))}
    </div>
  )
}
