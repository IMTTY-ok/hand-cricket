import { describe, expect, it } from 'vitest'
import type { DetectedHand } from './handDetection'
import { countToNumber, GESTURE_GUIDE, readGesture } from './gestureRecognition'

type Pt = { x: number; y: number }

/** Fully straight finger: PIP and DIP both sit at ~180 degrees. */
function straightChain(mcp: Pt): [Pt, Pt, Pt, Pt] {
  return [
    mcp,
    { x: mcp.x, y: mcp.y - 0.1 },
    { x: mcp.x, y: mcp.y - 0.2 },
    { x: mcp.x, y: mcp.y - 0.3 },
  ]
}

/** Folded finger: the tip doubles back over the PIP at roughly 40 degrees. */
function curledChain(mcp: Pt): [Pt, Pt, Pt, Pt] {
  return [
    mcp,
    { x: mcp.x, y: mcp.y - 0.1 },
    { x: mcp.x + 0.03215, y: mcp.y - 0.0617 },
    { x: mcp.x + 0.0643, y: mcp.y - 0.0234 },
  ]
}

const MCP_BY_CHAIN = [
  { x: 0.38, y: 0.6 }, // index
  { x: 0.47, y: 0.58 }, // middle
  { x: 0.56, y: 0.6 }, // ring
  { x: 0.65, y: 0.64 }, // pinky
]

function makeHand(opts: { thumb: boolean; fingers: [boolean, boolean, boolean, boolean] }): DetectedHand {
  const lm: Pt[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }))
  const starts = [5, 9, 13, 17]

  MCP_BY_CHAIN.forEach((mcp, i) => {
    const chain = opts.fingers[i] ? straightChain(mcp) : curledChain(mcp)
    chain.forEach((pt, j) => {
      lm[starts[i] + j] = pt
    })
  })

  lm[0] = { x: 0.5, y: 0.95 } // wrist
  lm[1] = { x: 0.4, y: 0.9 } // thumb cmc
  lm[2] = { x: 0.32, y: 0.72 } // thumb mcp
  lm[3] = opts.thumb ? { x: 0.24, y: 0.6 } : { x: 0.36, y: 0.66 }
  lm[4] = opts.thumb ? { x: 0.16, y: 0.5 } : { x: 0.42, y: 0.62 }

  return {
    landmarks: lm.map((p) => ({ x: p.x, y: p.y, z: 0 })),
    handedness: 'Right',
    score: 0.98,
  }
}

describe('countToNumber', () => {
  it('maps an open fist to six', () => {
    expect(countToNumber(0)).toBe(6)
  })

  it('maps extended fingers one to one', () => {
    expect(countToNumber(1)).toBe(1)
    expect(countToNumber(2)).toBe(2)
    expect(countToNumber(3)).toBe(3)
    expect(countToNumber(4)).toBe(4)
    expect(countToNumber(5)).toBe(5)
  })

  it('clamps anything beyond five', () => {
    expect(countToNumber(6)).toBe(5)
    expect(countToNumber(99)).toBe(5)
  })
})

describe('readGesture', () => {
  it('reads an open palm as five', () => {
    const r = readGesture(makeHand({ thumb: true, fingers: [true, true, true, true] }))
    expect(r.extendedCount).toBe(5)
    expect(r.number).toBe(5)
    expect(r.fingers).toEqual({ thumb: true, index: true, middle: true, ring: true, pinky: true })
    expect(r.confidence).toBeGreaterThan(0.5)
  })

  it('reads a closed fist as six', () => {
    const r = readGesture(makeHand({ thumb: false, fingers: [false, false, false, false] }))
    expect(r.extendedCount).toBe(0)
    expect(r.number).toBe(6)
    expect(r.confidence).toBeGreaterThan(0.5)
  })

  it('reads four fingers with the thumb tucked', () => {
    const r = readGesture(makeHand({ thumb: false, fingers: [true, true, true, true] }))
    expect(r.number).toBe(4)
    expect(r.fingers.thumb).toBe(false)
  })

  it('counts a spread thumb alongside three fingers as four', () => {
    const r = readGesture(makeHand({ thumb: true, fingers: [true, false, true, true] }))
    expect(r.extendedCount).toBe(4)
    expect(r.number).toBe(4)
    expect(r.fingers.middle).toBe(false)
  })

  it('reads one, two and three fingers', () => {
    expect(readGesture(makeHand({ thumb: false, fingers: [true, false, false, false] })).number).toBe(1)
    expect(readGesture(makeHand({ thumb: false, fingers: [true, true, false, false] })).number).toBe(2)
    expect(readGesture(makeHand({ thumb: false, fingers: [true, true, true, false] })).number).toBe(3)
  })

  it('reads a lone thumb as one', () => {
    const r = readGesture(makeHand({ thumb: true, fingers: [false, false, false, false] }))
    expect(r.extendedCount).toBe(1)
    expect(r.number).toBe(1)
  })

  it('always returns a number in 1..6', () => {
    const combos: Array<[boolean, [boolean, boolean, boolean, boolean]]> = [
      [false, [false, false, false, false]],
      [true, [true, true, true, true]],
      [false, [true, false, true, false]],
      [true, [false, true, false, true]],
    ]
    for (const [thumb, fingers] of combos) {
      const r = readGesture(makeHand({ thumb, fingers }))
      expect(r.number).toBeGreaterThanOrEqual(1)
      expect(r.number).toBeLessThanOrEqual(6)
    }
  })
})

describe('GESTURE_GUIDE', () => {
  it('documents every number exactly once', () => {
    expect(GESTURE_GUIDE).toHaveLength(6)
    expect(GESTURE_GUIDE.map((g) => g.number)).toEqual([1, 2, 3, 4, 5, 6])
    for (const entry of GESTURE_GUIDE) {
      expect(entry.label.length).toBeGreaterThan(0)
      expect(entry.hint.length).toBeGreaterThan(0)
    }
  })
})
