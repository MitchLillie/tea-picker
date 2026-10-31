/**
 * Rice-paper grain: a small noise tile painted into a canvas. Pure: it touches
 * no DOM style and creates no URLs; usePaperGrain exposes the blob to CSS.
 */
export const paintPaperGrain = (): Promise<Blob | null> => {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
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
  return new Promise(resolve => canvas.toBlob(resolve))
}
