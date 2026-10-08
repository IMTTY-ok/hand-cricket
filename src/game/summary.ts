import type { InningsScore, MatchState, Side } from './types'

export interface MatchSummary {
  winner: Side | 'tie' | null
  margin: string | null
  scores: Record<Side, InningsScore>
  firstBattingSide: Side
  /** Runs scored by the human across both innings. */
  humanRuns: number
  humanSixes: number
  humanFours: number
  /** Wickets the human took while bowling. */
  wicketsTaken: number
  isWin: boolean
  isTie: boolean
  isLoss: boolean
}

/** Reduce a finished match to the numbers the stats/leaderboard layers need. */
export function summarizeMatch(state: MatchState): MatchSummary {
  let sixes = 0
  let fours = 0
  let wicketsTaken = 0

  for (const ev of state.events) {
    const humanIsBatting = ev.battingSide === 'A'
    if (humanIsBatting && !ev.out) {
      if (ev.outcome === 'six') sixes += 1
      if (ev.outcome === 'four') fours += 1
    }
    // The human bowls for side B, so an out *while side B is fielding* (side A
    // batting) means the human took the wicket… cricket keeps it simple here:
    // a wicket is credited to whoever is bowling.
    if (!humanIsBatting && ev.out) wicketsTaken += 1
  }

  return {
    winner: state.winner,
    margin: state.margin,
    scores: state.scores,
    firstBattingSide: state.firstBattingSide,
    humanRuns: state.scores.A.runs,
    humanSixes: sixes,
    humanFours: fours,
    wicketsTaken,
    isWin: state.winner === 'A',
    isTie: state.winner === 'tie',
    isLoss: state.winner !== 'A' && state.winner !== 'tie',
  }
}
