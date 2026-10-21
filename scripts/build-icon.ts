/**
 * Writes an HTML page that draws the app icon (1024×1024): the brush-written
 * 茶 in ink on rice paper with the cinnabar 采茶人 seal, as on the title screen.
 *
 *   npx tsx scripts/build-icon.ts out.html
 *   chrome --headless --screenshot=src/icon.png --window-size=1024,1024 out.html
 */
import {writeFileSync} from 'node:fs'

import {GLYPHS, GLYPH_EM} from '../src/scene/ink/glyphs'

const INK = '#1a1a18'
const PAPER = '#efe8d8'
const PAPER_LIGHT = '#f6f1e6'
const CINNABAR = '#b5321f'

const glyph = (ch: string, x: number, y: number, size: number, fill: string) =>
  `<path d="${GLYPHS[ch].d}" fill="${fill}" transform="translate(${x} ${y}) scale(${size / GLYPH_EM})"/>`

// Seal: 采茶人, read right column first (采茶), then left (人), white on red.
const sealX = 640
const sealY = 650
const seal = 190
const cell = (seal * 0.9) / 2
const sealGlyphs = [
  glyph('采', sealX + seal / 2 + 2, sealY + seal * 0.06, cell, PAPER_LIGHT),
  glyph('茶', sealX + seal / 2 + 2, sealY + seal * 0.06 + cell, cell, PAPER_LIGHT),
  glyph('人', sealX + seal * 0.06, sealY + seal / 2 - cell / 2, cell, PAPER_LIGHT),
].join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
<defs>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix in="n" values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.26  0 0 0 0.06 0"/>
  </filter>
  <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
    <stop offset="0.6" stop-color="#78644a" stop-opacity="0"/>
    <stop offset="1" stop-color="#78644a" stop-opacity="0.22"/>
  </radialGradient>
  <filter id="bleed" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="11" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="wear" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.25" numOctaves="2" seed="3"/>
    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.75"/>
    <feComposite in="SourceGraphic" operator="in"/>
  </filter>
</defs>
<rect width="1024" height="1024" fill="${PAPER}"/>
<rect width="1024" height="1024" filter="url(#grain)"/>
<rect width="1024" height="1024" fill="url(#vignette)"/>
<g filter="url(#bleed)">${glyph('茶', 192, 150, 600, INK)}</g>
<g filter="url(#wear)" transform="rotate(-3 ${sealX + seal / 2} ${sealY + seal / 2})">
  <path d="M${sealX + 6} ${sealY + 8} Q${sealX + seal / 2} ${sealY + 2} ${sealX + seal - 4} ${sealY + 5}
           Q${sealX + seal + 2} ${sealY + seal / 2} ${sealX + seal - 3} ${sealY + seal - 3}
           Q${sealX + seal / 2} ${sealY + seal + 2} ${sealX + 4} ${sealY + seal - 4}
           Q${sealX + 1} ${sealY + seal / 2} ${sealX + 6} ${sealY + 8} Z" fill="${CINNABAR}"/>
  ${sealGlyphs}
</g>
</svg>`

writeFileSync(
  process.argv[2] ?? 'icon.html',
  `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:${PAPER}}svg{display:block}</style></head><body>${svg}</body></html>`
)
