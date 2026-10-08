export type Pattern = 'tap' | 'victory' | 'defeat' | 'wicket' | 'none'

/** Optional haptics. Never throws and no-ops where unsupported. */
export function buzz(pattern: Pattern = 'tap'): void {
  try {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return

    let seq: number | number[] = 0
    if (pattern === 'tap') seq = 12
    else if (pattern === 'wicket') seq = [40, 40, 70]
    else if (pattern === 'victory') seq = [30, 60, 30, 60, 90]
    else if (pattern === 'defeat') seq = [90, 60, 90]

    if (seq) navigator.vibrate(seq)
  } catch {
    /* some browsers reject vibration outside user gestures */
  }
}
