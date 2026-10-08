/**
 * Stability window.
 *
 * A single frame is never enough: MediaPipe can flicker for a frame or two
 * while a hand is moving, and a player mid-transition will momentarily look
 * like a different number. We therefore only accept a gesture after the *same*
 * number has been read for `requiredFrames` consecutive confident frames.
 */

export type StabilityStatus = 'idle' | 'seeking' | 'locked'

export interface StabilityState {
  status: StabilityStatus
  /** The number currently being tracked (or the locked number). */
  number: number | null
  /** 0..1 progress towards a lock. */
  progress: number
  confidence: number
  handPresent: boolean
  multipleHands: boolean
  message: string
}

export interface FrameReading {
  number: number
  confidence: number
}

const IDLE: StabilityState = {
  status: 'idle',
  number: null,
  progress: 0,
  confidence: 0,
  handPresent: false,
  multipleHands: false,
  message: 'Place your hand inside the frame',
}

export class GestureStabilityTracker {
  private candidate: number | null = null
  private streak = 0
  private confidences: number[] = []
  private locked: StabilityState | null = null

  private readonly requiredFrames: number
  private readonly minConfidence: number

  constructor(requiredFrames = 6, minConfidence = 0.6) {
    this.requiredFrames = requiredFrames
    this.minConfidence = minConfidence
  }

  get isLocked(): boolean {
    return this.locked !== null
  }

  reset(): void {
    this.candidate = null
    this.streak = 0
    this.confidences = []
    this.locked = null
  }

  push(reading: FrameReading | null, handCount: number): StabilityState {
    if (this.locked) return this.locked

    if (handCount === 0) {
      this.decay()
      return { ...IDLE }
    }

    if (handCount > 1) {
      this.decay()
      return {
        status: 'seeking',
        number: null,
        progress: 0,
        confidence: 0,
        handPresent: true,
        multipleHands: true,
        message: 'Please show only one hand',
      }
    }

    if (!reading || reading.confidence < this.minConfidence) {
      this.decay()
      return {
        status: 'seeking',
        number: this.candidate,
        progress: this.streak / this.requiredFrames,
        confidence: reading?.confidence ?? 0,
        handPresent: true,
        multipleHands: false,
        message: 'Hold your gesture steady',
      }
    }

    if (reading.number === this.candidate) {
      this.streak += 1
      this.confidences.push(reading.confidence)
    } else {
      this.candidate = reading.number
      this.streak = 1
      this.confidences = [reading.confidence]
    }

    const progress = Math.min(this.streak / this.requiredFrames, 1)
    const confidence =
      this.confidences.reduce((a, b) => a + b, 0) / Math.max(this.confidences.length, 1)

    if (this.streak >= this.requiredFrames) {
      this.locked = {
        status: 'locked',
        number: this.candidate,
        progress: 1,
        confidence,
        handPresent: true,
        multipleHands: false,
        message: 'Locked',
      }
      return this.locked
    }

    return {
      status: 'seeking',
      number: this.candidate,
      progress,
      confidence,
      handPresent: true,
      multipleHands: false,
      message: 'Hold your gesture steady',
    }
  }

  private decay(): void {
    // Grace period: lose progress gradually rather than snapping to zero, so a
    // brief tracking blip does not restart the whole lock animation.
    this.streak = Math.max(0, this.streak - 2)
    this.confidences = []
    if (this.streak === 0) this.candidate = null
  }
}
