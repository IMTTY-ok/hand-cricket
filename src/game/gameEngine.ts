import {
  describeMargin,
  emptyScore,
  isInningsOver,
  outcomeOf,
  oversLabel,
  resolveBall,
} from './cricketRules'
import type {
  BallEvent,
  InningsScore,
  MatchConfig,
  MatchPhase,
  MatchState,
  Side,
  TossCall,
} from './types'

export function createMatch(config: MatchConfig, firstBattingSide: Side): MatchState {
  return {
    config,
    phase: 'countdown',
    innings: 0,
    battingSide: firstBattingSide,
    firstBattingSide,
    scores: { A: emptyScore(), B: emptyScore() },
    target: null,
    winner: null,
    margin: null,
    lastEvent: null,
    events: [],
    human: { batting: [], bowling: [] },
    opponentNumbers: [],
    ballSeq: 0,
  }
}

export function setPhase(state: MatchState, phase: MatchPhase): MatchState {
  return { ...state, phase }
}

export function sideName(state: MatchState, side: Side): string {
  return side === 'A' ? state.config.playerName : state.config.opponentName
}

export function bowlingSide(batting: Side): Side {
  return batting === 'A' ? 'B' : 'A'
}

export function scoreOf(state: MatchState, side: Side): InningsScore {
  return state.scores[side]
}

export function battingScore(state: MatchState): InningsScore {
  return state.scores[state.battingSide]
}

/** Is the side currently batting chasing a target? */
export function isChasing(state: MatchState): boolean {
  return state.target !== null
}

/**
 * Toss helper. The caller (side A) picks; the opponent picks at random.
 * Returns whether the *caller* won.
 */
export function flipToss(call: TossCall): { computerCall: TossCall; callerWon: boolean } {
  const computerCall: TossCall = Math.random() < 0.5 ? 'heads' : 'tails'
  return { computerCall, callerWon: call === computerCall }
}

/**
 * Play one delivery and advance the whole match state.
 *
 * The function is pure: it returns a new state and never mutates the input,
 * which keeps React re-renders and tests predictable.
 */
export function processBall(state: MatchState, batterNumber: number, bowlerNumber: number): MatchState {
  const batting = state.battingSide
  const prev = state.scores[batting]
  const { runs, out } = resolveBall(batterNumber, bowlerNumber)

  const score: InningsScore = {
    runs: prev.runs + runs,
    wickets: prev.wickets + (out ? 1 : 0),
    balls: prev.balls + 1,
  }

  const ballSeq = state.ballSeq + 1
  const event: BallEvent = {
    id: ballSeq,
    innings: state.innings,
    battingSide: batting,
    batterNumber,
    bowlerNumber,
    runs,
    out,
    outcome: outcomeOf(runs, out),
    score,
    overLabel: oversLabel(score.balls),
  }

  const human = { ...state.human }
  if (state.config.mode === 'pvc') {
    // Side A is always the human.
    if (batting === 'A') human.batting = [...human.batting, batterNumber]
    else human.bowling = [...human.bowling, bowlerNumber]
  }

  const scores: Record<Side, InningsScore> = { ...state.scores, [batting]: score }

  const next: MatchState = {
    ...state,
    scores,
    lastEvent: event,
    events: [...state.events, event],
    human,
    opponentNumbers: [
      ...state.opponentNumbers,
      batting === 'A' ? bowlerNumber : batterNumber,
    ],
    ballSeq,
  }

  const inningsOver = isInningsOver(score, {
    overs: state.config.totalOvers,
    maxWickets: state.config.maxWickets,
    target: state.target,
  })

  if (!inningsOver) return next

  if (state.innings === 0) {
    // First innings complete — set up the chase.
    return {
      ...next,
      phase: 'inningsBreak',
      target: score.runs + 1,
    }
  }

  return finishMatch(next, score)
}

function finishMatch(state: MatchState, finalScore: InningsScore): MatchState {
  const chasing = state.battingSide !== state.firstBattingSide

  let winner: Side | 'tie' | null = null

  if (chasing && state.target !== null) {
    if (finalScore.runs >= state.target) winner = state.battingSide
    else if (finalScore.runs === state.target - 1) winner = 'tie'
    else winner = state.firstBattingSide
  } else {
    winner = state.firstBattingSide
  }

  const margin = describeMargin(winner, {
    firstBattingSide: state.firstBattingSide,
    scores: state.scores,
    maxWickets: state.config.maxWickets,
  })

  return { ...state, phase: 'result', winner, margin }
}

/** Move from the innings break into the second innings (does not start play). */
export function startSecondInnings(state: MatchState): MatchState {
  const secondSide: Side = state.firstBattingSide === 'A' ? 'B' : 'A'
  return {
    ...state,
    phase: 'countdown',
    innings: 1,
    battingSide: secondSide,
    target: state.target ?? 1,
    lastEvent: null,
  }
}
