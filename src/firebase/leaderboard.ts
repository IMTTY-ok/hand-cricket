import { STORAGE_KEYS, readValue, writeJSON } from '../utils/storage'
import { getFirebaseApp, isCloudEnabled } from './config'

export interface LeaderboardEntry {
  id: string
  name: string
  score: number
  createdAt: number
}

const LOCAL_KEY = STORAGE_KEYS.leaderboard
const MAX_ENTRIES = 50

function readLocal(): LeaderboardEntry[] {
  const list = readValue<LeaderboardEntry[]>(LOCAL_KEY, [])
  return Array.isArray(list) ? list : []
}

function writeLocal(entries: LeaderboardEntry[]): void {
  writeJSON(LOCAL_KEY, entries.slice(0, MAX_ENTRIES))
}

export function getLocalLeaderboard(): LeaderboardEntry[] {
  return readLocal().sort((a, b) => b.score - a.score).slice(0, 10)
}

/** Persist a score locally and, when configured, mirror it to Firestore. */
export async function submitScore(name: string, score: number): Promise<void> {
  const entry: LeaderboardEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim().slice(0, 20) || 'Player',
    score,
    createdAt: Date.now(),
  }

  const next = [...readLocal(), entry].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES)
  writeLocal(next)

  if (!isCloudEnabled) return

  try {
    const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore')
    const app = await getFirebaseApp()
    await addDoc(collection(getFirestore(app), 'leaderboard'), {
      name: entry.name,
      score: entry.score,
      createdAt: serverTimestamp(),
    })
  } catch {
    /* Cloud is best-effort — the local leaderboard already has the score. */
  }
}

export async function fetchLeaderboard(): Promise<{
  entries: LeaderboardEntry[]
  source: 'cloud' | 'local'
}> {
  const local = getLocalLeaderboard()
  if (!isCloudEnabled) return { entries: local, source: 'local' }

  try {
    const { getFirestore, collection, getDocs, query, orderBy, limit } = await import(
      'firebase/firestore'
    )
    const app = await getFirebaseApp()
    const snap = await getDocs(
      query(collection(getFirestore(app), 'leaderboard'), orderBy('score', 'desc'), limit(10)),
    )
    const remote: LeaderboardEntry[] = snap.docs.map((d) => {
      const data = d.data() as { name?: string; score?: number; createdAt?: { toMillis?: () => number } }
      return {
        id: d.id,
        name: String(data.name ?? 'Player'),
        score: Number(data.score ?? 0),
        createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
      }
    })
    if (remote.length === 0) return { entries: local, source: 'local' }

    const merged = [...remote, ...local].sort((a, b) => b.score - a.score).slice(0, 10)
    return { entries: merged, source: 'cloud' }
  } catch {
    return { entries: local, source: 'local' }
  }
}
