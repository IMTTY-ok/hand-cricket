import { describe, expect, it } from 'vitest'
import {
  applyBall,
  ballsLeft,
  currentRunRate,
  emptyScore,
  isInningsOver,
  isTargetReached,
  oversLabel,
  requiredRunRate,
  requiredRuns,
  resolveBall,
  totalBalls,
} from './cricketRules'

describe('oversLabel', () => {
  it('formats completed overs and remaining balls', () => {
    expect(oversLabel(0)).toBe('0.0')
    expect(oversLabel(6)).toBe('1.0')
    expect(oversLabel(7)).toBe('1.1')
    expect(oversLabel(14)).toBe('2.2')
  })
})

describe('resolveBall', () => {
  it('scores the batter number when the numbers differ', () => {
    expect(resolveBall(4, 2)).toEqual({ runs: 4, out: false })
    expect(resolveBall(1, 6)).toEqual({ runs: 1, out: false })
  })

  it('gives an out when the numbers match', () => {
    expect(resolveBall(5, 5)).toEqual({ runs: 0, out: true })
    expect(resolveBall(1, 1)).toEqual({ runs: 0, out: true })
  })
})

describe('applyBall', () => {
  it('adds runs, balls and wickets', () => {
    const score = applyBall(emptyScore(), 6, 3)
    expect(score).toEqual({ runs: 6, wickets: 0, balls: 1 })
  })

  it('counts an out without conceding runs', () => {
    const score = applyBall(emptyScore(), 2, 2)
    expect(score).toEqual({ runs: 0, wickets: 1, balls: 1 })
  })

  it('accumulates over several deliveries', () => {
    let score = emptyScore()
    for (const [a, b] of [
      [3, 1],
      [2, 5],
      [6, 6],
      [4, 4],
    ] as const) {
      score = applyBall(score, a, b)
    }
    expect(score).toEqual({ runs: 5, wickets: 2, balls: 4 })
  })
})

describe('innings completion', () => {
  it('ends when overs are done', () => {
    const score = { runs: 20, wickets: 0, balls: totalBalls(2) }
    expect(isInningsOver(score, { overs: 2, maxWickets: 3, target: null })).toBe(true)
  })

  it('ends when wickets run out', () => {
    const score = { runs: 4, wickets: 3, balls: 5 }
    expect(isInningsOver(score, { overs: 10, maxWickets: 3, target: null })).toBe(true)
  })

  it('ends immediately when the target is reached', () => {
    expect(isTargetReached({ runs: 57, wickets: 0, balls: 3 }, 57)).toBe(true)
    expect(isTargetReached({ runs: 56, wickets: 0, balls: 3 }, 57)).toBe(false)

    const score = { runs: 57, wickets: 1, balls: 8 }
    expect(isInningsOver(score, { overs: 5, maxWickets: 3, target: 57 })).toBe(true)
  })

  it('keeps playing while the chase is alive', () => {
    const score = { runs: 30, wickets: 1, balls: 8 }
    expect(isInningsOver(score, { overs: 5, maxWickets: 3, target: 57 })).toBe(false)
  })
})

describe('scoring helpers', () => {
  it('reports runs required and balls left', () => {
    const score = { runs: 48, wickets: 1, balls: 14 }
    expect(requiredRuns(67, score)).toBe(19)
    expect(requiredRuns(null, score)).toBeNull()
    expect(ballsLeft(score, 4)).toBe(10)
  })

  it('computes run rates', () => {
    const score = { runs: 48, wickets: 1, balls: 14 }
    expect(currentRunRate(score)).toBe('20.6')
    expect(requiredRunRate(67, score, 4)).toBe('11.4')
    expect(requiredRunRate(null, score, 4)).toBeNull()
  })
})
