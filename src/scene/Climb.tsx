import {useEffect, useMemo, useRef} from 'react'

import {useMotionValueEvent, type MotionValue} from 'motion/react'

import {blob, range, rng, smoothClosed} from './ink/brush'
import {pineSprite, rockSprite, type Sprite} from './ink/sprites'
import {H, W} from './scenery'

/*
 * First-person stair climb, projected by hand.
 * World: step k's front edge sits at distance s = k and height h = k·RISE.
 * The camera walks the same slope at eye height EYE, so every step shares a
 * vanishing point and the stair recedes up into the mist.
 *
 * Each riser faces the camera, so on screen it is an exact rectangle: a
 * pre-painted brush band is simply scaled onto it. Treads are faint washes.
 */
const F = 300 // focal length (scene px)
const CX = W / 2
const CY = 330 // eye level on screen
const RISE = 0.5
const EYE = 1.7
const HALF = 1.2 // half stair width (world)
const SLOTS = 26
const FAR = 22

/** The path winds as it climbs. */
const sway = (s: number) => Math.sin(s * 0.23) * 1.5 + Math.sin(s * 0.09 + 1) * 2.2

const hash = (k: number) => {
  const x = Math.sin(k * 127.1) * 43758.5453
  return x - Math.floor(x)
}

interface Proj {
  x: number
  y: number
}

const project = (s: number, h: number, x: number, z: number): Proj => {
  const ds = Math.max(0.06, s - z)
  const dh = h - (z * RISE + EYE)
  const dx = x - sway(z + 1.4) // the eye leads slightly along the path
  return {x: CX + (F * dx) / ds, y: CY - (F * dh) / ds}
}

const f1 = (n: number) => n.toFixed(1)

/** Horizontal brush bands in a unit box: ragged ends, swelling belly. */
const BANDS = (() => {
  const r = rng(404)
  return Array.from({length: 10}, () => {
    const top: [number, number][] = []
    const bot: [number, number][] = []
    const n = 9
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const swell = 0.12 * Math.sin(t * Math.PI)
      top.push([t, 0.06 - swell + range(r, -0.05, 0.05)])
      bot.push([t, 0.94 + swell * 0.4 + range(r, -0.06, 0.04)])
    }
    // Ragged, dry ends.
    top[0] = [range(r, -0.03, 0.04), range(r, 0.15, 0.35)]
    bot[0] = [range(r, 0.0, 0.06), range(r, 0.65, 0.9)]
    top[n] = [1 + range(r, -0.04, 0.03), range(r, 0.15, 0.35)]
    bot[n] = [1 - range(r, 0, 0.06), range(r, 0.65, 0.9)]
    return smoothClosed([...top, ...bot.reverse()])
  })
})()

/** Grass and stone clumps for the stair edges, in a unit box. */
const CLUMPS = (() => {
  const r = rng(51)
  return Array.from({length: 8}, () => blob(r, 0, 0, 1, 0.5, 0.4, 12))
})()

interface SideItem {
  sprite: Sprite
  s: number
  x: number
  /** World height of the sprite. */
  size: number
  flip: boolean
}

const makeSideItems = (): SideItem[] => {
  const r = rng(808)
  const items: SideItem[] = []
  for (let s = 2.2; s < 60; s += range(r, 1.3, 2.6)) {
    const side = r() < 0.5 ? -1 : 1
    const pine = r() < 0.5
    items.push({
      sprite: pine ? pineSprite(Math.floor(r() * 1e6)) : rockSprite(Math.floor(r() * 1e6), 90, 46),
      s,
      x: sway(s) + side * range(r, HALF + (pine ? 1 : 0.4), HALF + (pine ? 4 : 2.2)),
      size: pine ? range(r, 2.8, 4.4) : range(r, 0.7, 1.4),
      flip: side > 0,
    })
  }
  return items
}

interface ClimbProps {
  /** Camera position in steps. */
  z: MotionValue<number>
}

