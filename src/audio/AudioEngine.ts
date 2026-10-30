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
  /** Fade length of a requested start that is waiting for a gesture. */
  private wanted: number | null = null
  private listening = false
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
   * 'blocked' means the WebView wants a user gesture first; in that case the
   * engine keeps listening and starts on the next tap anywhere.
   *
   * iOS only unlocks audio when resume() is called synchronously inside a
   * gesture handler, so resume() is requested here before any await.
   */
  start(fadeSeconds = 4): Promise<'playing' | 'blocked' | 'unavailable'> {
    if (!this.url || !AC || this.closed) return Promise.resolve('unavailable')
    this.ensure()
    const ctx = this.ctx
    if (!ctx || !this.gain) return Promise.resolve('unavailable')
    this.wanted = fadeSeconds
    const resumed = ctx.resume().then(
      () => true,
      () => false
    )
    return this.play(resumed, fadeSeconds)
  }

  private async play(resumed: Promise<boolean>, fadeSeconds: number) {
    const ctx = this.ctx!
    // resume() can stay pending forever without a gesture rather than reject.
    await Promise.race([resumed, new Promise(r => setTimeout(r, 1000))])
    if (ctx.state !== 'running') {
      this.listenForGesture()
      return 'blocked' as const
    }
    const buffer = await this.buffer
    if (!buffer || this.closed) return 'unavailable' as const
    // No await between this check and start(), so only one source is ever made.
    if (!this.source) {
      this.source = ctx.createBufferSource()
      this.source.buffer = buffer
      // Played once, not looped: it accompanies the climb and fades out by itself.
      this.source.connect(this.gain!)
      this.source.start()
    }
    this.wanted = null
    this.ramp(this.muted ? 0 : this.level, fadeSeconds)
    return 'playing' as const
  }

  /** Until audio is running, the next tap anywhere unlocks it and plays. */
  private listenForGesture() {
    if (this.listening || typeof document === 'undefined') return
    this.listening = true
    const unlock = () => {
      const ctx = this.ctx
      if (!ctx || this.closed) return
      ctx.resume().catch(() => undefined)
      // A one-sample silent buffer, started inside the gesture, unlocks older WebKit.
      const silent = ctx.createBufferSource()
      silent.buffer = ctx.createBuffer(1, 1, 22050)
      silent.connect(ctx.destination)
      silent.start(0)
      if (this.wanted !== null) this.play(Promise.resolve(true), this.wanted)
      setTimeout(() => {
        if (ctx.state === 'running') {
          document.removeEventListener('touchend', unlock, true)
          document.removeEventListener('click', unlock, true)
          this.listening = false
        }
      }, 300)
    }
    document.addEventListener('touchend', unlock, true)
    document.addEventListener('click', unlock, true)
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
