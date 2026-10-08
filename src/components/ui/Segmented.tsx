import { useId } from 'react'

export interface Option<T extends string | number> {
  value: T
  label: string
  hint?: string
}

interface SegmentedProps<T extends string | number> {
  legend: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  columns?: number
  compact?: boolean
}

export function Segmented<T extends string | number>({
  legend,
  options,
  value,
  onChange,
  columns,
  compact = false,
}: SegmentedProps<T>) {
  const name = useId()

  return (
    <fieldset className="w-full">
      <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint mb-2.5">
        {legend}
      </legend>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
        role="radiogroup"
        aria-label={legend}
      >
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <label
              key={`${name}-${opt.value}`}
              className={[
                'relative cursor-pointer rounded-xl border transition-all duration-150 text-center',
                'focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2',
                compact ? 'px-2 py-2.5' : 'px-3 py-3.5',
                active
                  ? 'bg-accent-soft border-accent/60 text-text'
                  : 'bg-surface-2 border-border text-dim hover:border-border-strong hover:text-text',
              ].join(' ')}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={active}
                onChange={() => onChange(opt.value)}
              />
              <span className={`block font-semibold leading-tight ${compact ? 'text-sm' : 'text-[15px]'}`}>
                {opt.label}
              </span>
              {opt.hint && (
                <span className="block text-[11px] leading-tight mt-1 text-faint font-normal">
                  {opt.hint}
                </span>
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
