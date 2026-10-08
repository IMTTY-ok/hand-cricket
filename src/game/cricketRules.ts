import type { BallOutcome, InningsScore } from './types'

export const BALLS_PER_OVER = 6

export const MAX_BALLS_DEFAULT = 12 // 2 overs

/** Convert a whole-over count into the cricket `overs.balls` label. */
export function oversLabel(balls: number): string {
  return `${Math.floor(balls / BALLS_PER_OVER)}.${balls % BALLS_PER_OVER}`
}

export function totalBalls(overs: number): number {
  return overs * BALLS_PER_OVER
}

export function emptyScore(): InningsScore {
  return { runs: 0, wickets: 0, balls: 0 }
}

/**
 * Core hand-cricket rule: identical numbers are a wicket, otherwise the
 * batter keeps the number they showed.
 */
export function resolveBall(batterNumber: number, bowlerNumber: number): {
  runs: number
  out: boolean
} {
  if (batterNumber === bowlerNumber) return { runs: 0, out: true }
  return { runs: batterNumber, out: false }
}

export function outcomeOf(runs: number, out: boolean): BallOutcome {
  if (out) return 'out'
  if (runs === 0) return 'dot'
  if (runs === 4) return 'four'
  if (runs === 6) return 'six'
  return 'runs'
}

/** Apply one legal delivery to an innings score. */
export function applyBall(
  score: InningsScore,
  batterNumber: number,
  bowlerNumber: number,
): InningsScore {
  const { runs, out } = resolveBall(batterNumber, bowlerNumber)
  return {
    runs: score.runs + runs,
    wickets: Math.min(score.wickets + (out ? 1 : 0), 99),
    balls: score.balls + 1,
  }
}

export function isAllOut(score: InningsScore, maxWickets: number): boolean {
  return score.wickets >= maxWickets
}

export function isOversDone(score: InningsScore, overs: number): boolean {
  return score.balls >= totalBalls(overs)
}

export function isTargetReached(score: InningsScore, target: number): boolean {
  return score.runs >= target
}

/** An innings finishes on wickets, overs, or a completed chase — whichever comes first. */
export function isInningsOver(
  score: InningsScore,
  opts: { overs: number; maxWickets: number; target: number | null },
): boolean {
  if (isAllOut(score, opts.maxWickets)) return true
  if (isOversDone(score, opts.overs)) return true
  if (opts.target !== null && isTargetReached(score, opts.target)) return true
  return false
}

export function requiredRuns(target: number | null, score: InningsScore): number | null {
  if (target === null) return null
  return Math.max(target - score.runs, 0)
}

export function ballsLeft(score: InningsScore, overs: number): number {
  return Math.max(totalBalls(overs) - score.balls, 0)
}

/** Required run rate, formatted to one decimal (per 6 balls). */
export function requiredRunRate(target: number | null, score: InningsScore, overs: number): string | null {
  if (target === null) return null
  const left = ballsLeft(score, overs)
  if (left === 0) return null
  const need = target - score.runs
  if (need <= 0) return '0.0'
  return (((need / left) * BALLS_PER_OVER)).toFixed(1)
}

export function currentRunRate(score: InningsScore): string {
  if (score.balls === 0) return '0.0'
  return ((score.runs / score.balls) * BALLS_PER_OVER).toFixed(1)
}

/** Textual description of how a match ended. */
export function describeMargin(
  winner: 'A' | 'B' | 'tie' | null,
  ctx: {
    firstBattingSide: 'A' | 'B'
    scores: Record<'A' | 'B', InningsScore>
    maxWickets: number
  },
): string | null {
  if (winner === 'tie') return 'Match tied'
  if (!winner) return null

  if (winner === ctx.firstBattingSide) {
    const other: 'A' | 'B' = winner === 'A' ? 'B' : 'A'
    const margin = ctx.scores[winner].runs - ctx.scores[other].runs
    return `Won by ${margin} run${margin === 1 ? '' : 's'}`
  }

  const wicketsLeft = ctx.maxWickets - ctx.scores[winner].wickets
  return `Won by ${Math.max(wicketsLeft, 0)} wicket${wicketsLeft === 1 ? '' : 's'}`
}
