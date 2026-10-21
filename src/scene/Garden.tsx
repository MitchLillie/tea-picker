import {memo, useMemo} from 'react'

import {blob, range, rng, smoothOpen, stroke} from './ink/brush'
import {CloudBank, MountainRange, Pine, Rock, W} from './scenery'

export type RowId = 'palate' | 'leaf' | 'atlas' | 'settings'

export interface Terrace {
  id: RowId
  glyph: string
  title: string
  line: string
  /** Centre-line height at the left edge, middle and right edge. */
  y: [number, number, number]
  /** Bush height: nearer rows are larger. */
  size: number
}

/** Nearest row first. The rows climb the hill away from the viewer. */
export const TERRACES: Terrace[] = [
  {id: 'palate', glyph: '品', title: 'Palate', line: 'Tell me what you taste', y: [706, 672, 694], size: 34},
  {id: 'leaf', glyph: '叶', title: 'Leaf', line: 'Name a tea you love', y: [600, 574, 590], size: 27},
  {id: 'atlas', glyph: '谱', title: 'Atlas', line: 'The family of tea', y: [512, 492, 504], size: 21},
  {id: 'settings', glyph: '设', title: 'Rest', line: 'Settings & sound', y: [440, 424, 434], size: 16},
]

/** y of a terrace's centre-line at scene x. */
export const terraceY = (t: Terrace, x: number) => {
  const u = x / W
  const [a, b, c] = t.y
  return (1 - u) * (1 - u) * a + 2 * u * (1 - u) * (2 * b - (a + c) / 2) + u * u * c
}

/** The stone the picker sits on, and where his feet rest. */
export const STONE = {x: 132, y: 806, w: 150, h: 36}
export const SEAT = {x: 116, y: 806, scale: 1.45}

export const Far = memo(function Far() {
  return (
    <>
      <MountainRange seed={11} baseY={200} amp={130} opacity={0.22} soft peaks={2} cunCount={18} />
      <MountainRange seed={23} baseY={262} amp={96} opacity={0.36} peaks={3} cunCount={30} />
    </>
  )
})

export const CloudSea = memo(function CloudSea() {
  return (
    <>
      <CloudBank seed={4} y={300} count={9} height={46} heavy tint={0.06} />
      <CloudBank seed={8} y={346} count={8} height={38} tint={0.07} />
    </>
  )
})

/** The tea hill: a pale wash with terraces of clipped bushes across its face. */
export const Hill = memo(function Hill({highlight}: {highlight?: RowId | null}) {
  const art = useMemo(() => {
    const r = rng(2024)
    const crest: [number, number][] = []
    for (let i = 0; i <= 12; i++) {
      const x = -40 + (i / 12) * (W + 80)
      crest.push([x, 392 - Math.sin((i / 12) * Math.PI) * 26 + range(r, -5, 5)])
    }
    const hill = `${smoothOpen(crest)}L${W + 40} 900L-40 900Z`
    const ridgeLine = stroke(r, crest, 2.4, 1.2, 0.3)
    const rows = TERRACES.map(t => {
      const bushes: string[] = []
      const halos: string[] = []
      const step = t.size * 0.92
      for (let x = -t.size; x < W + t.size; x += step * range(r, 0.85, 1.1)) {
        const y = terraceY(t, x)
        bushes.push(blob(r, x, y - t.size * 0.28, t.size * 0.62, t.size * 0.36, 0.22, 12))
        halos.push(blob(r, x + range(r, -2, 2), y - t.size * 0.36, t.size * 0.72, t.size * 0.46, 0.18, 10))
      }
      const wall: [number, number][] = []
      for (let i = 0; i <= 10; i++) {
        const x = -20 + (i / 10) * (W + 40)
        wall.push([x, terraceY(t, x) + t.size * 0.22])
      }
      return {id: t.id, bushes, halos, wall: stroke(r, wall, t.size * 0.12, t.size * 0.08, 0.4)}
    })
    return {hill, ridgeLine, rows}
  }, [])
  return (
    <g>
      <path d={art.hill} fill="#1a1a18" opacity={0.07} filter="url(#ink-bleed)" />
      <path d={art.ridgeLine} fill="#1a1a18" opacity={0.45} />
      <g transform="translate(58 384)" opacity={0.75}>
        <Pine seed={93} scale={0.42} />
      </g>
      <g transform="translate(332 378)" opacity={0.55}>
        <Pine seed={17} scale={0.3} flip />
      </g>
      {[...art.rows].reverse().map(row => {
        const lit = highlight === row.id
        return (
          <g key={row.id} filter="url(#ink-bleed)">
            <path d={row.wall} fill="#1a1a18" opacity={0.55} />
            <g fill="#1a1a18" opacity={lit ? 0.32 : 0.16}>
              {row.halos.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <g fill="#1a1a18" opacity={lit ? 0.95 : 0.72}>
              {row.bushes.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </g>
        )
      })}
    </g>
  )
})

/** Mist drifting between the terraces. */
export const RowMist = memo(function RowMist() {
  return (
    <>
      <CloudBank seed={31} y={470} count={4} height={14} tint={0} />
      <CloudBank seed={37} y={548} count={4} height={16} tint={0} />
    </>
  )
})

export const Foreground = memo(function Foreground() {
  const tufts = useMemo(() => {
    const r = rng(77)
    return Array.from({length: 14}, () => {
      const x = range(r, 30, 260)
      const y = range(r, 790, 840)
      const h = range(r, 8, 20)
      return stroke(r, [[x, y], [x + range(r, -5, 5), y - h * 0.5], [x + range(r, -8, 8), y - h]], 2.2, 0.3)
    })
  }, [])
  return (
    <g>
      <g transform={`translate(${STONE.x} ${STONE.y})`}>
        <Rock seed={5} w={STONE.w} h={STONE.h} />
      </g>
      <g fill="#1a1a18" opacity={0.75}>
        {tufts.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </g>
  )
})
