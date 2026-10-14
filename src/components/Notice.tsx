import { dismissNotice, useNotice } from '../state/notice'
import { useStore } from '../state/store'
import { CloseIcon } from './icons'

/** The floating notice: one line, a close button, gone after a few seconds. */
export function Notice() {
  const notice = useNotice()
  const { lang } = useStore()
  if (!notice) return null
  return (
    <div key={notice.id} className="cc-notice" role="status">
      <span>{notice.text}</span>
      <button type="button" className="cc-btn cc-btn--icon cc-btn--ghost" onClick={dismissNotice} aria-label={lang === 'es' ? 'Cerrar aviso' : 'Close notice'}>
        <CloseIcon size={14} />
      </button>
    </div>
  )
}
