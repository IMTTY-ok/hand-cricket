/**
 * Tiny synthesised sound engine.
 *
 * All audio is generated with the Web Audio API — no asset files, no network
 * requests and nothing to autoplay. The context is created lazily on the first
 * sound, which is always triggered by a user interaction, satisfying browser
 * autoplay policies.
 */

export type SoundName =
  | 'tap'
  | 'lock'
  | 'coin'
  | 'tossWin'
  | 'tossLose'
  | 'countdown'
  | 'go'
  | 'run'
  | 'four'
  | 'six'
  | 'wicket'
  | 'victory'
  | 'defeat'
  | 'error'

class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private enabled = true
  private volume = 0.32

  setEnabled(value: boolean): void {
    this.enabled = value
    if (value) this.unlock()
  }

  isEnabled(): boolean {
    return this.enabled
  }

  /** Resume the audio context from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (!this.enabled) return
    const ctx = this.ensure()
    if (ctx && ctx.state === 'suspended') void ctx.resume()
  }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      try {
        this.ctx = new Ctor()
        this.master = this.ctx.createGain()
        this.master.gain.value = this.volume
        this.master.connect(this.ctx.destination)
      } catch {
        return null
      }
    }
    return this.ctx
  }

  private tone(
    ctx: AudioContext,
    opts: {
      freq: number
      start: number
      dur: number
      type?: OscillatorType
      gain?: number
      slideTo?: number
    },
  ): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t0 = ctx.currentTime + opts.start
    osc.type = opts.type ?? 'sine'
    osc.frequency.setValueAtTime(opts.freq, t0)
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + opts.dur)

    const peak = opts.gain ?? 0.5
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.02, opts.dur * 0.2))
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur)

    osc.connect(gain)
    gain.connect(this.master!)
    osc.start(t0)
    osc.stop(t0 + opts.dur + 0.05)
  }

  private noise(ctx: AudioContext, start: number, dur: number, gain = 0.25): void {
    const frames = Math.floor(ctx.sampleRate * dur)
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1400
    const g = ctx.createGain()
    g.gain.value = gain
    src.connect(filter)
    filter.connect(g)
    g.connect(this.master!)
    src.start(ctx.currentTime + start)
  }

  play(name: SoundName): void {
    if (!this.enabled) return
    const ctx = this.ensure()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()

    switch (name) {
      case 'tap':
        this.tone(ctx, { freq: 640, start: 0, dur: 0.07, type: 'triangle', gain: 0.35 })
        break
      case 'lock':
        this.tone(ctx, { freq: 760, start: 0, dur: 0.07, type: 'triangle', gain: 0.4 })
        this.tone(ctx, { freq: 1180, start: 0.06, dur: 0.1, type: 'sine', gain: 0.3 })
        break
      case 'coin':
        this.tone(ctx, { freq: 900, start: 0, dur: 0.08, type: 'square', gain: 0.18 })
        this.tone(ctx, { freq: 1350, start: 0.1, dur: 0.1, type: 'square', gain: 0.15 })
        this.tone(ctx, { freq: 700, start: 0.24, dur: 0.16, type: 'sine', gain: 0.25 })
        break
      case 'tossWin':
        this.tone(ctx, { freq: 660, start: 0, dur: 0.12, type: 'triangle', gain: 0.4 })
        this.tone(ctx, { freq: 880, start: 0.1, dur: 0.2, type: 'triangle', gain: 0.4 })
        break
      case 'tossLose':
        this.tone(ctx, { freq: 520, start: 0, dur: 0.14, type: 'sine', gain: 0.35 })
        this.tone(ctx, { freq: 380, start: 0.12, dur: 0.24, type: 'sine', gain: 0.35 })
        break
      case 'countdown':
        this.tone(ctx, { freq: 520, start: 0, dur: 0.14, type: 'sine', gain: 0.4 })
        break
      case 'go':
        this.tone(ctx, { freq: 660, start: 0, dur: 0.1, type: 'triangle', gain: 0.45 })
        this.tone(ctx, { freq: 990, start: 0.08, dur: 0.3, type: 'triangle', gain: 0.45 })
        break
      case 'run':
        this.tone(ctx, { freq: 500, start: 0, dur: 0.1, type: 'triangle', gain: 0.35, slideTo: 660 })
        break
      case 'four':
        this.tone(ctx, { freq: 587, start: 0, dur: 0.1, type: 'triangle', gain: 0.4 })
        this.tone(ctx, { freq: 784, start: 0.09, dur: 0.1, type: 'triangle', gain: 0.4 })
        this.tone(ctx, { freq: 1047, start: 0.18, dur: 0.26, type: 'triangle', gain: 0.4 })
        break
      case 'six':
        this.tone(ctx, { freq: 523, start: 0, dur: 0.09, type: 'triangle', gain: 0.45 })
        this.tone(ctx, { freq: 659, start: 0.08, dur: 0.09, type: 'triangle', gain: 0.45 })
        this.tone(ctx, { freq: 784, start: 0.16, dur: 0.09, type: 'triangle', gain: 0.45 })
        this.tone(ctx, { freq: 1047, start: 0.24, dur: 0.42, type: 'triangle', gain: 0.5 })
        this.noise(ctx, 0.24, 0.3, 0.14)
        break
      case 'wicket':
        this.tone(ctx, { freq: 200, start: 0, dur: 0.34, type: 'sawtooth', gain: 0.4, slideTo: 70 })
        this.noise(ctx, 0, 0.2, 0.2)
        break
      case 'victory':
        this.tone(ctx, { freq: 523, start: 0, dur: 0.2, type: 'triangle', gain: 0.45 })
        this.tone(ctx, { freq: 659, start: 0.14, dur: 0.2, type: 'triangle', gain: 0.45 })
        this.tone(ctx, { freq: 784, start: 0.28, dur: 0.2, type: 'triangle', gain: 0.45 })
        this.tone(ctx, { freq: 1047, start: 0.42, dur: 0.6, type: 'triangle', gain: 0.5 })
        break
      case 'defeat':
        this.tone(ctx, { freq: 440, start: 0, dur: 0.24, type: 'sine', gain: 0.4 })
        this.tone(ctx, { freq: 349, start: 0.2, dur: 0.24, type: 'sine', gain: 0.4 })
        this.tone(ctx, { freq: 261, start: 0.4, dur: 0.5, type: 'sine', gain: 0.4 })
        break
      case 'error':
        this.tone(ctx, { freq: 300, start: 0, dur: 0.16, type: 'square', gain: 0.14 })
        break
    }
  }
}

export const sound = new SoundEngine()
