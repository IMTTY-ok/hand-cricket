import type { DetectedHand } from './handDetection'

/**
 * Canvas overlay drawn on top of the mirrored <video>.
 *
 * The canvas shares the video's intrinsic size and `object-fit: cover` box,
 * so normalised landmark coordinates map 1:1 and stay aligned even when the
 * element is cropped by the responsive layout.
 */

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

export interface OverlayOptions {
  accent: string
  accentSoft: string
  muted: string
}

export function drawHandOverlay(
  canvas: HTMLCanvasElement,
  hands: DetectedHand[],
  opts: OverlayOptions,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  if (hands.length === 0) return

  const lineScale = Math.max(1.5, Math.min(w, h) / 220)

  for (const hand of hands) {
    const pts = hand.landmarks

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Soft glow pass.
    ctx.strokeStyle = opts.accentSoft
    ctx.lineWidth = lineScale * 4
    ctx.beginPath()
    for (const [a, b] of CONNECTIONS) {
      ctx.moveTo(pts[a].x * w, pts[a].y * h)
      ctx.lineTo(pts[b].x * w, pts[b].y * h)
    }
    ctx.stroke()

    // Crisp skeleton.
    ctx.strokeStyle = opts.accent
    ctx.lineWidth = lineScale * 1.6
    ctx.beginPath()
    for (const [a, b] of CONNECTIONS) {
      ctx.moveTo(pts[a].x * w, pts[a].y * h)
      ctx.lineTo(pts[b].x * w, pts[b].y * h)
    }
    ctx.stroke()

    // Joints.
    ctx.fillStyle = opts.muted
    for (const [x] of CONNECTIONS) {
      ctx.beginPath()
      ctx.arc(pts[x].x * w, pts[x].y * h, lineScale * 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Fingertips stand out so the player can see what is being read.
    const tips = [4, 8, 12, 16, 20]
    ctx.fillStyle = opts.accent
    for (const tip of tips) {
      ctx.beginPath()
      ctx.arc(pts[tip].x * w, pts[tip].y * h, lineScale * 3.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

export function clearOverlay(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  ctx?.clearRect(0, 0, canvas.width, canvas.height)
}
