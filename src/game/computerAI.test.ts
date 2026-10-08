import { afterEach, describe, expect, it, vi } from 'vitest'
import { chooseComputerNumber, randomTossCall } from './computerAI'

const HISTORY_OF_SIXES = Array.from({ length: 20 }, () => 6)
const HISTORY_OF_ONES = Array.from({ length: 20 }, () => 1)

type SampleOpts = { history: number[]; difficulty: 'easy' | 'medium' | 'hard'; role: 'bowling' | 'batting' }

function sample(opts: SampleOpts, runs = 3000) {
  const counts = new Map<number, number>()
  for (let i = 0; i < runs; i++) {
    const pick = chooseComputerNumber(opts)
    expect(pick).toBeGreaterThanOrEqual(1)
    expect(pick).toBeLessThanOrEqual(6)
    counts.set(pick, (counts.get(pick) ?? 0) + 1)
  }
  return (value: number) => (counts.get(value) ?? 0) / runs
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('chooseComputerNumber', () => {
  it('stays within 1..6 for every difficulty and role', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      for (const role of ['bowling', 'batting'] as const) {
        sample({ history: HISTORY_OF_SIXES, difficulty, role }, 400)
      }
    }
  })

  it('ignores history when there are fewer than three samples', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const freq = sample({ history: [6, 6], difficulty, role: 'bowling' }, 3000)
      // Chance alone would be ~1/6; nothing adaptive can have kicked in yet.
      expect(freq(6)).toBeLessThan(0.3)
    }
  })

  it('keeps easy purely random even with a deep history', () => {
    const freq = sample({ history: HISTORY_OF_SIXES, difficulty: 'easy', role: 'bowling' }, 4000)
    expect(freq(6)).toBeGreaterThan(0.1)
    expect(freq(6)).toBeLessThan(0.24)
    expect(freq(1)).toBeGreaterThan(0.1)
  })

  it('bowls towards the human favourite on hard', () => {
    const freq = sample({ history: HISTORY_OF_SIXES, difficulty: 'hard', role: 'bowling' }, 4000)
    expect(freq(6)).toBeGreaterThan(0.3)
    expect(freq(6)).toBeGreaterThan(freq(1))
  })

  it('does not chase the human favourite when batting', () => {
    const bowling = sample({ history: HISTORY_OF_SIXES, difficulty: 'hard', role: 'bowling' }, 4000)
    const batting = sample({ history: HISTORY_OF_SIXES, difficulty: 'hard', role: 'batting' }, 4000)
    expect(bowling(6)).toBeGreaterThan(bowling(1))
    expect(batting(6)).toBeLessThan(bowling(6))
  })

  it('swaps its bias when the human favourite changes', () => {
    const freq = sample({ history: HISTORY_OF_ONES, difficulty: 'hard', role: 'bowling' }, 4000)
    expect(freq(1)).toBeGreaterThan(freq(6))
  })

  it('uses the adaptive pick whenever chance allows it', () => {
    const random = vi.spyOn(Math, 'random')
    random.mockReturnValueOnce(0.0) // pass the difficulty gate
    random.mockReturnValue(0.999) // roll deep into the weighted table
    expect(
      chooseComputerNumber({ history: HISTORY_OF_SIXES, difficulty: 'hard', role: 'bowling' }),
    ).toBe(6)
    random.mockRestore()
  })
})

describe('randomTossCall', () => {
  it('only ever returns heads or tails', () => {
    for (let i = 0; i < 100; i++) {
      expect(['heads', 'tails']).toContain(randomTossCall())
    }
  })
})
