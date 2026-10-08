import { useEffect, useState } from 'react'
import { sound } from '../utils/sound'

interface CountdownProps {
  /** Sequence length before "PLAY!". */
  steps?: number
  onDone: () => void
}

export function Countdown({ steps = 3, onDone }: CountdownProps) {
  const [index, setIndex] = useState(0)
  const sequence = [...Array.from({ length: steps }, (_, i) => String(steps - i)), 'PLAY!']

  useEffect(() => {
    const current = sequence[index]
    if (current === 'PLAY!') sound.play('go')
    else sound.play('countdown')

    if (index >= sequence.length - 1) {
      const t = window.setTimeout(onDone, 700)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setIndex((i) => i + 1), 850)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const label = sequence[Math.min(index, sequence.length - 1)]
  const isGo = label === 'PLAY!'

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-bg/92 backdrop-blur-md"
      role="status"
      aria-live="assertive"
      aria-label={`Countdown: ${label}`}
    >
      <div key={index} className="text-center animate-countdown">
        <span
          className={[
            'block font-extrabold tracking-tighter leading-none',
            isGo ? 'text-accent text-[clamp(3rem,16vw,7rem)]' : 'text-text text-[clamp(5rem,26vw,12rem)]',
          ].join(' ')}
        >
          {label}
        </span>
        {!isGo && (
          <span className="mt-4 block text-[11px] uppercase tracking-[0.4em] text-faint">
            Get ready
          </span>
        )}
      </div>
    </div>
  )
}
