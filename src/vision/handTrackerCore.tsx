import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { useHandTracker } from './useHandTracker'
import type { CameraError } from './cameraTypes'
import type { GestureResult } from './gestureRecognition'
import type { StabilityState } from './gestureStability'

export interface HandTracker {
  videoRef: (el: HTMLVideoElement | null) => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  camera: { status: 'idle' | 'starting' | 'ready' | 'error'; error: CameraError | null }
  detectStatus: 'standby' | 'loading' | 'tracking' | 'error'
  modelError: string | null
  handCount: number
  gesture: GestureResult | null
  stability: StabilityState
  startCamera: () => Promise<void>
  stopCamera: () => void
  resetLock: () => void
}

export const HandTrackerContext = createContext<HandTracker | null>(null)

interface ProviderProps {
  cameraActive: boolean
  detectActive: boolean
  children: ReactNode
}

export function HandTrackerProvider({ cameraActive, detectActive, children }: ProviderProps) {
  const tracker = useHandTracker({ cameraActive, detectActive })
  return <HandTrackerContext.Provider value={tracker as HandTracker}>{children}</HandTrackerContext.Provider>
}

export function useHandTrackerContext(): HandTracker {
  const ctx = useContext(HandTrackerContext)
  if (!ctx) throw new Error('useHandTrackerContext must be used inside HandTrackerProvider')
  return ctx
}
