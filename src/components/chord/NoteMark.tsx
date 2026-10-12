import type { ReactNode } from 'react'
import type { NoteRole } from './roles'

const STAR = 'M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z'

/** The role glyph: root = 4-point star, third = filled circle, seventh = diamond, extension = ring, other = small dot. */
export function RoleGlyph({ role }: { role: NoteRole }) {
  switch (role) {
    case 'root':
      return <path d={STAR} className="cv-g-root" />
    case 'third':
      return <circle cx="12" cy="12" r="10" className="cv-g-third" />
    case 'seventh':
      return <path d="M12 1.5 L22.5 12 L12 22.5 L1.5 12Z" className="cv-g-seventh" />
    case 'extension':
      return (
        <>
          <circle cx="12" cy="12" r="10" className="cv-g-ext" />
          <circle cx="12" cy="12" r="6.2" className="cv-g-ext-in" />
        </>
      )
    default:
      return <circle cx="12" cy="12" r="8.5" className="cv-g-other" />
  }
}

/** A note mark with its name on top; `size` in px (CSS can override through --m). */
export function NoteMark({ role, children, className = '' }: { role: NoteRole; children?: ReactNode; className?: string }) {
  return (
    <span className={`cv-mark cv-mark--${role} ${className}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <RoleGlyph role={role} />
      </svg>
      {children !== undefined && <b className="cv-mark-name">{children}</b>}
    </span>
  )
}
