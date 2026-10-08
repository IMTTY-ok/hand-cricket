/**
 * Central game domain types. Keeping these free of React means the engine
 * can be unit tested and reused by any UI (screens, stats, leaderboard).
 */

export type Side = 'A' | 'B'

export type GameMode = 'pvc' | 'pvp'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type OversChoice = 1 | 2 | 3 | 5 | 10

export type InningsIndex = 0 | 1

export type TossCall = 'heads' | 'tails'

export type MatchPhase =
  | 'toss'
  | 'tossResult'
  | 'decision'
  | 'countdown'
  | 'live'
  | 'inningsBreak'
  | 'result'

export interface InningsScore {
  runs: number
  wickets: number
  balls: number
}

export type BallOutcome = 'dot' | 'runs' | 'four' | 'six' | 'out'

export interface BallEvent {
  id: number
  innings: InningsIndex
  battingSide: Side
  batterNumber: number
  bowlerNumber: number
  runs: number
  out: boolean
  outcome: BallOutcome
  /** Score *after* the ball was played. */
  score: InningsScore
  overLabel: string
}

export interface MatchConfig {
  mode: GameMode
  playerName: string
  opponentName: string
  totalOvers: OversChoice
  maxWickets: number
  difficulty: Difficulty
}

export interface MatchState {
  config: MatchConfig
  phase: MatchPhase
  innings: InningsIndex
  battingSide: Side
  firstBattingSide: Side
  scores: Record<Side, InningsScore>
  /** Runs needed by the side batting second. `null` during the first innings. */
  target: number | null
  winner: Side | 'tie' | null
  /** How the winner won, for the result screen. */
  margin: string | null
  lastEvent: BallEvent | null
  events: BallEvent[]
  /**
   * Numbers the human (side A) has shown, split by the role they played.
   * The adaptive AI reads the list that matches its current role so it can
   * react to *how the human bats* versus *how the human bowls*.
   */
  human: {
    batting: number[]
    bowling: number[]
  }
  opponentNumbers: number[]
  ballSeq: number
}

export interface TossState {
  call: TossCall
  computerCall: TossCall
  winner: Side | null
  /** The side that won the toss (equal to `winner`, kept for readability). */
  decision: Side | null
  chose: 'bat' | 'bowl' | null
}
