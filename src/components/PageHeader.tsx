import type { ReactNode } from 'react'
import { Icon } from './ui/Icon'

interface PageHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  right?: ReactNode
}

export function PageHeader({ title, subtitle, onBack, right }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 backdrop-blur-xl bg-bg/80 border-b border-border/70">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="shrink-0 size-10 grid place-items-center rounded-xl border border-border bg-surface-2 text-dim hover:text-text hover:border-border-strong transition-colors"
          >
            <Icon name="back" size={18} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-[11px] text-faint truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  )
}
