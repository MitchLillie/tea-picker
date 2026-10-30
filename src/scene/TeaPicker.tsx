import {memo, useEffect, useMemo, useRef, type RefObject} from 'react'

import {blob, rng, stroke} from './ink/brush'

/*
 * The elderly tea picker. A tiny jointed rig posed procedurally:
 *   root (x, y, scale) — feet on the ground, facing left
 *   └ hip (hipX, hipY)
 *      ├ far leg:  thigh ─ shin
 *      ├ torso (lean): robe, basket, far arm, head + hat, near arm + stick
 *      └ near leg: thigh ─ shin
 * Positive limb angles swing toward the direction of travel (−x).
 */

interface Pose {
  hipX: number
  hipY: number
  lean: number
  thighN: number
  shinN: number
  thighF: number
  shinF: number
  armN: number
  foreN: number
  armF: number
  foreF: number
  head: number
  breathe: number
}

const STAND: Pose = {
  hipX: 0, hipY: -52, lean: 13, thighN: 0, shinN: -4, thighF: 0, shinF: -4,
  armN: 14, foreN: 30, armF: -6, foreF: 20, head: 6, breathe: 0,
}

const SIT: Pose = {
  hipX: 7, hipY: -27, lean: 7, thighN: 78, shinN: -80, thighF: 72, shinF: -74,
  armN: 30, foreN: 52, armF: 24, foreF: 48, head: 10, breathe: 0,
}

const THIGH = 25
const SHIN = 26

const walkPose = (phase: number): Pose => {
  const s = Math.sin(phase)
  const c = Math.cos(phase)
  return {
    ...STAND,
    hipY: -52 + Math.abs(c) * 1.6,
    thighN: 17 * s,
    shinN: -(6 + 22 * Math.max(0, c)),
    thighF: -17 * s,
    shinF: -(6 + 22 * Math.max(0, -c)),
    armN: 14 + 8 * -s, // the stick arm swings gently
    foreN: 30,
    armF: -6 + 12 * s,
    foreF: 20 + 6 * Math.max(0, s),
    head: 6 + Math.sin(phase * 2) * 1.2,
  }
}

const mix = (a: Pose, b: Pose, t: number): Pose =>
  Object.fromEntries(
    (Object.keys(a) as (keyof Pose)[]).map(k => [k, a[k] + (b[k] - a[k]) * t])
  ) as unknown as Pose

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const easeOut = (t: number) => 1 - (1 - t) ** 2.2

export interface Placement {
  x: number
  y: number
  scale: number
}

interface TeaPickerProps {
  mode: 'hidden' | 'enter' | 'seated'
  from: Placement
  to: Placement
  /** Seconds spent walking from `from` to `to`. */
  walkSeconds?: number
  onSeated?: () => void
  /** Stop animating (e.g. while a page covers the garden). */
  paused?: boolean
}

/** Pre-drawn limb and costume shapes (local, unposed coordinates). */
const useArt = () =>
  useMemo(() => {
    const r = rng(1957)
    return {
      thigh: stroke(r, [[0, 0], [0, THIGH * 0.5], [0, THIGH]], 13, 10, 0.1),
      shin: stroke(r, [[0, 0], [0, SHIN * 0.5], [0, SHIN]], 10, 7, 0.1),
      foot: blob(r, -4, SHIN + 1, 6.5, 2.6, 0.15, 10),
      upper: stroke(r, [[0, 0], [0, 10], [0, 20]], 10, 8, 0.15),
      fore: stroke(r, [[0, 0], [0, 9], [0, 18]], 8, 6, 0.15),
      hand: blob(r, 0, 20, 3, 3.4, 0.12, 8),
      robe: 'M-10 2 C-13 -12 -11 -28 -8 -40 C-2 -44 6 -44 10 -40 C13 -28 13 -12 12 2 C6 8 -5 8 -10 2 Z',
      robeFold: [
        stroke(r, [[-4, -36], [-6, -20], [-5, 0]], 1.6, 0.4),
        stroke(r, [[6, -34], [7, -16], [8, 2]], 1.4, 0.4),
      ],
      sash: stroke(r, [[-11, -14], [0, -12], [12, -14]], 3, 2.4),
      basket: 'M2 -46 L24 -48 L21 -10 L5 -9 Z',
      weave: Array.from({length: 6}, (_, i) => {
        const y = -44 + i * 6
        return `M${3 + i * 0.4} ${y} L${23 - i * 0.5} ${y - 1}`
      }).concat(Array.from({length: 5}, (_, i) => `M${6 + i * 4} -47 L${7 + i * 3} -10`)),
      leaves: Array.from({length: 5}, (_, i) => blob(r, 6 + i * 4, -49 - (i % 2) * 2, 3.4, 2, 0.3, 8)),
      strap: stroke(r, [[4, -44], [-2, -36], [-6, -24]], 2, 1.6),
      face: blob(r, -3, -5, 6.2, 7.2, 0.08, 12),
      beard: [
        stroke(r, [[-6, 0], [-8, 7], [-7, 14]], 3.4, 0.6, 0.2),
        stroke(r, [[-4, 1], [-4, 8], [-2, 13]], 2.6, 0.5, 0.2),
      ],
      hat: 'M-26 -8 L-1 -24 L25 -8 Q0 -3 -26 -8 Z',
      hatRim: 'M-26 -8 Q0 -3 25 -8',
      hatRibs: [-18, -9, 0, 9, 17].map(x => `M-1 -24 L${x} ${-5 - Math.abs(x) * 0.12}`),
      stick: stroke(r, [[0, -6], [-1, 30], [1, 66]], 2.6, 2, 0.2),
      cup: 'M-5 0 L5 0 L4 6 Q0 8 -4 6 Z',
    }
  }, [])

