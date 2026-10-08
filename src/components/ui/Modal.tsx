import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { HiX } from 'react-icons/hi'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Fenêtre modale accessible : focus piégé, Échap pour fermer, focus rendu à l'ouverture. */
export function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    // Premier champ de saisie sinon premier élément focusable (hors bouton Fermer).
    const initial =
      panel?.querySelector<HTMLElement>('[data-autofocus]') ??
      panel?.querySelector<HTMLElement>('textarea, input, select') ??
      focusables()[1] ??
      focusables()[0]
    initial?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      const first = items[0]
      const last = items.at(-1)
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-brand-900/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative w-full max-w-lg rounded-card bg-surface p-6 shadow-card dark:bg-navy-800"
      >
        <button
          type="button"
          aria-label="Fermer"
          className="absolute right-4 top-4 rounded-lg p-1 text-muted hover:text-brand-900 dark:hover:text-white"
          onClick={() => onCloseRef.current()}
        >
          <HiX className="h-5 w-5" />
        </button>
        <h2 id={titleId} className="pr-8 text-lg font-bold">
          {title}
        </h2>
        {description && (
          <div id={descriptionId} className="mt-1 text-sm text-muted">
            {description}
          </div>
        )}
        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
