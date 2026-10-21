import {GLYPHS, GLYPH_EM} from './glyphs'

interface GlyphProps {
  /** One or more characters; laid out vertically when `vertical` is set. */
  text: string
  size: number
  vertical?: boolean
  className?: string
  fill?: string
  title?: string
}

/** Brush-written hanzi from pre-converted Ma Shan Zheng outlines. */
export function Glyph({text, size, vertical, className, fill = 'currentColor', title}: GlyphProps) {
  const chars = [...text].filter(c => GLYPHS[c])
  const advance = GLYPH_EM * 0.96
  const n = Math.max(1, chars.length)
  const w = vertical ? GLYPH_EM : advance * n
  const h = vertical ? advance * n : GLYPH_EM
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={vertical ? size : (size * w) / GLYPH_EM}
      height={vertical ? (size * h) / GLYPH_EM : size}
      className={className}
      role="img"
      aria-label={title ?? text}
    >
      {chars.map((c, i) => (
        <path
          key={i}
          d={GLYPHS[c].d}
          fill={fill}
          transform={vertical ? `translate(0 ${i * advance})` : `translate(${i * advance} 0)`}
        />
      ))}
    </svg>
  )
}

interface SealProps {
  text: string
  size: number
  className?: string
  /** Relief seal (朱文): red characters on paper. Default is intaglio (白文). */
  relief?: boolean
}

/**
 * A cinnabar seal impression. Edges are slightly irregular and the ink is
 * uneven, as a stone seal pressed on paper would leave it.
 */
export function Seal({text, size, className, relief}: SealProps) {
  const chars = [...text]
  const cols = chars.length > 2 ? 2 : 1
  const rows = Math.ceil(chars.length / cols)
  const cell = 100 / Math.max(cols, rows)
  return (
    <svg viewBox="0 0 110 110" width={size} height={size} className={className} aria-label={text} role="img">
      <g filter="url(#seal-wear)">
        {relief ? (
          <path
            d="M6 7 L103 5 L104 103 L5 104 Z M13 13 L97 12 L97 97 L13 97 Z"
            fill="var(--color-cinnabar)"
            fillRule="evenodd"
          />
        ) : (
          <path d="M6 7 Q55 3 103 5 Q106 55 104 103 Q55 106 5 104 Q3 55 6 7 Z" fill="var(--color-cinnabar)" />
        )}
        {chars.map((c, i) => {
          const g = GLYPHS[c]
          if (!g) return null
          // Seals read top to bottom, right column first.
          const col = cols - 1 - Math.floor(i / rows)
          const row = i % rows
          const inCol = Math.min(rows, chars.length - Math.floor(i / rows) * rows)
          const s = (cell * 0.86) / GLYPH_EM
          const x = 5 + (100 - cols * cell) / 2 + col * cell + cell * 0.07
          const y = 5 + (100 - inCol * cell) / 2 + row * cell + cell * 0.07
          return (
            <path
              key={i}
              d={g.d}
              transform={`translate(${x} ${y}) scale(${s})`}
              fill={relief ? 'var(--color-cinnabar)' : 'var(--color-paper-light)'}
            />
          )
        })}
      </g>
    </svg>
  )
}
