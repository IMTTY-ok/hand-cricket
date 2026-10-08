/**
 * Optional cloud backend.
 *
 * The game is fully playable with zero configuration: every score, statistic
 * and leaderboard row is stored in `localStorage`. If Firebase env vars are
 * present we *additionally* sync the leaderboard to Firestore so a shared
 * top-10 can be shown across devices.
 *
 * Only non-sensitive game data (name + score) ever leaves the device.
 */

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
}

function readConfig(): FirebaseConfig | null {
  const env = import.meta.env as Record<string, string | undefined>
  const apiKey = env.VITE_FIREBASE_API_KEY
  const projectId = env.VITE_FIREBASE_PROJECT_ID
  if (!apiKey || !projectId) return null
  return {
    apiKey,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
    projectId,
    appId: env.VITE_FIREBASE_APP_ID ?? '',
  }
}

export const firebaseConfig = readConfig()
export const isCloudEnabled = firebaseConfig !== null

let appPromise: Promise<import('firebase/app').FirebaseApp> | null = null

export function getFirebaseApp(): Promise<import('firebase/app').FirebaseApp> {
  if (!firebaseConfig) return Promise.reject(new Error('Cloud sync is not configured'))
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp, getApps } = await import('firebase/app')
      return getApps()[0] ?? initializeApp(firebaseConfig)
    })()
  }
  return appPromise
}
