import type { Difficulty } from './types'

export type AiRole = 'bowling' | 'batting'

/** How strongly each difficulty leans on pattern analysis instead of chance. */
const ADAPTIVE_MIX: Record<Difficulty, number> = {
  easy: 0,
  medium: 0.32,
  hard: 0.58,
}

const NUMBERS = [1, 2, 3, 4, 5, 6] as const

function randomNumber(): number {
  return 1 + Math.floor(Math.random() * 6)
}

/** Frequency table (with Laplace smoothing) over the most recent samples. */
function frequencies(history: number[], window = 8): Map<number, number> {
  const recent = history.slice(-window)
  const counts = new Map<number, number>(NUMBERS.map((n) => [n, 1]))
  for (const n of recent) counts.set(n, (counts.get(n) ?? 0) + 1)
  return counts
}

function pickWeighted(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0)
  let roll = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return NUMBERS[i]
  }
  return NUMBERS[weights.length - 1]
}

/**
 * Pattern-aware pick.
 *
 *  - AI bowling  → tries to *match* the human batter, so it leans towards the
 *    numbers the human shows most often.
 *  - AI batting  → tries to *dodge* the human bowler, so it leans away from
 *    the numbers the human shows most often.
 *
 * The AI never observes the live gesture — only history — so it stays fair.
 */
function adaptivePick(history: number[], role: AiRole): number {
  if (history.length < 3) return randomNumber()

  const counts = frequencies(history)
  const values = NUMBERS.map((n) => counts.get(n) ?? 1)
  const max = Math.max(...values)

  const weights =
    role === 'bowling'
      ? values.map((v) => v)
      : values.map((v) => max - v + 1)

  return pickWeighted(weights)
}

/**
 * Choose the computer's number for one delivery.
 *
 * `history` should be the numbers the *human* has shown while playing the
 * role opposite to the computer's role.
 */
export function chooseComputerNumber(opts: {
  history: number[]
  difficulty: Difficulty
  role: AiRole
}): number {
  const mix = ADAPTIVE_MIX[opts.difficulty]
  if (mix === 0 || opts.history.length < 3) return randomNumber()

  // Blend chance with pattern play so even "Hard" never feels rigged.
  if (Math.random() > mix) return randomNumber()
  return adaptivePick(opts.history, opts.role)
}

export function randomTossCall(): 'heads' | 'tails' {
  return Math.random() < 0.5 ? 'heads' : 'tails'
}
