import { describe, expect, it } from 'vitest'
import { GestureStabilityTracker } from './gestureStability'

const CONFIDENT = 0.9

function good(number: number) {
  return { number, confidence: CONFIDENT }
}

function pushSteady(tracker: GestureStabilityTracker, number: number, frames: number) {
  let last = tracker.push(good(number), 1)
  for (let i = 1; i < frames; i++) last = tracker.push(good(number), 1)
  return last
}

describe('GestureStabilityTracker', () => {
  it('starts idle with a helpful message', () => {
    const t = new GestureStabilityTracker()
    const s = t.push(null, 0)
    expect(s.status).toBe('idle')
    expect(s.handPresent).toBe(false)
    expect(s.number).toBeNull()
    expect(s.message).toBe('Place your hand inside the frame')
  })

  it('locks after the required number of consistent frames', () => {
    const t = new GestureStabilityTracker()
    const state = pushSteady(t, 4, 6)
    expect(state.status).toBe('locked')
    expect(state.number).toBe(4)
    expect(state.progress).toBe(1)
    expect(t.isLocked).toBe(true)
  })

  it('reports partial progress while seeking', () => {
    const one = new GestureStabilityTracker()
    expect(pushSteady(one, 3, 1).progress).toBeCloseTo(1 / 6)

    const half = new GestureStabilityTracker()
    expect(pushSteady(half, 3, 3).progress).toBeCloseTo(0.5)

    const nearly = new GestureStabilityTracker()
    expect(pushSteady(nearly, 3, 5).status).toBe('seeking')
    expect(pushSteady(nearly, 3, 1).status).toBe('locked')
  })

  it('stays locked once the window is satisfied', () => {
    const t = new GestureStabilityTracker()
    pushSteady(t, 5, 6)
    expect(t.push(good(2), 1).number).toBe(5)
    expect(t.push(good(6), 1).number).toBe(5)
  })

  it('restarts the window when the number changes', () => {
    const t = new GestureStabilityTracker()
    pushSteady(t, 2, 5)
    const state = t.push(good(4), 1)
    expect(state.status).toBe('seeking')
    expect(state.number).toBe(4)
    expect(state.progress).toBeCloseTo(1 / 6)
    expect(t.isLocked).toBe(false)
  })

  it('decays gradually through tracking blips', () => {
    const t = new GestureStabilityTracker()
    pushSteady(t, 4, 4)
    t.push(null, 0) // loses 2 of the 4 frames, keeps the candidate
    const after = t.push(good(4), 1)
    expect(after.number).toBe(4)
    expect(after.status).toBe('seeking')
    expect(t.isLocked).toBe(false)
  })

  it('treats a low-confidence read as no progress', () => {
    const t = new GestureStabilityTracker()
    pushSteady(t, 4, 5)
    const state = t.push({ number: 4, confidence: 0.2 }, 1)
    expect(state.status).toBe('seeking')
    expect(state.confidence).toBeCloseTo(0.2)
    expect(state.message).toBe('Hold your gesture steady')
    expect(t.isLocked).toBe(false)
  })

  it('asks for a single hand when two are visible', () => {
    const t = new GestureStabilityTracker()
    pushSteady(t, 4, 4)
    const state = t.push(good(4), 2)
    expect(state.multipleHands).toBe(true)
    expect(state.handPresent).toBe(true)
    expect(state.number).toBeNull()
    expect(state.message).toBe('Please show only one hand')
  })

  it('goes idle when the hand leaves the frame', () => {
    const t = new GestureStabilityTracker()
    pushSteady(t, 4, 3)
    const state = t.push(null, 0)
    expect(state.status).toBe('idle')
    expect(state.handPresent).toBe(false)
  })

  it('can be reset mid-match', () => {
    const t = new GestureStabilityTracker()
    pushSteady(t, 6, 6)
    expect(t.isLocked).toBe(true)
    t.reset()
    expect(t.isLocked).toBe(false)
    expect(t.push(good(6), 1).progress).toBeCloseTo(1 / 6)
  })

  it('honours a custom frame requirement', () => {
    const t = new GestureStabilityTracker(2, 0.6)
    expect(t.push(good(3), 1).status).toBe('seeking')
    expect(t.push(good(3), 1).status).toBe('locked')
  })
})