const INK = '#1a1a18'
const PAPER = '#f2ece0'
const WASH = 'rgba(26,26,24,0.58)'
const WASH_DARK = 'rgba(26,26,24,0.78)'

export const TeaPicker = memo(function TeaPicker({
  mode,
  from,
  to,
  walkSeconds = 6.5,
  onSeated,
  paused,
}: TeaPickerProps) {
  const art = useArt()
  const refs = {
    root: useRef<SVGGElement>(null) as RefObject<SVGGElement>,
    hip: useRef<SVGGElement>(null) as RefObject<SVGGElement>,
    torso: useRef<SVGGElement>(null) as RefObject<SVGGElement>,
    head: useRef<SVGGElement>(null) as RefObject<SVGGElement>,
    thighN: useRef<SVGGElement>(null) as RefObject<SVGGElement>,
    shinN: useRef<SVGGElement>(null) as RefObject<SVGGElement>,
    thighF: useRef<SVGGElement>(null) as RefObject<SVGGElement>,
    shinF: useRef<SVGGElement>(null) as RefObject<SVGGElement>,
    armN: useRef<SVGGElement>(null) as RefObject<SVGGElement>,
    foreN: useRef<SVGGElement>(null) as RefObject<SVGGElement>,
    armF: useRef<SVGGElement>(null) as RefObject<SVGGElement>,
    foreF: useRef<SVGGElement>(null) as RefObject<SVGGElement>,
    stick: useRef<SVGGElement>(null) as RefObject<SVGGElement>,
    steam: useRef<SVGGElement>(null) as RefObject<SVGGElement>,
  }
  const seatedCb = useRef(onSeated)
  seatedCb.current = onSeated

  useEffect(() => {
    const set = (k: keyof typeof refs, v: string) => refs[k].current?.setAttribute('transform', v)
    const pose = (p: Pose, at: Placement, sitting: number) => {
      set('root', `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)}) scale(${at.scale.toFixed(3)})`)
      set('hip', `translate(${p.hipX.toFixed(2)} ${p.hipY.toFixed(2)})`)
      set('torso', `rotate(${(-p.lean).toFixed(2)}) scale(1 ${(1 + p.breathe).toFixed(4)})`)
      set('head', `translate(-4 -44) rotate(${(-p.head).toFixed(2)})`)
      set('thighN', `rotate(${p.thighN.toFixed(2)})`)
      set('shinN', `translate(0 ${THIGH}) rotate(${p.shinN.toFixed(2)})`)
      set('thighF', `translate(3 0) rotate(${p.thighF.toFixed(2)})`)
      set('shinF', `translate(0 ${THIGH}) rotate(${p.shinF.toFixed(2)})`)
      set('armN', `translate(-1 -38) rotate(${p.armN.toFixed(2)})`)
      set('foreN', `translate(0 20) rotate(${p.foreN.toFixed(2)})`)
      set('armF', `translate(4 -38) rotate(${p.armF.toFixed(2)})`)
      set('foreF', `translate(0 20) rotate(${p.foreF.toFixed(2)})`)
      // The stick stays near-upright in the hand; seated, it leans on the shoulder.
      const handAngle = -p.lean + p.armN + p.foreN
      const stickTilt = -6 + sitting * 26
      set('stick', `translate(0 20) rotate(${(-handAngle + stickTilt).toFixed(2)})`)
    }

    if (mode === 'hidden') return
    if (mode === 'seated') {
      if (paused) return
      let raf = 0
      const start = performance.now()
      const loop = (now: number) => {
        const t = (now - start) / 1000
        pose({...SIT, breathe: Math.sin(t * 1.6) * 0.014, head: SIT.head + Math.sin(t * 0.37) * 2.5}, to, 1)
        refs.steam.current?.setAttribute('opacity', (0.35 + Math.sin(t * 0.9) * 0.15).toFixed(2))
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(raf)
    }

    // mode === 'enter': walk in from beside the camera, stop, lower onto the stone.
    let raf = 0
    let seated = false
    const start = performance.now()
    const settle = 0.5
    const sit = 2.2
    const loop = (now: number) => {
      const t = (now - start) / 1000
      if (t < walkSeconds) {
        const u = easeOut(t / walkSeconds)
        const at = {
          x: from.x + (to.x - from.x) * u,
          y: from.y + (to.y - from.y) * u,
          scale: from.scale + (to.scale - from.scale) * u,
        }
        // Stride rate follows ground speed, so feet never skate.
        const travelled = u * Math.hypot(to.x - from.x, to.y - from.y) / ((from.scale + to.scale) / 2)
        pose(walkPose(travelled / 15), at, 0)
      } else if (t < walkSeconds + settle) {
        const k = ease((t - walkSeconds) / settle)
        const total = Math.hypot(to.x - from.x, to.y - from.y) / ((from.scale + to.scale) / 2)
        pose(mix(walkPose(total / 15), STAND, k), to, 0)
      } else if (t < walkSeconds + settle + sit) {
        const k = ease((t - walkSeconds - settle) / sit)
        pose(mix(STAND, SIT, k), to, k)
      } else {
        if (!seated) {
          seated = true
          seatedCb.current?.()
        }
        const tt = t - walkSeconds - settle - sit
        pose({...SIT, breathe: Math.sin(tt * 1.6) * 0.014, head: SIT.head + Math.sin(tt * 0.37) * 2.5}, to, 1)
        refs.steam.current?.setAttribute('opacity', (0.35 + Math.sin(tt * 0.9) * 0.15).toFixed(2))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [mode, paused])

  if (mode === 'hidden') return null

  const leg = (thigh: RefObject<SVGGElement>, shin: RefObject<SVGGElement>, far: boolean) => (
    <g ref={thigh}>
      <path d={art.thigh} fill={far ? WASH_DARK : WASH} stroke={INK} strokeWidth={0.9} />
      <g ref={shin}>
        <path d={art.shin} fill={far ? WASH_DARK : WASH} stroke={INK} strokeWidth={0.9} />
        <path d={art.foot} fill={INK} />
      </g>
    </g>
  )

  return (
    <g>
      {/* A cup on the stone, steaming — it waits for him. */}
      <g transform={`translate(${to.x - 34 * to.scale} ${to.y - 30 * to.scale}) scale(${to.scale})`}>
        <path d={art.cup} fill={PAPER} stroke={INK} strokeWidth={1} />
        <g ref={refs.steam} opacity={0} fill="none" stroke={INK} strokeWidth={0.8} strokeLinecap="round">
          <path d="M-1 -2 C-4 -8 2 -11 -1 -17" />
          <path d="M2 -2 C0 -7 5 -10 2 -15" opacity={0.6} />
        </g>
      </g>
      <g ref={refs.root}>
        <ellipse cx={4} cy={1} rx={22} ry={3} fill={INK} opacity={0.12} />
        <g ref={refs.hip}>
          {leg(refs.thighF, refs.shinF, true)}
          <g ref={refs.torso}>
            {/* far arm */}
            <g ref={refs.armF}>
              <path d={art.upper} fill={WASH_DARK} stroke={INK} strokeWidth={0.8} />
              <g ref={refs.foreF}>
                <path d={art.fore} fill={WASH_DARK} stroke={INK} strokeWidth={0.8} />
                <path d={art.hand} fill={PAPER} stroke={INK} strokeWidth={0.7} />
              </g>
            </g>
            {/* basket on the back */}
            <g>
              <path d={art.basket} fill="#cfc3a8" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
              <g stroke={INK} strokeWidth={0.6} opacity={0.6}>
                {art.weave.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
              <g fill={INK} opacity={0.8}>
                {art.leaves.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
            </g>
            <path d={art.robe} fill={WASH} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
            <g fill={INK} opacity={0.5}>
              {art.robeFold.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <path d={art.sash} fill={INK} />
            <path d={art.strap} fill={INK} opacity={0.8} />
            {/* head */}
            <g ref={refs.head}>
              <path d={art.face} fill={PAPER} stroke={INK} strokeWidth={0.9} />
              <g fill={PAPER} stroke={INK} strokeWidth={0.5}>
                {art.beard.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
              <circle cx={-7} cy={-6} r={0.8} fill={INK} />
              <path d={art.hat} fill="#d8cdb2" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
              <g stroke={INK} strokeWidth={0.55} opacity={0.65}>
                {art.hatRibs.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
              <path d={art.hatRim} fill="none" stroke={INK} strokeWidth={1.8} />
              <path d="M-9 -6 Q-6 4 -2 2" fill="none" stroke={INK} strokeWidth={0.6} />
            </g>
            {/* near arm with stick */}
            <g ref={refs.armN}>
              <path d={art.upper} fill={WASH} stroke={INK} strokeWidth={0.9} />
              <g ref={refs.foreN}>
                <path d={art.fore} fill={WASH} stroke={INK} strokeWidth={0.9} />
                <g ref={refs.stick}>
                  <path d={art.stick} fill="#3a3326" />
                </g>
                <path d={art.hand} fill={PAPER} stroke={INK} strokeWidth={0.8} />
              </g>
            </g>
          </g>
          {leg(refs.thighN, refs.shinN, false)}
        </g>
      </g>
    </g>
  )
})
