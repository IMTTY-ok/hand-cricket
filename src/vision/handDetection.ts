import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

/**
 * Thin, cached wrapper around the MediaPipe Tasks HandLandmarker.
 *
 * Everything (wasm + model) is served from our own `public/` folder so the
 * app works offline and never sends camera frames anywhere.
 */

export interface DetectedHand {
  /** 21 normalised (0..1) landmarks in MediaPipe's hand topology. */
  landmarks: { x: number; y: number; z: number }[]
  handedness: string
  score: number
}

export interface HandDetection {
  hands: DetectedHand[]
}

const WASM_PATH = '/wasm'
const MODEL_PATH = '/models/hand_landmarker.task'

let landmarkerPromise: Promise<HandLandmarker> | null = null

async function createLandmarker(delegate: 'GPU' | 'CPU'): Promise<HandLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH)
  return HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_PATH, delegate },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })
}

export function loadHandLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      try {
        return await createLandmarker('GPU')
      } catch {
        // Some devices have no usable WebGL2 compute path — fall back to WASM.
        return await createLandmarker('CPU')
      }
    })().catch((err: unknown) => {
      landmarkerPromise = null
      throw err
    })
  }
  return landmarkerPromise
}

export function detectHands(
  landmarker: HandLandmarker,
  video: HTMLVideoElement,
  timestampMs: number,
): HandDetection {
  const result = landmarker.detectForVideo(video, timestampMs)
  const hands: DetectedHand[] = []

  for (let i = 0; i < result.landmarks.length; i++) {
    const first = result.handednesses?.[i]?.[0]
    hands.push({
      landmarks: result.landmarks[i],
      handedness: first?.categoryName ?? 'Hand',
      score: first?.score ?? 1,
    })
  }

  return { hands }
}
