import { useSyncExternalStore } from 'react'
import type { MatchSummary } from '../game/summary'
import { STORAGE_KEYS, readJSON, writeJSON } from '../utils/storage'

export interface CareerStats {
  matchesPlayed: number
  wins: number
  losses: number
  ties: number
  totalRuns: number
  highestScore: number
  /** Best score recorded in a *won* match. */
  bestScore: number
  sixes: number
  fours: number
  wickets: number
}

const EMPTY: CareerStats = {
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  ties: 0,
  totalRuns: 0,
  highestScore: 0,
  bestScore: 0,
  sixes: 0,
  fours: 0,
  wickets: 0,
}

const KEY = STORAGE_KEYS.stats

let state: CareerStats = { ...EMPTY, ...readJSON<CareerStats>(KEY, EMPTY) }
const listeners = new Set<() => void>()

export function getStats(): CareerStats {
  return state
}

function emit(): void {
  for (const l of listeners) l()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useStats(): CareerStats {
  return useSyncExternalStore(subscribe, getStats, getStats)
}

export function applyMatchSummary(summary: MatchSummary): CareerStats {
  const next: CareerStats = {
    matchesPlayed: state.matchesPlayed + 1,
    wins: state.wins + (summary.isWin ? 1 : 0),
    losses: state.losses + (summary.isLoss ? 1 : 0),
    ties: state.ties + (summary.isTie ? 1 : 0),
    totalRuns: state.totalRuns + summary.humanRuns,
    highestScore: Math.max(state.highestScore, summary.humanRuns),
    bestScore: summary.isWin
      ? Math.max(state.bestScore, summary.humanRuns)
      : state.bestScore,
    sixes: state.sixes + summary.humanSixes,
    fours: state.fours + summary.humanFours,
    wickets: state.wickets + summary.wicketsTaken,
  }
  state = next
  writeJSON(KEY, state)
  emit()
  return state
}

export function winRate(stats: CareerStats): string {
  if (stats.matchesPlayed === 0) return '0%'
  return `${((stats.wins / stats.matchesPlayed) * 100).toFixed(1)}%`
}

/** Points used for leaderboard ordering. */
export function leaderboardPoints(stats: CareerStats): number {
  return stats.totalRuns + stats.wins * 50 + stats.wickets * 20
}

export function resetStats(): void {
  state = { ...EMPTY }
  writeJSON(KEY, state)
  emit()
}
