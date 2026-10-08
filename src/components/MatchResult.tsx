import { oversLabel } from '../game/cricketRules'
import { sideName } from '../game/gameEngine'
import type { MatchState } from '../game/types'
import { Icon } from './ui/Icon'
import { Button } from './ui/Button'

interface MatchResultProps {
  state: MatchState
  onPlayAgain: () => void
  onMenu: () => void
  onStats: () => void
}

function ScoreRow({
  name,
  runs,
  wickets,
  balls,
  highlight,
}: {
  name: string
  runs: number
  wickets: number
  balls: number
  highlight: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 ${
        highlight ? 'bg-accent-soft border-accent/40' : 'bg-surface-2 border-border'
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="text-[11px] text-faint tabular">{oversLabel(balls)} overs</p>
      </div>
      <p className="text-2xl font-extrabold tabular shrink-0">
        {runs}
        <span className="text-base font-bold text-faint"> / {wickets}</span>
      </p>
    </div>
  )
}

export function MatchResult({ state, onPlayAgain, onMenu, onStats }: MatchResultProps) {
  const won = state.winner === 'A'
  const tied = state.winner === 'tie'
  const isPvp = state.config.mode === 'pvp'

  const title = tied ? 'MATCH TIED' : won ? 'YOU WON' : `${state.config.opponentName.toUpperCase()} WON`
  const tone = tied ? 'var(--c-warn)' : won ? 'var(--c-accent)' : 'var(--c-danger)'

  return (
    <div className="w-full max-w-md mx-auto text-center animate-fade-up">
      <div className="mx-auto mb-4 size-16 grid place-items-center rounded-3xl animate-pop"
        style={{ background: `color-mix(in srgb, ${tone} 18%, transparent)`, color: tone }}>
        <Icon name={tied ? 'info' : won ? 'trophy' : 'chart'} size={30} />
      </div>

      <h1
        className="text-[clamp(2.2rem,9vw,3.4rem)] font-extrabold tracking-tight leading-none"
        style={{ color: tone }}
      >
        {title}
      </h1>

      <p className="mt-3 text-sm font-semibold text-dim" aria-live="polite">
        {state.margin ?? 'Match complete'}
      </p>

      <div className="mt-7 space-y-2.5 text-left">
        <ScoreRow
          name={sideName(state, 'A')}
          runs={state.scores.A.runs}
          wickets={state.scores.A.wickets}
          balls={state.scores.A.balls}
          highlight={won}
        />
        <ScoreRow
          name={sideName(state, 'B')}
          runs={state.scores.B.runs}
          wickets={state.scores.B.wickets}
          balls={state.scores.B.balls}
          highlight={!won && !tied}
        />
      </div>

      {!isPvp && state.winner === 'A' && (
        <p className="mt-4 text-xs text-faint">
          Beaten by {state.config.difficulty === 'hard' ? 'the' : 'an'}{' '}
          {state.config.difficulty} opponent — nice chase.
        </p>
      )}

      <div className="mt-7 grid gap-2.5">
        <Button variant="primary" size="lg" block onClick={onPlayAgain}>
          Play again
        </Button>
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="secondary" size="md" block onClick={onMenu}>
            Main menu
          </Button>
          <Button variant="secondary" size="md" block onClick={onStats}>
            Statistics
          </Button>
        </div>
      </div>
    </div>
  )
}
