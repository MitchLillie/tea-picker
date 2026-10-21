import {useLayoutEffect, useState, type RefObject} from 'react'

import {H, W} from './scenery'

export interface SceneBox {
  scale: number
  ox: number
  oy: number
  /** Scene coordinates → CSS pixels inside the container. */
  at: (x: number, y: number) => {left: number; top: number}
}

/**
 * Tracks how the scene's viewBox (preserveAspectRatio="xMidYMid slice") maps
 * onto the container, so HTML overlays can sit exactly on painted features.
 */
export const useSceneBox = (ref: RefObject<HTMLElement | null>): SceneBox => {
  const [size, setSize] = useState({w: W, h: H})
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({w: el.clientWidth, h: el.clientHeight})
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  const scale = Math.max(size.w / W, size.h / H)
  const ox = (size.w - W * scale) / 2
  const oy = (size.h - H * scale) / 2
  return {scale, ox, oy, at: (x, y) => ({left: ox + x * scale, top: oy + y * scale})}
}
