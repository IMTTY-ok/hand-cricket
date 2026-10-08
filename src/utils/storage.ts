/** Small, crash-proof localStorage helpers (private mode can throw). */

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return { ...(fallback as object), ...JSON.parse(raw) } as T
  } catch {
    return fallback
  }
}

export function readValue<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked — the game still works, just not persisted */
  }
}

export const STORAGE_KEYS = {
  settings: 'hc.settings',
  stats: 'hc.stats',
  leaderboard: 'hc.leaderboard',
} as const
