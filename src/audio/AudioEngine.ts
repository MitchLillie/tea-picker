/**
 * The opening music, played once through Web Audio so fades and
 * volume work on iOS (where HTMLMediaElement.volume is read-only).
 *
 * WebViews may refuse to start audio before a user gesture; `start()` reports
 * whether sound is actually running so the intro can offer a tap-to-enter seal.
 */
type Ctx = AudioContext

const AC: typeof AudioContext | undefined =
  typeof window === 'undefined'
    ? undefined
    : window.AudioContext ??
      (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext

export class AudioEngine {
  private ctx: Ctx | null = null
  private gain: GainNode | null = null
  private buffer: Promise<AudioBuffer | null> | null = null
  private source: AudioBufferSourceNode | null = null
  private level = 0.7
  private muted = false
  private starting: Promise<'playing' | 'blocked' | 'unavailable'> | null = null
  private closed = false

  constructor(private url: string | null) {}

  private ensure() {
    if (this.ctx || !AC) return
    this.ctx = new AC()
    this.gain = this.ctx.createGain()
    this.gain.gain.value = 0
    this.gain.connect(this.ctx.destination)
    const ctx = this.ctx
    this.buffer = this.url
      ? fetch(this.url)
          .then(r => r.arrayBuffer())
          .then(
            data =>
              new Promise<AudioBuffer>((resolve, reject) =>
                // Callback form for older WebKit.
                ctx.decodeAudioData(data, resolve, reject)
              )
          )
          .catch(() => null)
      : Promise.resolve(null)
  }

  /**
   * Begin (or resume) playback with a slow fade.
   * 'blocked' means the WebView wants a user gesture first.
   */
  start(fadeSeconds = 4): Promise<'playing' | 'blocked' | 'unavailable'> {
    // Overlapping calls (StrictMode effects, focus events) share one attempt,
    // so there is never more than one source playing.
    if (!this.starting) {
      this.starting = this.begin(fadeSeconds).finally(() => {
        this.starting = null
      })
    }
    return this.starting
  }

  private async begin(fadeSeconds: number): Promise<'playing' | 'blocked' | 'unavailable'> {
    if (!this.url || !AC || this.closed) return 'unavailable'
    this.ensure()
    const ctx = this.ctx
    if (!ctx || !this.gain) return 'unavailable'
    try {
      await ctx.resume()
    } catch {
      return 'blocked'
    }
    if (ctx.state !== 'running') return 'blocked'
    const buffer = await this.buffer
    if (!buffer || this.closed) return 'unavailable'
    if (!this.source) {
      this.source = ctx.createBufferSource()
      this.source.buffer = buffer
      // Played once, not looped: it accompanies the climb and fades out by itself.
      this.source.connect(this.gain)
      this.source.start()
    }
    this.ramp(this.muted ? 0 : this.level, fadeSeconds)
    return 'playing'
  }

  get running() {
    return this.ctx?.state === 'running' && !!this.source
  }

  setVolume(level: number) {
    this.level = level
    if (!this.muted) this.ramp(level, 0.3)
  }

  /** Muting fades out, then suspends the audio entirely; unmuting resumes it. */
  setMuted(muted: boolean) {
    this.muted = muted
    const ctx = this.ctx
    if (!ctx) return
    if (muted) {
      this.ramp(0, 0.4)
      setTimeout(() => {
        if (this.muted) ctx.suspend().catch(() => undefined)
      }, 450)
    } else {
      ctx.resume().catch(() => undefined)
      this.ramp(this.level, 1.5)
    }
  }

  /** Stop for good and release the audio hardware. */
  close() {
    this.closed = true
    try {
      this.source?.stop()
    } catch {
      // already stopped
    }
    this.ctx?.close().catch(() => undefined)
  }

  /** Lower the music briefly, e.g. while the picker speaks. */
  duck(on: boolean) {
    if (!this.muted) this.ramp(on ? this.level * 0.45 : this.level, 0.8)
  }

  /** The Shop app backgrounded the Mini: fade out and suspend. */
  async suspend() {
    if (!this.ctx) return
    this.ramp(0, 0.4)
    await new Promise(r => setTimeout(r, 450))
    await this.ctx.suspend().catch(() => undefined)
  }

  private ramp(to: number, seconds: number) {
    if (!this.ctx || !this.gain) return
    const now = this.ctx.currentTime
    const g = this.gain.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(to, now + Math.max(0.01, seconds))
  }
}
