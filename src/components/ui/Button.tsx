import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { sound } from '../../utils/sound'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  block?: boolean
  children: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent font-semibold shadow-[0_10px_30px_-12px_rgba(212,244,60,0.6)] hover:brightness-105 active:translate-y-px',
  secondary:
    'bg-surface-2 text-text border border-border hover:bg-surface-3 hover:border-border-strong active:translate-y-px',
  ghost: 'bg-transparent text-dim hover:text-text hover:bg-surface-2 active:translate-y-px',
  danger: 'bg-danger text-white font-semibold hover:brightness-110 active:translate-y-px',
  quiet: 'bg-accent-soft text-accent border border-accent/25 hover:bg-accent/20 active:translate-y-px',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-xl gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-14 px-7 text-base rounded-2xl gap-2.5',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  block = false,
  className = '',
  disabled,
  onClick,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={(e) => {
        if (!disabled && !loading) sound.play('tap')
        onClick?.(e)
      }}
      className={[
        'inline-flex items-center justify-center select-none transition-all duration-150',
        'disabled:opacity-45 disabled:pointer-events-none',
        'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
        VARIANTS[variant],
        SIZES[size],
        block ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
