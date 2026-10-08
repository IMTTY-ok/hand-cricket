import { useEffect, useRef, useState } from 'react'
import { flipToss } from '../game/gameEngine'
import type { Side, TossCall } from '../game/types'
import { buzz } from '../utils/haptics'
import { sound } from '../utils/sound'
import { Button } from './ui/Button'

export interface TossOutcome {
  winnerSide: Side
  chose: 'bat' | 'bowl'
}

interface TossProps {
  playerName: string
  opponentName: string
  isComputer: boolean
  onComplete: (outcome: TossOutcome) => void
}

type Stage = 'call' | 'flipping' | 'result' | 'decide' | 'reveal'

const CALLS: { value: TossCall; label: string }[] = [
  { value: 'heads', label: 'Heads' },
  { value: 'tails', label: 'Tails' },
]

export function Toss({ playerName, opponentName, isComputer, onComplete }: TossProps) {
  const [stage, setStage] = useState<Stage>('call')
  const [call, setCall] = useState<TossCall | null>(null)
  const [coinFace, setCoinFace] = useState<TossCall>('heads')
  const [callerWon, setCallerWon] = useState(false)
  const [decision, setDecision] = useState<'bat' | 'bowl'>('bat')
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const beginFlip = (chosen: TossCall) => {
    const { computerCall, callerWon: won } = flipToss(chosen)
    setCall(chosen)
    setCoinFace(computerCall)
    setCallerWon(won)
    setStage('flipping')
    sound.play('coin')

    timers.current.push(
      window.setTimeout(() => {
        setStage('result')
        sound.play(won ? 'tossWin' : 'tossLose')
        buzz(won ? 'victory' : 'defeat')
      }, 1650),
    )
  }

  const revealDecision = (chose: 'bat' | 'bowl') => {
    setDecision(chose)
    setStage('reveal')
    timers.current.push(
      window.setTimeout(() => {
        onComplete({ winnerSide: callerWon ? 'A' : 'B', chose })
      }, 1400),
    )
  }

  const computerChose = (): 'bat' | 'bowl' => (Math.random() < 0.5 ? 'bat' : 'bowl')

  const tossWinnerName = callerWon ? playerName : opponentName
  const otherName = callerWon ? opponentName : playerName
  const battingFirstName = decision === 'bat' ? tossWinnerName : otherName

  return (
    <div className="w-full max-w-lg mx-auto text-center animate-fade-up">
      <p className="text-[11px] uppercase tracking-[0.32em] text-accent font-bold">Toss</p>

      {stage === 'call' && (
        <>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">
            {isComputer ? 'Call the toss' : `${playerName} calls`}
          </h2>
          <p className="mt-2 text-sm text-dim">
            {isComputer
              ? 'Pick heads or tails. Win the toss and choose whether to bat or bowl.'
              : 'Player 1 picks, then the coin decides.'}
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3">
            {CALLS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => beginFlip(c.value)}
                className="group h-24 rounded-2xl border border-border bg-surface-2 hover:border-accent/60 hover:bg-accent-soft transition-all duration-150 active:translate-y-px focus-visible:outline-2 focus-visible:outline-accent outline-offset-2"
              >
                <span className="block text-2xl font-extrabold tracking-tight group-hover:text-accent transition-colors">
                  {c.label}
                </span>
                <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-faint">
                  {c.value}
                </span>
              </button>
            ))}
          </div>

          <div
            className="mt-8 mx-auto size-24 rounded-full bg-gradient-to-b from-warn to-warn/60 grid place-items-center text-warn-soft opacity-40 shadow-[inset_0_-6px_16px_rgba(0,0,0,0.35)]"
            aria-hidden
          >
            <span className="text-lg font-black text-black/70">HC</span>
          </div>
        </>
      )}

      {stage === 'flipping' && (
        <div className="py-6" aria-live="polite" aria-label="Coin is flipping">
          <div className="mx-auto size-32 [perspective:600px]">
            <div className="relative size-full animate-coin-flip [transform-style:preserve-3d]">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-warn to-warn/70 grid place-items-center shadow-[inset_0_-8px_20px_rgba(0,0,0,0.4)] [backface-visibility:hidden]">
                <span className="text-2xl font-black text-black/75">H</span>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-warn/85 to-warn/50 grid place-items-center shadow-[inset_0_-8px_20px_rgba(0,0,0,0.4)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <span className="text-2xl font-black text-black/75">T</span>
              </div>
            </div>
          </div>
          <p className="mt-6 text-sm text-dim animate-pulse">Flipping…</p>
        </div>
      )}

      {(stage === 'result' || stage === 'reveal') && (
        <>
          <div className="mt-5 mx-auto size-24 rounded-full bg-gradient-to-b from-warn to-warn/60 grid place-items-center animate-pop shadow-[inset_0_-6px_16px_rgba(0,0,0,0.35)]">
            <span className="text-2xl font-black text-black/75">
              {coinFace === 'heads' ? 'H' : 'T'}
            </span>
          </div>
          <p className="mt-4 text-sm text-dim">
            You called <strong className="text-text">{call}</strong> · It was{' '}
            <strong className="text-text">{coinFace}</strong>
          </p>

          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight animate-rise">
            {callerWon ? `You won the toss!` : `${opponentName} won the toss.`}
          </h2>

          {stage === 'result' && callerWon && (
            <div className="mt-7 grid grid-cols-2 gap-3 animate-fade-up">
              <Button variant="primary" size="lg" onClick={() => revealDecision('bat')}>
                Bat first
              </Button>
              <Button variant="secondary" size="lg" onClick={() => revealDecision('bowl')}>
                Bowl first
              </Button>
            </div>
          )}

          {stage === 'result' && !callerWon && (
            <div className="mt-7 animate-fade-up">
              <p className="text-sm text-dim mb-3">
                {isComputer ? 'The computer' : opponentName} decides…
              </p>
              <Button
                variant="primary"
                size="lg"
                block
                onClick={() => revealDecision(computerChose())}
              >
                Reveal decision
              </Button>
            </div>
          )}

          {stage === 'reveal' && (
            <div className="mt-7 animate-rise">
              <p className="text-[11px] uppercase tracking-[0.3em] text-faint font-bold">
                Toss winner
              </p>
              <p className="mt-1 text-2xl font-extrabold text-accent">
                {callerWon ? playerName : opponentName}
              </p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface-3 px-4 py-2 text-sm font-semibold">
                {battingFirstName} bats first
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
