/**
 * Rice-paper grain: a small noise tile painted once into a canvas and exposed
 * to CSS as a blob URL in --paper-grain (Shop Minis discourage base64 images).
 */
export const installPaperGrain = () => {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const img = ctx.createImageData(size, size)
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 0; i < img.data.length; i += 4) {
    const fibre = rand() < 0.012 ? 40 : 0
    const v = 120 + rand() * 60 - fibre
    img.data[i] = v
    img.data[i + 1] = v * 0.94
    img.data[i + 2] = v * 0.82
    img.data[i + 3] = rand() * 18 + fibre * 0.6
  }
  ctx.putImageData(img, 0, 0)
  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    document.documentElement.style.setProperty('--paper-grain', `url(${url})`)
  })
}
