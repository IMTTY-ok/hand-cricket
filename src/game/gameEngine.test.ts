import { describe, expect, it } from 'vitest'
import {
  createMatch,
  flipToss,
  processBall,
  setPhase,
  sideName,
  startSecondInnings,
} from './gameEngine'
import type { MatchConfig, MatchState, Side } from './types'

const CONFIG: MatchConfig = {
  mode: 'pvc',
  playerName: 'Rahul',
  opponentName: 'Computer',
  totalOvers: 1,
  maxWickets: 2,
  difficulty: 'medium',
}

function newMatch(firstBatting: Side = 'A'): MatchState {
  return createMatch(CONFIG, firstBatting)
}

/** Six single runs: side A survives the full over without losing a wicket. */
function firstInningsSingles(): MatchState {
  let m = newMatch('A')
  for (let i = 0; i < 6; i++) m = processBall(m, 1, 6)
  return m
}

describe('createMatch', () => {
  it('starts with an empty first innings', () => {
    const m = newMatch('A')
    expect(m.innings).toBe(0)
    expect(m.battingSide).toBe('A')
    expect(m.scores.A).toEqual({ runs: 0, wickets: 0, balls: 0 })
    expect(m.target).toBeNull()
    expect(m.phase).toBe('countdown')
    expect(m.winner).toBeNull()
    expect(m.events).toHaveLength(0)
  })

  it('exposes display names for both sides', () => {
    const m = newMatch()
    expect(sideName(m, 'A')).toBe('Rahul')
    expect(sideName(m, 'B')).toBe('Computer')
  })
})

describe('processBall', () => {
  it('adds runs when the numbers differ', () => {
    const m = processBall(newMatch('A'), 3, 1)
    expect(m.scores.A).toEqual({ runs: 3, wickets: 0, balls: 1 })
    expect(m.phase).toBe('countdown')
    expect(m.lastEvent?.outcome).toBe('runs')
    expect(m.events).toHaveLength(1)
  })

  it('records a wicket when the numbers match', () => {
    const m = processBall(newMatch('A'), 5, 5)
    expect(m.scores.A).toEqual({ runs: 0, wickets: 1, balls: 1 })
    expect(m.lastEvent?.outcome).toBe('out')
    expect(m.lastEvent?.runs).toBe(0)
  })

  it('tags boundaries', () => {
    expect(processBall(newMatch('A'), 4, 1).lastEvent?.outcome).toBe('four')
    expect(processBall(newMatch('A'), 6, 1).lastEvent?.outcome).toBe('six')
    expect(processBall(newMatch('A'), 1, 6).lastEvent?.outcome).toBe('runs')
  })

  it('never mutates the input state', () => {
    const before = newMatch('A')
    const snapshot = structuredClone(before)
    processBall(before, 3, 5)
    expect(before).toEqual(snapshot)
  })

  it('tracks the human numbers for the adaptive AI', () => {
    let m = newMatch('A')
    m = processBall(m, 4, 2)
    m = processBall(m, 5, 1)
    expect(m.human.batting).toEqual([4, 5])
    expect(m.human.bowling).toEqual([])
    expect(m.opponentNumbers).toEqual([2, 1])

    const bowling = newMatch('B')
    const after = processBall(bowling, 3, 6)
    expect(after.human.bowling).toEqual([6])
    expect(after.human.batting).toEqual([])
  })

  it('ends the first innings when overs are complete', () => {
    let m = newMatch('A')
    for (let i = 0; i < 6; i++) m = processBall(m, 1, 6)
    expect(m.scores.A).toEqual({ runs: 6, wickets: 0, balls: 6 })
    expect(m.phase).toBe('inningsBreak')
    expect(m.target).toBe(7)
  })

  it('ends the first innings when wickets run out', () => {
    let m = newMatch('A')
    m = processBall(m, 3, 3)
    m = processBall(m, 2, 2)
    expect(m.scores.A.wickets).toBe(CONFIG.maxWickets)
    expect(m.phase).toBe('inningsBreak')
    expect(m.target).toBe(1)
  })
})

