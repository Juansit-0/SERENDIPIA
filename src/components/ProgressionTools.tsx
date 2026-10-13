import { useEffect, useRef, useState } from 'react'
import { LATIN_SHARP, PITCH_SHARP } from '../music/notes'
import { exportLibrary } from '../state/library'
import { shortestShift } from '../state/progressionOps'
import { useStore } from '../state/store'
import { ArrowRightIcon, CloseIcon, MinusIcon, MoreIcon, PlusIcon } from './icons'
import { PrintSheet } from './print/PrintSheet'
import { useStrip } from './strip/useStrip'

type Panel = 'closed' | 'menu' | 'save' | 'library' | 'share' | 'transpose'

/** The ⋯ menu of the progression strip: clear, save, my progressions, share link. */
export function ProgressionTools({ onAnnounce }: { onAnnounce: (message: string) => void }) {
  const {
    progression,
    library,
    saveToLibrary,
    importLibrary,
    loadFromLibrary,
    deleteFromLibrary,
    clearProgression,
    shareLink,
    transposeProgression,
    keyRootPc,
    keyMode,
    notation,
    playing,
    t,
  } = useStore()
  const s = useStrip()
  const [panel, setPanel] = useState<Panel>('closed')
  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  // Deleting a saved progression takes a second tap, so a slip never loses one.
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [libraryNote, setLibraryNote] = useState('')
  const fileInput = useRef<HTMLInputElement | null>(null)
  // The sheet exists only while the print dialog is up (paper or «Guardar como PDF»).
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    if (!printing) return
    const done = () => setPrinting(false)
    window.addEventListener('afterprint', done)
    const frame = requestAnimationFrame(() => {
      try {
        window.print()
      } catch {
        done()
      }
    })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('afterprint', done)
    }
  }, [printing])

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

  const downloadBackup = () => {
    const blob = new Blob([exportLibrary(library)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `serendipia-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    onAnnounce(s('backupSaved'))
  }

  const readBackup = async (file: File) => {
    const result = importLibrary(await file.text())
    const note = !result
      ? s('backupInvalid')
      : result.added === 0
        ? s('backupNothing')
        : `${s('backupAdded')}: ${result.added}`
    setLibraryNote(note)
    onAnnounce(note)
  }

  const empty = progression.length === 0
  const keyName = (pc: number) => (notation === 'latin' ? LATIN_SHARP[pc] : notation === 'both' ? `${PITCH_SHARP[pc]} · ${LATIN_SHARP[pc]}` : PITCH_SHARP[pc])
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

      {printing && <PrintSheet />}

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
              <button type="button" className="cc-btn strip-menu__item" disabled={empty} onClick={() => setPanel('transpose')}>
                {s('transpose')}
              </button>
              <button
                type="button"
                className="cc-btn strip-menu__item"
                onClick={() => {
                  setLibraryNote('')
                  setPanel('library')
                }}
              >
                {s('mine')} ({library.length})
              </button>
              <button type="button" className="cc-btn strip-menu__item" disabled={empty} onClick={() => void share()}>
                {s('share')}
              </button>
              <button
                type="button"
                className="cc-btn strip-menu__item"
                disabled={empty}
                title={s('printHint')}
                onClick={() => {
                  close(true)
                  setPrinting(true)
                }}
              >
                {s('print')}
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
                  if (!saveToLibrary(name)) {
                    onAnnounce(s('libraryFull'))
                    setLibraryNote(s('libraryFull'))
                    setPanel('library')
                    return
                  }
                  setLibraryNote('')
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

          {panel === 'transpose' && (
            <>
              {heading(s('transpose'))}
              <div className="strip-transpose">
                <button
                  type="button"
                  className="cc-btn cc-btn--icon strip__btn"
                  aria-label={s('transposeDown')}
                  title={s('transposeDown')}
                  onClick={() => {
                    transposeProgression(-1)
                    onAnnounce(s('transposeDown'))
                  }}
                >
                  <MinusIcon size={16} />
                </button>
                <span className="strip-transpose__key">
                  <span className="strip__muted">{s('keyLine')}</span> {keyName(keyRootPc)} {keyMode === 'minor' ? s('minor') : s('major')}
                </span>
                <button
                  type="button"
                  className="cc-btn cc-btn--icon strip__btn"
                  aria-label={s('transposeUp')}
                  title={s('transposeUp')}
                  onClick={() => {
                    transposeProgression(1)
                    onAnnounce(s('transposeUp'))
                  }}
                >
                  <PlusIcon size={16} />
                </button>
              </div>
              <span className="cc-label strip-transpose__label">{s('transposeTo')}</span>
              <div className="cc-keygrid" role="group" aria-label={s('transposeTo')}>
                {PITCH_SHARP.map((name, pc) => (
                  <button
                    key={name}
                    type="button"
                    className="cc-btn"
                    aria-pressed={pc === keyRootPc}
                    aria-label={`${s('transposeTo')} ${name} / ${LATIN_SHARP[pc]}`}
                    onClick={() => {
                      transposeProgression(shortestShift(keyRootPc, pc))
                      onAnnounce(`${s('transposeTo')} ${keyName(pc)}`)
                    }}
                  >
                    <span aria-hidden="true">{notation === 'latin' ? LATIN_SHARP[pc] : name}</span>
                    {notation === 'both' && <small aria-hidden="true">{LATIN_SHARP[pc]}</small>}
                  </button>
                ))}
              </div>
              <p className="strip-menu__note">{s('transposeHint')}</p>
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
                        onClick={() => {
                          if (confirmId !== entry.id) {
                            setConfirmId(entry.id)
                            return
                          }
                          deleteFromLibrary(entry.id)
                          setConfirmId(null)
                          onAnnounce(`${s('removed')}: ${entry.name}`)
                        }}
                        onBlur={() => setConfirmId((current) => (current === entry.id ? null : current))}
                        aria-label={`${confirmId === entry.id ? s('removeConfirm') : t('library.delete')}: ${entry.name}`}
                      >
                        {confirmId === entry.id ? s('removeConfirm') : s('remove')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="strip-menu__backup">
                <button type="button" className="cc-btn cc-btn--ghost strip__btn" disabled={library.length === 0} onClick={downloadBackup} title={s('backupHint')}>
                  {s('backupExport')}
                </button>
                <button type="button" className="cc-btn cc-btn--ghost strip__btn" onClick={() => fileInput.current?.click()} title={s('backupHint')}>
                  {s('backupImport')}
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    event.currentTarget.value = ''
                    if (file) void readBackup(file)
                  }}
                />
              </div>
              {libraryNote && (
                <p className="strip-menu__note">
                  {libraryNote}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
