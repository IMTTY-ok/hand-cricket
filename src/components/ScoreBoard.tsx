import { BALLS_PER_OVER, currentRunRate, oversLabel, requiredRunRate, requiredRuns, ballsLeft } from '../game/cricketRules'
import { sideName } from '../game/gameEngine'
import type { MatchState } from '../game/types'
import { Icon } from './ui/Icon'

interface ScoreBoardProps {
  state: MatchState
  compact?: boolean
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-border last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
        {label}
      </span>
      <span className={`text-sm font-semibold tabular ${accent ? 'text-accent' : 'text-text'}`}>
        {value}
      </span>
    </div>
  )
}

export function ScoreBoard({ state, compact = false }: ScoreBoardProps) {
  const batting = state.scores[state.battingSide]
  const bowlingSide = state.battingSide === 'A' ? 'B' : 'A'
  const chasing = state.target !== null
  const need = requiredRuns(state.target, batting)
  const left = ballsLeft(batting, state.config.totalOvers)
  const rrr = requiredRunRate(state.target, batting, state.config.totalOvers)
  const overBalls = state.events
    .filter((e) => e.innings === state.innings)
    .slice(-6)
    .map((e) => e.out ? 'W' : e.runs.toString())

  return (
    <section
      className="card p-4 sm:p-5 animate-fade-up"
      aria-label="Scoreboard"
      aria-live="polite"
    >
      <header className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-7 shrink-0 grid place-items-center rounded-lg bg-accent-soft text-accent">
            <Icon name="bolt" size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-faint font-semibold leading-none">
              Innings {state.innings + 1} of 2 · {sideName(state, state.battingSide)}
            </p>
            <p className="text-[11px] text-dim leading-tight mt-0.5">
              {chasing ? 'Chasing' : 'Batting first'} · {state.config.totalOvers} ov
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-surface-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-dim">
          {state.config.difficulty}
        </span>
      </header>

      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-1.5 animate-pop" key={`${batting.runs}-${batting.wickets}`}>
            <span className="text-[44px] sm:text-[54px] leading-none font-extrabold tracking-tight tabular">
              {batting.runs}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-faint leading-none">/</span>
            <span className="text-[30px] sm:text-[36px] leading-none font-bold text-danger tabular">
              {batting.wickets}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-dim font-semibold tabular">
            {oversLabel(batting.balls)} <span className="text-faint font-normal">/ {state.config.totalOvers} ov</span>
          </p>
        </div>

        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.14em] text-faint font-semibold">
            {chasing ? 'Target' : 'Run rate'}
          </p>
          <p className="text-2xl font-extrabold tabular text-accent leading-tight">
            {chasing ? state.target : currentRunRate(batting)}
          </p>
          {chasing && need !== null && (
            <p className="text-[11px] text-dim mt-0.5 tabular">
              need {need} off {left}
            </p>
          )}
        </div>
      </div>

      {!compact && (
        <div className="mt-4">
          <Stat label="Batter" value={sideName(state, state.battingSide)} />
          <Stat label="Bowler" value={sideName(state, bowlingSide)} />
          <Stat label="Balls" value={`${batting.balls}`} />
          {chasing && rrr && <Stat label="Required rate" value={rrr} accent />}
          <Stat label="This over" value={overBalls.length ? overBalls.join('  ') : '—'} />
        </div>
      )}

      {chasing && need !== null && need === 0 && (
        <p className="mt-3 text-xs font-semibold text-success">Target reached</p>
      )}
      <p className="sr-only">
        {`Score ${batting.runs} for ${batting.wickets}. ${oversLabel(batting.balls)} overs bowled of ${state.config.totalOvers}.`}
        {BALLS_PER_OVER} legal balls per over.
      </p>
    </section>
  )
}
