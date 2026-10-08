import { Icon } from './ui/Icon'

export type RevealPhase = 'waiting' | 'locked' | 'revealed'

interface GestureDisplayProps {
  playerLabel: string
  computerLabel: string
  playerNumber: number | null
  computerNumber: number | null
  phase: RevealPhase
  /** 0..1 lock progress shown while the gesture is stabilising. */
  progress: number
  confidence: number
  hint: string
}

function Side({
  label,
  number,
  active,
  revealed,
  accent,
}: {
  label: string
  number: number | null
  active: boolean
  revealed: boolean
  accent: boolean
}) {
  return (
    <div
      className={[
        'flex-1 rounded-2xl border px-4 py-4 text-center transition-all duration-300',
        accent
          ? 'bg-accent-soft border-accent/45'
          : revealed
            ? 'bg-surface-2 border-border-strong'
            : 'bg-surface-2 border-border',
        active ? 'ring-soft' : '',
      ].join(' ')}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-faint font-bold">{label}</p>
      <div className="mt-2 h-[76px] grid place-items-center">
        {number === null ? (
          <span
            className={[
              'text-5xl font-extrabold text-faint transition-all duration-300',
              active ? 'animate-bob' : '',
            ].join(' ')}
            aria-hidden
          >
            ?
          </span>
        ) : (
          <span
            key={number}
            className="text-[64px] leading-none font-extrabold tracking-tighter animate-pop tabular"
            style={{ color: accent ? 'var(--c-accent)' : 'var(--c-text)' }}
          >
            {number}
          </span>
        )}
      </div>
    </div>
  )
}

export function GestureDisplay({
  playerLabel,
  computerLabel,
  playerNumber,
  computerNumber,
  phase,
  progress,
  confidence,
  hint,
}: GestureDisplayProps) {
  const locked = phase !== 'waiting' && playerNumber !== null

  return (
    <div className="w-full">
      <div className="flex gap-3">
        <Side
          label={playerLabel}
          number={playerNumber}
          active={phase === 'waiting'}
          revealed={locked}
          accent={locked}
        />
        <Side
          label={computerLabel}
          number={computerNumber}
          active={false}
          revealed={computerNumber !== null}
          accent={false}
        />
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Gesture stability"
        />
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-2 min-h-[22px]">
        {phase === 'waiting' && (
          <span className="text-[13px] font-semibold text-dim">{hint}</span>
        )}
        {phase === 'locked' && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-accent animate-scale-in">
            <Icon name="check" size={14} strokeWidth={3} /> Locked
            {confidence > 0 && (
              <span className="text-faint font-medium tabular">
                · {Math.round(confidence * 100)}%
              </span>
            )}
          </span>
        )}
        {phase === 'revealed' && (
          <span className="text-[13px] font-semibold text-dim">
            {playerNumber === computerNumber ? 'Same number — out!' : 'Numbers differ — runs scored'}
          </span>
        )}
      </div>
    </div>
  )
}
