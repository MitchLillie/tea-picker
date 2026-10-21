/**
 * Generates candidate opening music with Google Lyria 3 via OpenRouter.
 *
 *   OPENROUTER_API_KEY=sk-or-... npx tsx scripts/generate-music.ts [takes=4] [preset=guqin|broad-road]
 *
 * Writes music-takes/<preset>-1.mp3 … (not bundled; pick one, then it gets
 * trimmed to a loop and encoded into src/assets). Each take costs ~$0.08.
 */
import {mkdirSync, writeFileSync} from 'node:fs'

const MODEL = 'google/lyria-3-pro-preview'

const PROMPTS: Record<string, string> = {
  guqin: `Traditional Chinese instrumental music for a quiet mountain tea garden at dawn. \
Solo guqin (seven-string zither) leading, played slowly and freely with long sustained notes, \
sliding pitch bends and soft harmonics; a distant xiao (end-blown bamboo flute) answering \
occasionally; very sparse guzheng accents. Pentatonic, gong mode, unhurried, around 60 BPM, \
rubato, no percussion, no drums. Contemplative, spacious and restrained: much silence between \
phrases, like an ink-wash painting with empty paper. Natural acoustic room, close-miked guqin, \
light reverb; no synthesizers, no modern pads, no Western orchestra, no vocals. \
2 to 2.5 minutes long, no fade-in and no fade-out; end on the same quiet open note and phrase \
it began with, so the piece can loop seamlessly.`,

  // Modelled on "Broad Road Songs" (Internet Chinese Music Archive E32): D-gong
  // pentatonic resting on B (yu mode), a low rising E–F#–A–B opening, slow pulse
  // with tremolo ornaments, and an arch from hush to swell and back.
  'broad-road': `Ethereal traditional Chinese ensemble music (sizhu style) for a misty mountain tea garden \
above the clouds. Pentatonic in yu mode: the scale D E F# A B, with B as the home note and \
occasional passing C# and G. It opens very low and hushed, a slow rising line E, F#, A, B in the \
low register, then the melody climbs gently and settles on a long held A resolving to B. \
A slow, breathing pulse of about 60 BPM, free and rubato, decorated with quick pipa and \
guzheng tremolo and grace-note flurries over long sustained tones. Instruments: xiao and dizi \
bamboo flutes with airy breath, erhu singing long legato phrases, pipa tremolo, guzheng \
glissandi and harmonics, and a soft sheng chord drone beneath. Warm low-middle register, nothing \
shrill. Wide natural reverb as if echoing across a valley, distant and dreamlike, weightless. \
A gentle arch: hushed opening, a soft swelling of the whole ensemble in the middle, then \
receding back to the hush. No percussion, no drums, no vocals, no synthesizers, no Western \
orchestra. 2 to 2.5 minutes, no fade-in or fade-out; end as quietly as it began on the same low \
B, so the piece loops seamlessly.`,
}

const key = process.env.OPENROUTER_API_KEY
if (!key) throw new Error('Set OPENROUTER_API_KEY')
const takes = Number(process.argv[2] ?? 4)
const preset = process.argv[3] ?? 'guqin'
const PROMPT = PROMPTS[preset]
if (!PROMPT) throw new Error(`Unknown preset "${preset}". Use: ${Object.keys(PROMPTS).join(', ')}`)
mkdirSync('music-takes', {recursive: true})

const generate = async (n: number, format: 'mp3' | 'wav'): Promise<void> => {
  // Dev-only tool run from the terminal; never bundled into the Mini.
  // eslint-disable-next-line shop-minis/validate-manifest
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      model: MODEL,
      messages: [{role: 'user', content: PROMPT}],
      modalities: ['text', 'audio'],
      audio: {format},
      stream: true,
      seed: 1000 + n,
    }),
  })
  if (!res.ok || !res.body) {
    const text = await res.text()
    if (format === 'mp3' && res.status === 400) return generate(n, 'wav')
    throw new Error(`take ${n}: HTTP ${res.status} ${text}`)
  }

  // Server-sent events: collect base64 audio from each delta.
  const chunks: string[] = []
  let notes = ''
  let buf = ''
  const decoder = new TextDecoder()
  for await (const part of res.body as unknown as AsyncIterable<Uint8Array>) {
    buf += decoder.decode(part, {stream: true})
    let nl: number
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim()
      buf = buf.slice(nl + 1)
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta
        if (delta?.audio?.data) chunks.push(delta.audio.data)
        if (delta?.audio?.transcript) notes += delta.audio.transcript
        if (delta?.content) notes += delta.content
      } catch {
        // keep-alive comments and partial lines
      }
    }
  }
  if (!chunks.length) throw new Error(`take ${n}: no audio returned. Model said: ${notes.slice(0, 400)}`)
  const out = `music-takes/${preset}-${n}.${format}`
  writeFileSync(out, Buffer.concat(chunks.map(c => Buffer.from(c, 'base64'))))
  process.stdout.write(`✓ ${out}${notes ? `  — ${notes.slice(0, 120)}` : ''}\n`)
}

const main = async () => {
  for (let n = 1; n <= takes; n++) {
    try {
      await generate(n, 'mp3')
    } catch (e) {
      process.stderr.write(`${(e as Error).message}\n`)
    }
  }
}

main()
