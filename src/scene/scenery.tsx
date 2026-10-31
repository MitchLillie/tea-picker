import {memo, useMemo, type ReactNode} from 'react'

import {motion, type MotionStyle} from 'motion/react'

import {cun, range, ridge, rng} from './ink/brush'
import {pineSprite, rockSprite, type Sprite} from './ink/sprites'
import {useSpriteUrl} from './ink/useSpriteUrl'

/** Scene space. Every layer shares it so compositions line up. */
export const W = 390
export const H = 844

interface LayerProps {
  children: ReactNode
  style?: MotionStyle
  className?: string
}

/**
 * One composited plane of the painting. Layers move only by CSS transform
 * so their (filtered) contents are rasterised once.
 */
export function Layer({children, style, className = ''}: LayerProps) {
  return (
    <motion.div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{willChange: 'transform, opacity', ...style}}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="h-full w-full overflow-visible">
        {children}
      </svg>
    </motion.div>
  )
}

interface RangeProps {
  seed: number
  baseY: number
  amp: number
  opacity: number
  peaks?: number
  cunCount?: number
  bottom?: number
  soft?: boolean
}

/** A mountain range in graded ink: dark ridge, mist-dissolved foot, 皴 texture. */
export const MountainRange = memo(function MountainRange({
  seed,
  baseY,
  amp,
  opacity,
  peaks = 3,
  cunCount = 40,
  bottom,
  soft,
}: RangeProps) {
  const {d, marks} = useMemo(() => {
    const r = rng(seed)
    const rd = ridge(r, W, baseY, amp, bottom ?? baseY + amp * 1.6, peaks)
    return {d: rd.d, marks: cun(r, rd.pts, cunCount, amp * 0.22)}
  }, [seed, baseY, amp, peaks, cunCount, bottom])
  return (
    <g opacity={opacity} filter="url(#ink-bleed)">
      <path d={d} fill={soft ? 'url(#mist-fade-soft)' : 'url(#mist-fade)'} />
      <g fill="#1a1a18" opacity={0.55}>
        {marks.map((m, i) => (
          <path key={i} d={m} />
        ))}
      </g>
    </g>
  )
})

/** Draws a sprite once its blob URL exists. */
export const SpriteImage = ({sprite}: {sprite: Sprite}) => {
  const url = useSpriteUrl(sprite.svg)
  if (!url) return null
  return <image href={url} x={sprite.x} y={sprite.y} width={sprite.w} height={sprite.h} />
}

/** A windswept mountain pine (迎客松 manner), painted once as a sprite. */
export const Pine = memo(function Pine({seed, scale = 1, flip}: {seed: number; scale?: number; flip?: boolean}) {
  const s = useMemo(() => pineSprite(seed), [seed])
  return (
    <g transform={`scale(${flip ? -scale : scale} ${scale})`}>
      <SpriteImage sprite={s} />
    </g>
  )
})

/** A boulder, painted once as a sprite; anchored at the middle of its base. */
export const Rock = memo(function Rock({seed, w, h}: {seed: number; w: number; h: number}) {
  const s = useMemo(() => rockSprite(seed, w, h), [seed, w, h])
  return <SpriteImage sprite={s} />
})

/** A bank of cloud: overlapping soft paper-white masses with a faint grey belly. */
export const CloudBank = memo(function CloudBank({
  seed,
  y,
  count = 7,
  height = 60,
  tint = 0.08,
  heavy,
}: {
  seed: number
  y: number
  count?: number
  height?: number
  tint?: number
  heavy?: boolean
}) {
  const puffs = useMemo(() => {
    const r = rng(seed)
    return Array.from({length: count}, (_, i) => {
      const x = -60 + ((i + r() * 0.8) / count) * (W + 120)
      const rx = range(r, 60, 120)
      const ry = height * range(r, 0.5, 0.9)
      return {x, y: y + range(r, -height * 0.4, height * 0.4), rx, ry}
    })
  }, [seed, y, count, height])
  return (
    <g filter={heavy ? 'url(#wash-heavy)' : 'url(#wash)'}>
      {puffs.map((p, i) => (
        <ellipse key={`s${i}`} cx={p.x} cy={p.y + p.ry * 0.35} rx={p.rx * 1.02} ry={p.ry * 0.7} fill="#1a1a18" opacity={tint} />
      ))}
      {puffs.map((p, i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill="#f6f1e6" />
      ))}
    </g>
  )
})
