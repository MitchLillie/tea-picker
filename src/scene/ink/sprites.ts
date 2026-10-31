import {blob, range, rng, stroke} from './brush'

/**
 * Painted sprites: art generated as SVG markup with its brush filters baked
 * in, drawn with <image> from a blob URL that useSpriteUrl creates in an effect
 * and revokes on unmount. Moving an image is cheap; re-running displacement
 * filters every frame is not. The sprite itself is pure data (box + markup).
 */
export interface Sprite {
  svg: string
  /** Box in local units; the anchor (0,0) is where the sprite meets the ground. */
  x: number
  y: number
  w: number
  h: number
}

const cache = new Map<string, Sprite>()

const FILTERS = `
<filter id="b" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="11" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="d" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="5" result="g"/>
  <feColorMatrix in="g" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.2" result="m"/>
  <feComposite in="SourceGraphic" in2="m" operator="in" result="dry"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="n"/>
  <feDisplacementMap in="dry" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="w"><feGaussianBlur stdDeviation="3"/></filter>`

const make = (key: string, box: Omit<Sprite, 'svg'>, body: string): Sprite => {
  const hit = cache.get(key)
  if (hit) return hit
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" width="${box.w * 2}" height="${box.h * 2}"><defs>${FILTERS}</defs>${body}</svg>`
  const sprite = {...box, svg}
  cache.set(key, sprite)
  return sprite
}

const paths = (ds: string[], attrs: string) => ds.map(d => `<path d="${d}" ${attrs}/>`).join('')

/**
 * A mountain pine: a leaning, twisting trunk in dry brush; needle pads as
 * clusters of short radiating strokes over a pale wash, the way 松针 are painted.
 */
export const pineSprite = (seed: number): Sprite =>
  make(`pine${seed}`, {x: -110, y: -200, w: 220, h: 210}, (() => {
    const r = rng(seed)
    const h = range(r, 120, 165)
    const lean = range(r, -0.4, 0.25)
    const trunk: [number, number][] = []
    for (let i = 0; i <= 7; i++) {
      const t = i / 7
      trunk.push([Math.sin(t * 2.6 + r() * 0.6) * 7 + lean * h * t * t, -h * t])
    }
    const trunkD = stroke(r, trunk, 11, 3, 0.35)
    const bark: string[] = []
    for (let i = 0; i < 9; i++) {
      const t = range(r, 0.05, 0.8)
      const j = Math.min(6, Math.floor(t * 7))
      const [x, y] = trunk[j]
      bark.push(stroke(r, [[x - 3, y], [x + range(r, -1, 2), y - 4], [x + 2, y - 8]], 1.6, 0.3))
    }
    const branches: string[] = []
    const washes: string[] = []
    const needles: string[] = []
    const levels = 4 + Math.floor(r() * 3)
    const pad = (cx: number, cy: number, pw: number) => {
      washes.push(blob(r, cx, cy - pw * 0.1, pw * 1.15, pw * 0.42, 0.25, 14))
      const n = Math.round(pw * 1.3)
      for (let i = 0; i < n; i++) {
        const a = range(r, Math.PI * 1.05, Math.PI * 1.95)
        const ox = cx + range(r, -pw * 0.9, pw * 0.9)
        const oy = cy + range(r, -pw * 0.08, pw * 0.18)
        const l = range(r, pw * 0.22, pw * 0.42)
        needles.push(stroke(r, [[ox, oy], [ox + Math.cos(a) * l, oy + Math.sin(a) * l * 0.55]], 1.5, 0.25, 0.2))
      }
    }
    for (let i = 0; i < levels; i++) {
      const t = 0.35 + (i / levels) * 0.62
      const [x0, y0] = trunk[Math.min(7, Math.round(t * 7))]
      const dir = i % 2 ? 1 : -1
      const len = range(r, 26, 60) * (1.15 - t * 0.55)
      const x1 = x0 + dir * len
      const y1 = y0 - range(r, 0, 14)
      branches.push(stroke(r, [[x0, y0], [x0 + dir * len * 0.5, y0 + range(r, -6, 4)], [x1, y1]], 4, 1.2, 0.35))
      pad(x1, y1 - 3, range(r, 20, 34) * (1.2 - t * 0.4))
    }
    const [tx, ty] = trunk[7]
    pad(tx, ty - 4, 30)
    return `<g filter="url(#w)" fill="#1a1a18" opacity="0.13">${paths(washes, '')}</g>
<g filter="url(#d)" fill="#1a1a18">
  <path d="${trunkD}" opacity="0.9"/>
  ${paths(branches, 'opacity="0.85"')}
</g>
<g fill="#efe8d8" opacity="0.5">${paths(bark, '')}</g>
<g filter="url(#b)" fill="#1a1a18" opacity="0.9">${paths(needles, '')}</g>`
  })())

/**
 * A boulder in the 披麻皴 manner: a broken contour heavier on the shadow side,
 * hemp-fibre texture strokes, a light wash and moss dots on top.
 */
export const rockSprite = (seed: number, w = 90, h = 50): Sprite =>
  make(`rock${seed}:${w}x${h}`, {x: -w * 0.65, y: -h * 1.25, w: w * 1.3, h: h * 1.35}, (() => {
    const r = rng(seed)
    const top: [number, number][] = []
    const n = 9
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const x = -w / 2 + t * w
      const bump = Math.sin(t * Math.PI) ** 0.7 * h
      top.push([x, -bump * (0.82 + r() * 0.25)])
    }
    const body = `M${-w / 2} 0 ${top.map(p => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')} L${w / 2} 0 Z`
    const contourL = stroke(r, top.slice(0, 6), 4.2, 1.5, 0.45)
    const contourR = stroke(r, top.slice(5), 2.2, 3.4, 0.45)
    const base = stroke(r, [[-w / 2 - 4, 0], [0, 1.5], [w / 2 + 4, -0.5]], 2.6, 1.2, 0.4)
    const cunD: string[] = []
    for (let i = 0; i < 12; i++) {
      const x = range(r, -w * 0.4, w * 0.4)
      const y0 = range(r, -h * 0.85, -h * 0.25)
      cunD.push(stroke(r, [[x, y0], [x + range(r, -3, 3), y0 + h * 0.18], [x + range(r, -5, 5), y0 + h * range(r, 0.3, 0.45)]], range(r, 1.4, 2.4), 0.3, 0.35))
    }
    const shade = blob(r, w * 0.18, -h * 0.32, w * 0.3, h * 0.36, 0.3, 12)
    const moss: string[] = []
    for (let i = 0; i < 11; i++) {
      const p = top[1 + Math.floor(r() * (top.length - 2))]
      moss.push(blob(r, p[0] + range(r, -5, 5), p[1] + range(r, 0, 4), range(r, 1.4, 3), range(r, 1, 2.4), 0.35, 8))
    }
    return `<path d="${body}" fill="#ddd3bd"/>
<path d="${shade}" fill="#1a1a18" opacity="0.14" filter="url(#w)"/>
<g filter="url(#d)" fill="#1a1a18">
  <path d="${contourL}" opacity="0.9"/>
  <path d="${contourR}" opacity="0.8"/>
  <path d="${base}" opacity="0.6"/>
  ${paths(cunD, 'opacity="0.5"')}
</g>
<g fill="#1a1a18" opacity="0.88" filter="url(#b)">${paths(moss, '')}</g>`
  })())