export function Climb({z}: ClimbProps) {
  const rig = useRef<SVGGElement>(null)
  const treads = useRef<(SVGPathElement | null)[]>([])
  const risers = useRef<(SVGPathElement | null)[]>([])
  const edgesL = useRef<(SVGPathElement | null)[]>([])
  const edgesR = useRef<(SVGPathElement | null)[]>([])
  const itemRefs = useRef<(SVGGElement | null)[]>([])
  const items = useMemo(makeSideItems, [])

  const draw = (zv: number) => {
    const base = Math.floor(zv)
    for (let i = 0; i < SLOTS; i++) {
      // Far slots first in the DOM, so nearer steps paint over them.
      const k = base + SLOTS - 1 - i
      const tread = treads.current[i]
      const riser = risers.current[i]
      const eL = edgesL.current[i]
      const eR = edgesR.current[i]
      if (!tread || !riser || !eL || !eR) continue
      const back = k + 1 - zv
      if (back < 0.12 || back > FAR) {
        tread.style.display = riser.style.display = eL.style.display = eR.style.display = 'none'
        continue
      }
      const j = hash(k)
      const half = HALF * (0.92 + j * 0.16)
      const h0 = k * RISE
      const c1 = sway(k + 1)
      // The tread we stand on is clipped just ahead of the eye.
      const sFront = Math.max(k, zv + 0.1)
      const c0 = sway(sFront)
      const fl = project(sFront, h0, c0 - half, zv)
      const fr = project(sFront, h0, c0 + half, zv)
      const bl = project(k + 1, h0, c1 - half, zv)
      const br = project(k + 1, h0, c1 + half, zv)
      const top = project(k + 1, h0 + RISE, c1, zv).y
      const fade = Math.max(0, Math.min(1, 1.3 - back / FAR))
      tread.style.display = riser.style.display = eL.style.display = eR.style.display = ''
      tread.setAttribute('d', `M${f1(fl.x)} ${f1(fl.y)}L${f1(fr.x)} ${f1(fr.y)}L${f1(br.x)} ${f1(br.y)}L${f1(bl.x)} ${f1(bl.y)}Z`)
      tread.setAttribute('opacity', (0.05 + 0.05 * j).toFixed(3))
      riser.setAttribute('d', BANDS[Math.floor(j * BANDS.length)])
      riser.setAttribute(
        'transform',
        `translate(${f1(bl.x)} ${f1(top)}) scale(${(br.x - bl.x).toFixed(2)} ${(bl.y - top).toFixed(2)})`
      )
      riser.setAttribute('opacity', (fade * (0.42 + j * 0.3)).toFixed(2))
      const px = F / (back + 0.4)
      const clump = (el: SVGPathElement, p: Proj, side: number, v: number) => {
        el.setAttribute('d', CLUMPS[Math.floor(v * CLUMPS.length)])
        el.setAttribute(
          'transform',
          `translate(${f1(p.x + side * px * 0.08)} ${f1(p.y - px * 0.02)}) scale(${(px * (0.16 + v * 0.12)).toFixed(2)} ${(px * 0.1).toFixed(2)})`
        )
        el.setAttribute('opacity', (fade * 0.55).toFixed(2))
      }
      clump(eL, bl, -1, hash(k + 0.3))
      clump(eR, br, 1, hash(k + 0.7))
    }

    items.forEach((it, i) => {
      const g = itemRefs.current[i]
      if (!g) return
      const ds = it.s - zv
      if (ds < 0.4 || ds > FAR) {
        g.style.display = 'none'
        return
      }
      const p = project(it.s, it.s * RISE - 0.3, it.x, zv)
      g.style.display = ''
      const px = (F / ds) * it.size // sprite height in screen px
      const sc = px / it.sprite.h
      g.setAttribute('transform', `translate(${f1(p.x)} ${f1(p.y)}) scale(${(it.flip ? -sc : sc).toFixed(3)} ${sc.toFixed(3)})`)
      g.setAttribute('opacity', Math.max(0, Math.min(1, 1.35 - ds / FAR)).toFixed(2))
    })

    // Each step is a footfall: the head dips and rolls a touch.
    const frac = zv - base
    const bob = Math.abs(Math.sin(frac * Math.PI))
    const roll = Math.sin(zv * Math.PI) * 0.6
    rig.current?.setAttribute('transform', `translate(0 ${(bob * 7).toFixed(2)}) rotate(${roll.toFixed(2)} ${CX} ${H / 2})`)
  }

  useMotionValueEvent(z, 'change', draw)
  useEffect(() => draw(z.get()), [])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <g ref={rig}>
        {/* Farthest first, so nearer scenery paints over it. */}
        {items
          .map((it, i) => [it, i] as const)
          .reverse()
          .map(([it, i]) => (
            <g key={i} ref={el => (itemRefs.current[i] = el)} style={{display: 'none'}}>
              <image href={it.sprite.url} x={it.sprite.x} y={it.sprite.y} width={it.sprite.w} height={it.sprite.h} />
            </g>
          ))}
        {Array.from({length: SLOTS}, (_, i) => (
          <g key={i}>
            <path ref={el => (treads.current[i] = el)} fill="#1a1a18" />
            <path ref={el => (risers.current[i] = el)} fill="#1a1a18" />
            <path ref={el => (edgesL.current[i] = el)} fill="#1a1a18" />
            <path ref={el => (edgesR.current[i] = el)} fill="#1a1a18" />
          </g>
        ))}
      </g>
    </svg>
  )
}
