import { useSyncExternalStore } from 'react'
import type { Difficulty, OversChoice } from '../game/types'
import { STORAGE_KEYS, readJSON, writeJSON } from '../utils/storage'

export type Theme = 'dark' | 'light'

export interface Settings {
  playerName: string
  nameSet: boolean
  difficulty: Difficulty
  totalOvers: OversChoice
  sound: boolean
  haptics: boolean
  theme: Theme
}

const DEFAULTS: Settings = {
  playerName: '',
  nameSet: false,
  difficulty: 'medium',
  totalOvers: 2,
  sound: true,
  haptics: true,
  theme: 'dark',
}

const KEY = STORAGE_KEYS.settings

let state: Settings = { ...DEFAULTS, ...readJSON<Settings>(KEY, DEFAULTS) }
// Overs must stay within the supported set even if storage was hand-edited.
if (![1, 2, 3, 5, 10].includes(state.totalOvers)) state.totalOvers = DEFAULTS.totalOvers

const listeners = new Set<() => void>()

function emit(): void {
  for (const l of listeners) l()
}

export function getSettings(): Settings {
  return state
}

export function updateSettings(patch: Partial<Settings>): void {
  state = { ...state, ...patch }
  writeJSON(KEY, state)
  emit()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings)
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute('content', theme === 'dark' ? '#0a0d12' : '#f4f6f9')
}

export function resetSettings(): void {
  state = { ...DEFAULTS }
  writeJSON(KEY, state)
  emit()
}
