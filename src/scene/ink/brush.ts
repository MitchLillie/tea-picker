/**
 * Procedural ink geometry. Everything is generated from a seeded RNG, so the
 * landscape is identical on every visit while costing almost nothing to ship.
 */

export type Rng = () => number

/** mulberry32: tiny, fast, good enough for art. */
export const rng = (seed: number): Rng => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const range = (r: Rng, lo: number, hi: number) => lo + r() * (hi - lo)

const f = (n: number) => Math.round(n * 10) / 10

/** Closed smooth path through points (Catmull-Rom → cubic Bézier). */
export const smoothClosed = (pts: [number, number][]) => {
  const n = pts.length
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`
  }
  return `${d}Z`
}

/** Open smooth path through points. */
export const smoothOpen = (pts: [number, number][]) => {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d
}

/** An ink dab: an ellipse with a ragged, wet edge. */
export const blob = (
  r: Rng,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  jag = 0.18,
  n = 14
) => {
  const pts: [number, number][] = []
  const phase = r() * Math.PI * 2
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const k = 1 + (r() - 0.5) * 2 * jag + Math.sin(a * 3 + phase) * jag * 0.4
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k])
  }
  return smoothClosed(pts)
}

/**
 * A tapered brush stroke along a polyline: width swells from w0 to a belly
 * and lifts off to w1, like a loaded brush.
 */
export const stroke = (
  r: Rng,
  pts: [number, number][],
  w0: number,
  w1: number,
  wobble = 0.15
) => {
  const left: [number, number][] = []
  const right: [number, number][] = []
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const [x, y] = pts[i]
    const [ax, ay] = pts[Math.max(0, i - 1)]
    const [bx, by] = pts[Math.min(n - 1, i + 1)]
    let nx = -(by - ay)
    let ny = bx - ax
    const len = Math.hypot(nx, ny) || 1
    nx /= len
    ny /= len
    const belly = Math.sin(Math.PI * Math.min(1, t * 1.4)) * 0.35 + 1
    const w = (w0 + (w1 - w0) * t) * belly * (1 + (r() - 0.5) * wobble) * 0.5
    left.push([x + nx * w, y + ny * w])
    right.push([x - nx * w, y - ny * w])
  }
  return smoothClosed([...left, ...right.reverse()])
}

/**
 * A mountain ridge: layered sine noise with a few dominant peaks, closed
 * down to `bottom`.
 */
export const ridge = (
  r: Rng,
  width: number,
  baseY: number,
  amp: number,
  bottom: number,
  peaks = 3
) => {
  const waves = Array.from({length: 4}, (_, i) => ({
    k: (i + 1) * (0.6 + r() * 0.8),
    a: amp / (i + 1.2),
    p: r() * Math.PI * 2,
  }))
  const centres = Array.from({length: peaks}, () => ({
    x: range(r, 0.08, 0.92) * width,
    h: range(r, 0.5, 1) * amp,
    s: range(r, 0.08, 0.18) * width,
  }))
  const pts: [number, number][] = []
  const steps = 36
  const margin = width * 0.15
  for (let i = 0; i <= steps; i++) {
    const x = -margin + (i / steps) * (width + margin * 2)
    let y = baseY
    for (const w of waves) y -= Math.sin((x / width) * Math.PI * w.k + w.p) * w.a * 0.35
    for (const c of centres) y -= c.h * Math.exp(-(((x - c.x) / c.s) ** 2))
    pts.push([x, y])
  }
  const top = smoothOpen(pts)
  return {
    d: `${top}L${width + margin} ${bottom}L${-margin} ${bottom}Z`,
    pts,
  }
}

/**
 * Texture strokes (皴法) hanging from a ridge line: short, slanted, darker
 * marks that model the rock face.
 */
export const cun = (r: Rng, ridgePts: [number, number][], count: number, len: number) => {
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const j = 1 + Math.floor(r() * (ridgePts.length - 3))
    const [x0, y0] = ridgePts[j]
    const [x1, y1] = ridgePts[j + 1]
    const t = r()
    const x = x0 + (x1 - x0) * t
    const y = y0 + (y1 - y0) * t + range(r, 2, len * 1.6)
    const slope = Math.atan2(y1 - y0, x1 - x0)
    const ang = slope + Math.PI / 2 + range(r, -0.5, 0.5) + (y1 < y0 ? -0.4 : 0.4)
    const l = range(r, len * 0.4, len)
    out.push(
      stroke(
        r,
        [
          [x, y],
          [x + Math.cos(ang) * l * 0.5, y + Math.sin(ang) * l * 0.5 + range(r, -1, 1)],
          [x + Math.cos(ang) * l, y + Math.sin(ang) * l],
        ],
        range(r, 1.2, 2.6),
        0.3
      )
    )
  }
  return out
}
