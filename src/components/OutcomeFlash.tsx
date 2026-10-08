import { useEffect, useRef } from 'react'
import type { BallEvent } from '../game/types'

interface OutcomeFlashProps {
  event: BallEvent | null
  duration?: number
  onDone: () => void
}

const STYLES: Record<
  string,
  { title: string; sub: string; color: string; glow: string; size: string }
> = {
  dot: { title: 'DOT', sub: 'No run', color: 'var(--c-dim)', glow: 'rgba(150,160,180,0.2)', size: 'clamp(3rem,14vw,6rem)' },
  runs: { title: '+N', sub: 'RUNS', color: 'var(--c-text)', glow: 'rgba(255,255,255,0.16)', size: 'clamp(3.4rem,15vw,6.5rem)' },
  four: { title: 'FOUR!', sub: '+4 RUNS', color: 'var(--c-warn)', glow: 'rgba(255,176,32,0.35)', size: 'clamp(3.6rem,17vw,7.5rem)' },
  six: { title: 'SIX!', sub: '+6 RUNS', color: 'var(--c-accent)', glow: 'rgba(212,244,60,0.38)', size: 'clamp(4rem,19vw,8.5rem)' },
  out: { title: 'OUT!', sub: 'Wicket', color: 'var(--c-danger)', glow: 'rgba(255,91,91,0.35)', size: 'clamp(4rem,19vw,8.5rem)' },
}

export function OutcomeFlash({ event, duration = 1150, onDone }: OutcomeFlashProps) {
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  }, [onDone])

  // Keyed only on the event so parent re-renders never restart the timer.
  useEffect(() => {
    if (!event) return
    const t = window.setTimeout(() => doneRef.current(), duration)
    return () => window.clearTimeout(t)
  }, [event, duration])

  if (!event) return null

  const style = STYLES[event.outcome] ?? STYLES.runs
  const title = event.outcome === 'runs' ? `+${event.runs}` : style.title
  const sub = event.outcome === 'runs' ? (event.runs === 1 ? 'RUN' : 'RUNS') : style.sub

  return (
    <div
      className="absolute inset-0 z-30 grid place-items-center pointer-events-none"
      role="status"
      aria-live="assertive"
      aria-label={`${title} ${sub}`}
    >
      <div
        className="absolute inset-0 backdrop-blur-[3px]"
        style={{ background: `radial-gradient(closest-side, ${style.glow}, transparent 75%)` }}
      />
      <div key={event.id} className="relative text-center animate-rise">
        <span
          className="block font-extrabold tracking-tighter leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          style={{ color: style.color, fontSize: style.size }}
        >
          {title}
        </span>
        <span className="mt-2 inline-block rounded-full bg-black/55 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-white/90">
          {sub}
        </span>
        <span className="mt-3 block text-xs font-semibold text-white/60 tabular">
          You {event.batterNumber} · Opponent {event.bowlerNumber}
        </span>
      </div>
    </div>
  )
}
