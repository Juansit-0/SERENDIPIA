import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'

const FOCUSABLE = 'button:not([disabled]), select, input, [href], [tabindex]:not([tabindex="-1"])'

interface PopoverProps {
  /** Accessible name of both the trigger (unless `triggerLabel` given) and the dialog. */
  label: string
  triggerLabel?: string
  trigger: ReactNode
  triggerClassName?: string
  align?: 'start' | 'end'
  children: (api: { close: () => void }) => ReactNode
}

/** Click-to-open panel: Escape / outside click / focus leaving close it; Escape returns focus to the trigger. */
export function Popover({ label, triggerLabel, trigger, triggerClassName = '', align = 'end', children }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()

  const close = useCallback(() => setOpen(false), [])
  const wasOpen = useRef(false)

  // After the panel unmounts with focus lost (Escape, a selection), hand focus back to the trigger.
  useEffect(() => {
    if (wasOpen.current && !open) {
      const active = document.activeElement
      if (!active || active === document.body) button.current?.focus()
    }
    wasOpen.current = open
  }, [open])

  useEffect(() => {
    if (!open) return
    const first = panel.current?.querySelector<HTMLElement>('[aria-pressed="true"], [aria-current="true"]') ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus({ preventScroll: true })
    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        close()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return (
    <div
      ref={wrap}
      className="cc-popwrap"
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null
        if (open && next && !event.currentTarget.contains(next)) setOpen(false)
      }}
    >
      <button
        ref={button}
        type="button"
        className={`cc-btn ${triggerClassName}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={triggerLabel ?? label}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger}
      </button>
      {open && (
        <div ref={panel} id={id} role="dialog" aria-label={label} className="cc-pop" data-align={align}>
          {children({ close })}
        </div>
      )}
    </div>
  )
}
