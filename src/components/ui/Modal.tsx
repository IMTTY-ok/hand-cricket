import { useEffect, type ReactNode } from 'react'
import { Icon } from './Icon'

interface ModalProps {
  open: boolean
  onClose?: () => void
  title?: string
  children: ReactNode
  /** Disable the backdrop/escape dismiss for flows that must be completed. */
  dismissable?: boolean
  maxWidth?: string
}

export function Modal({
  open,
  onClose,
  title,
  children,
  dismissable = true,
  maxWidth = 'min(92vw, 26rem)',
}: ModalProps) {
  useEffect(() => {
    if (!open || !dismissable) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismissable, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Dialog'}
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
        tabIndex={dismissable ? 0 : -1}
      />
      <div
        className="relative w-full card p-6 sm:p-7 animate-fade-up shadow-pop"
        style={{ maxWidth }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          {title && <h2 className="text-xl font-bold tracking-tight">{title}</h2>}
          {dismissable && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 size-9 -mt-1 -mr-1 grid place-items-center rounded-xl text-dim hover:text-text hover:bg-surface-2 transition-colors"
            >
              <Icon name="close" size={18} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
