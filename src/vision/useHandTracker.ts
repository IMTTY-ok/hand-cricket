import { useCallback, useEffect, useRef, useState } from 'react'
import { clearOverlay, drawHandOverlay } from './drawOverlay'
import { detectHands, loadHandLandmarker, type DetectedHand } from './handDetection'
import { readGesture, type GestureResult } from './gestureRecognition'
import { GestureStabilityTracker, type StabilityState } from './gestureStability'
import type { HandLandmarker } from '@mediapipe/tasks-vision'
import type { CameraError, CameraErrorCode, CameraStatus, DetectStatus } from './cameraTypes'

const DETECT_INTERVAL_MS = 66

const CAMERA_ERRORS: Record<CameraErrorCode, Omit<CameraError, 'code'>> = {
  unsupported: {
    title: 'Camera unavailable',
    message: 'This browser does not expose a camera API. Try Chrome, Edge or Safari on https.',
  },
  denied: {
    title: 'Camera permission denied',
    message:
      'Camera permission was denied. Please enable camera access in your browser settings, then try again.',
  },
  notfound: {
    title: 'No camera detected',
    message: 'We could not find a camera on this device. Connect one and press Try Again.',
  },
  inuse: {
    title: 'Camera is in use',
    message: 'Your camera is currently being used by another application. Close it and try again.',
  },
  disconnected: {
    title: 'Camera connection lost',
    message: 'The camera stopped sending frames. Your match is paused — reconnect to continue.',
  },
  unknown: {
    title: 'Camera error',
    message: 'Something went wrong while starting the camera. Please try again.',
  },
}

function mapCameraError(err: unknown): CameraError {
  const name = (err as { name?: string } | null)?.name ?? ''
  const code: CameraErrorCode =
    name === 'NotAllowedError' || name === 'SecurityError'
      ? 'denied'
      : name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError'
        ? 'notfound'
        : name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError'
          ? 'inuse'
          : 'unknown'
  return { code, ...CAMERA_ERRORS[code] }
}

export interface HandTrackerOptions {
  cameraActive: boolean
  detectActive: boolean
}

const IDLE_STABILITY: StabilityState = {
  status: 'idle',
  number: null,
  progress: 0,
  confidence: 0,
  handPresent: false,
  multipleHands: false,
  message: 'Place your hand inside the frame',
}

export function useHandTracker({ cameraActive, detectActive }: HandTrackerOptions) {
  const videoElRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const landmarkerRef = useRef<HandLandmarker | null>(null)
  const trackerRef = useRef(new GestureStabilityTracker(6, 0.6))
  const handsRef = useRef<DetectedHand[]>([])
  const detectActiveRef = useRef(detectActive)
  const sessionRef = useRef(0)

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle')
  const [cameraError, setCameraError] = useState<CameraError | null>(null)
  const [detectStatus, setDetectStatus] = useState<DetectStatus>('standby')
  const [modelError, setModelError] = useState<string | null>(null)
  const [handCount, setHandCount] = useState(0)
  const [gesture, setGesture] = useState<GestureResult | null>(null)
  const [stability, setStability] = useState<StabilityState>(IDLE_STABILITY)

  useEffect(() => {
    detectActiveRef.current = detectActive
  }, [detectActive])

  const stopCamera = useCallback(() => {
    sessionRef.current += 1
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    handsRef.current = []
    if (canvasRef.current) clearOverlay(canvasRef.current)
    setCameraStatus('idle')
    setHandCount(0)
    setGesture(null)
    setStability(IDLE_STABILITY)
  }, [])

  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el
    if (!el || !streamRef.current || el.srcObject === streamRef.current) return
    el.srcObject = streamRef.current
    void el.play().catch(() => undefined)
  }, [])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('error')
      setCameraError({ code: 'unsupported', ...CAMERA_ERRORS.unsupported })
      return
    }
    const session = ++sessionRef.current
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraStatus('starting')
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      })
      if (session !== sessionRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream
      const video = videoElRef.current
      if (video) {
        video.srcObject = stream
        await video.play().catch(() => undefined)
      }
      const track = stream.getVideoTracks()[0]
      track?.addEventListener('ended', () => {
        if (streamRef.current === stream) {
          streamRef.current = null
          setCameraStatus('error')
          setCameraError({ code: 'disconnected', ...CAMERA_ERRORS.disconnected })
        }
      })
      setCameraStatus('ready')
    } catch (err) {
      setCameraStatus('error')
      setCameraError(mapCameraError(err))
    }
  }, [])

  useEffect(() => {
    if (!cameraActive) {
      stopCamera()
      return
    }
    void startCamera()
    return () => stopCamera()
  }, [cameraActive, startCamera, stopCamera])

  useEffect(() => {
    if (!detectActive || cameraStatus !== 'ready') {
      setDetectStatus('standby')
      return
    }
    let cancelled = false
    let rafId = 0
    let lastRun = 0
    setDetectStatus('loading')
    setModelError(null)
    loadHandLandmarker()
      .then((l) => {
        if (cancelled) return
        landmarkerRef.current = l
        setDetectStatus('tracking')
      })
      .catch(() => {
        if (cancelled) return
        setDetectStatus('error')
        setModelError('The hand-tracking model could not be loaded. Check your connection and reload the page.')
      })
    const tick = (ts: number) => {
      rafId = requestAnimationFrame(tick)
      if (!detectActiveRef.current) return
      if (ts - lastRun < DETECT_INTERVAL_MS) return
      const video = videoElRef.current
      const landmarker = landmarkerRef.current
      if (!video || !landmarker || video.readyState < 2) return
      lastRun = ts
      const canvas = canvasRef.current
      if (canvas && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
      }
      let hands: DetectedHand[] = []
      try {
        hands = detectHands(landmarker, video, performance.now()).hands
      } catch {
        return
      }
      handsRef.current = hands
      if (canvas) {
        drawHandOverlay(canvas, hands, {
          accent: 'rgba(212, 244, 60, 0.95)',
          accentSoft: 'rgba(212, 244, 60, 0.22)',
          muted: 'rgba(255, 255, 255, 0.75)',
        })
      }
      setHandCount((prev) => (prev === hands.length ? prev : hands.length))
      const tracker = trackerRef.current
      let nextGesture: GestureResult | null = null
      if (hands.length === 1) {
        nextGesture = readGesture(hands[0])
        setGesture((prev) => {
          if (
            prev &&
            prev.number === nextGesture!.number &&
            prev.extendedCount === nextGesture!.extendedCount &&
            Math.abs(prev.confidence - nextGesture!.confidence) < 0.08
          ) {
            return prev
          }
          return nextGesture
        })
      } else {
        setGesture((prev) => (prev === null ? prev : null))
      }
      const next = tracker.push(
        nextGesture ? { number: nextGesture.number, confidence: nextGesture.confidence } : null,
        hands.length,
      )
      setStability((prev) =>
        prev.status === next.status &&
        prev.number === next.number &&
        prev.message === next.message &&
        prev.multipleHands === next.multipleHands &&
        prev.handPresent === next.handPresent &&
        Math.abs(prev.progress - next.progress) < 0.09
          ? prev
          : next,
      )
    }
    rafId = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [detectActive, cameraStatus])

  const resetLock = useCallback(() => {
    trackerRef.current.reset()
    setStability(IDLE_STABILITY)
  }, [])

  return {
    videoRef,
    canvasRef,
    camera: { status: cameraStatus, error: cameraError },
    detectStatus,
    modelError,
    handCount,
    gesture,
    stability,
    startCamera,
    stopCamera,
    resetLock,
  }
}
