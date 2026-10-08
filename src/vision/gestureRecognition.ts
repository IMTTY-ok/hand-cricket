import type { DetectedHand } from './handDetection'

/**
 * Gesture recognition.
 *
 * MediaPipe gives us 21 2-D landmarks per hand. We convert those into a
 * per-finger "extended / curled" state, count the extended fingers and map
 * the count to a cricket number:
 *
 *   0 extended  -> 6   (closed fist)
 *   1 extended  -> 1   (index)
 *   2 extended  -> 2   (index + middle)
 *   3 extended  -> 3   (index + middle + ring)
 *   4 extended  -> 4   (four fingers, thumb tucked)
 *   5 extended  -> 5   (open palm)
 *
 * Every test below is built from *ratios and angles*, never absolute pixel
 * values, so it is independent of hand size, camera resolution, distance and
 * (because angles are rotation invariant) moderate hand rotation.
 */

export type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky'

export type FingerStates = Record<FingerName, boolean>

export interface GestureResult {
  /** 1..6 */
  number: number
  fingers: FingerStates
  extendedCount: number
  /** 0..1 — combines detector confidence with how unambiguous the pose is. */
  confidence: number
  /** 0..1 — how far the pose sits from a decision boundary. */
  clarity: number
}

/** MediaPipe hand topology. */
export const LM = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const

type Pt = { x: number; y: number }

const FINGER_CHAINS: Record<Exclude<FingerName, 'thumb'>, [number, number, number, number]> = {
  index: [LM.INDEX_MCP, LM.INDEX_PIP, LM.INDEX_DIP, LM.INDEX_TIP],
  middle: [LM.MIDDLE_MCP, LM.MIDDLE_PIP, LM.MIDDLE_DIP, LM.MIDDLE_TIP],
  ring: [LM.RING_MCP, LM.RING_PIP, LM.RING_DIP, LM.RING_TIP],
  pinky: [LM.PINKY_MCP, LM.PINKY_PIP, LM.PINKY_DIP, LM.PINKY_TIP],
}

function dist(a: Pt, b: Pt): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

/** Interior angle at `b` in degrees (0..180). */
function angleAt(a: Pt, b: Pt, c: Pt): number {
  const v1x = a.x - b.x
  const v1y = a.y - b.y
  const v2x = c.x - b.x
  const v2y = c.y - b.y
  const dot = v1x * v2x + v1y * v2y
  const m1 = Math.hypot(v1x, v1y)
  const m2 = Math.hypot(v2x, v2y)
  if (m1 === 0 || m2 === 0) return 180
  const cos = Math.min(1, Math.max(-1, dot / (m1 * m2)))
  return (Math.acos(cos) * 180) / Math.PI
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/**
 * Map a raw measurement onto a 0..1 "how extended is this?" score where
 * 0.5 is the decision boundary. Returning a continuous score (rather than a
 * boolean) lets us express *confidence*: poses far from 0.5 are unambiguous.
 */
function extensionScore(deg: number): number {
  // 130° = clearly curled, 170° = clearly straight.
  return clamp01((deg - 130) / 40)
}

/**
 * A finger is extended when both the PIP and DIP joints are nearly straight.
 * Using the *minimum* of the two keeps us conservative — a half-curled finger
 * is treated as curled, which is what a player showing "3" actually means.
 */
function readFinger(landmarks: Pt[], chain: [number, number, number, number]): {
  extended: boolean
  score: number
} {
  const [mcp, pip, dip, tip] = chain.map((i) => landmarks[i]) as [Pt, Pt, Pt, Pt]
  const pipAngle = angleAt(mcp, pip, tip)
  const dipAngle = angleAt(pip, dip, tip)
  const score = Math.min(extensionScore(pipAngle), extensionScore(dipAngle))
  return { extended: score >= 0.5, score }
}

/**
 * Thumb.
 *
 * The thumb is the trickiest finger: it has no clear "curl chain" like the
 * others and it folds *across* the palm. The most stable signal we found is
 * the distance from the thumb tip (4) to the index MCP (5), normalised by the
 * hand span (index MCP -> pinky MCP):
 *
 *   tucked across the palm  ->  ~0.10 – 0.30 of hand span
 *   abducted / extended     ->  ~0.55 – 1.00 of hand span
 *
 * We blend that with the angle at the thumb MCP, which collapses when the
 * thumb folds, so a borderline spread still needs a reasonably straight thumb.
 */
function readThumb(landmarks: Pt[]): { extended: boolean; score: number } {
  const handSpan = dist(landmarks[LM.INDEX_MCP], landmarks[LM.PINKY_MCP]) || 1e-6
  const spread = dist(landmarks[LM.THUMB_TIP], landmarks[LM.INDEX_MCP]) / handSpan
  const bendAngle = angleAt(landmarks[LM.THUMB_CMC], landmarks[LM.THUMB_MCP], landmarks[LM.THUMB_TIP])

  const spreadScore = clamp01((spread - 0.34) / 0.16) // 0.34 -> 0.50
  const angleScore = clamp01((bendAngle - 115) / 45) // 115° -> 160°
  const score = Math.max(spreadScore, angleScore * 0.85)

  return { extended: score >= 0.5, score }
}

/** Map the count of extended fingers onto the cricket number 1..6. */
export function countToNumber(count: number): number {
  return count === 0 ? 6 : Math.min(count, 5)
}

export function readGesture(hand: DetectedHand): GestureResult {
  const lm = hand.landmarks as Pt[]

  const thumb = readThumb(lm)
  const fingers: FingerStates = {
    thumb: thumb.extended,
    index: false,
    middle: false,
    ring: false,
    pinky: false,
  }
  const scores: number[] = [thumb.score]

  for (const name of ['index', 'middle', 'ring', 'pinky'] as const) {
    const read = readFinger(lm, FINGER_CHAINS[name])
    fingers[name] = read.extended
    scores.push(read.score)
  }

  const extendedCount = (Object.values(fingers) as boolean[]).filter(Boolean).length
  const clarity = scores.reduce((a, b) => a + Math.abs(b - 0.5) * 2, 0) / scores.length

  // Hand span is a good proxy for "is the hand big enough in frame to trust?"
  const handSpan = dist(lm[LM.INDEX_MCP], lm[LM.PINKY_MCP])
  const sizeFactor = clamp01(handSpan / 0.13)

  const confidence = clamp01(0.4 * hand.score + 0.6 * clarity) * (0.65 + 0.35 * sizeFactor)

  return {
    number: countToNumber(extendedCount),
    fingers,
    extendedCount,
    confidence,
    clarity,
  }
}

export interface GestureGuide {
  number: number
  label: string
  hint: string
}

/** Static reference used by Practice mode and the How-to-play screen. */
export const GESTURE_GUIDE: GestureGuide[] = [
  { number: 1, label: 'Index finger', hint: 'One finger up' },
  { number: 2, label: 'Index + middle', hint: 'Two fingers up' },
  { number: 3, label: 'Three fingers', hint: 'Index, middle, ring' },
  { number: 4, label: 'Four fingers', hint: 'Tuck your thumb in' },
  { number: 5, label: 'Open palm', hint: 'All five fingers' },
  { number: 6, label: 'Closed fist', hint: 'Make a fist' },
]