describe('second innings and result', () => {
  it('switches sides after the innings break', () => {
    const m = startSecondInnings(firstInningsSingles())
    expect(m.innings).toBe(1)
    expect(m.battingSide).toBe('B')
    expect(m.target).toBe(7)
    expect(m.scores.B).toEqual({ runs: 0, wickets: 0, balls: 0 })
    expect(m.phase).toBe('countdown')
    expect(m.lastEvent).toBeNull()
  })

  it('declares the chasing side the winner when the target is reached', () => {
    let m = startSecondInnings(firstInningsSingles())
    m = processBall(m, 6, 1) // 6 runs, target still 7
    expect(m.phase).toBe('countdown')

    m = processBall(m, 1, 6) // the tying run
    expect(m.phase).toBe('result')
    expect(m.winner).toBe('B')
    expect(m.margin).toBe('Won by 2 wickets')
  })

  it('ends the chase early once the target is passed mid-over', () => {
    let m = startSecondInnings(firstInningsSingles())
    m = processBall(m, 6, 1)
    m = processBall(m, 6, 1) // 12 >= 7
    expect(m.phase).toBe('result')
    expect(m.winner).toBe('B')
    expect(m.margin).toBe('Won by 2 wickets')
  })

  it('declares a tie when the chase finishes one short', () => {
    let m = startSecondInnings(firstInningsSingles())
    for (let i = 0; i < 6; i++) m = processBall(m, 1, 6) // 6 of 7
    expect(m.scores.B).toEqual({ runs: 6, wickets: 0, balls: 6 })
    expect(m.phase).toBe('result')
    expect(m.winner).toBe('tie')
    expect(m.margin).toBe('Match tied')
  })

  it('declares a tie when the chase is all out one short', () => {
    let m = startSecondInnings(firstInningsSingles())
    m = processBall(m, 6, 6) // out, 0/1
    m = processBall(m, 6, 1) // 6/1
    m = processBall(m, 6, 6) // out, all out (maxWickets = 2)
    expect(m.scores.B).toEqual({ runs: 6, wickets: 2, balls: 3 })
    expect(m.phase).toBe('result')
    expect(m.winner).toBe('tie')
  })

  it('defends a total when the chase falls short', () => {
    let m = newMatch('A')
    m = processBall(m, 6, 1) // 6
    for (let i = 0; i < 5; i++) m = processBall(m, 1, 6) // +5 = 11
    expect(m.scores.A).toEqual({ runs: 11, wickets: 0, balls: 6 })
    expect(m.phase).toBe('inningsBreak')
    expect(m.target).toBe(12)

    m = startSecondInnings(m)
    for (let i = 0; i < 6; i++) m = processBall(m, 1, 6) // B makes 6
    expect(m.phase).toBe('result')
    expect(m.winner).toBe('A')
    expect(m.margin).toBe('Won by 5 runs')
  })

  it('is not finished while the chase is still alive', () => {
    let m = startSecondInnings(firstInningsSingles())
    m = processBall(m, 3, 1)
    m = processBall(m, 3, 1)
    expect(m.phase).toBe('countdown')
    expect(m.winner).toBeNull()
    expect(m.scores.B.runs).toBe(6)
  })
})

describe('setPhase', () => {
  it('returns a new state with the requested phase', () => {
    const m = newMatch()
    const moved = setPhase(m, 'toss')
    expect(moved.phase).toBe('toss')
    expect(m.phase).toBe('countdown')
  })
})

describe('flipToss', () => {
  it('returns a valid call and a boolean winner', () => {
    for (let i = 0; i < 50; i++) {
      const { computerCall, callerWon } = flipToss('heads')
      expect(['heads', 'tails']).toContain(computerCall)
      expect(callerWon).toBe(computerCall === 'heads')
    }
  })

  it('reports a loss when the call differs', () => {
    for (let i = 0; i < 50; i++) {
      const { computerCall, callerWon } = flipToss('tails')
      expect(callerWon).toBe(computerCall === 'tails')
    }
  })
})
