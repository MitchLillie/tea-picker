import {useEffect} from 'react'

import {paintPaperGrain} from './paper'

/** Exposes the paper grain tile to CSS as --paper-grain for the app's lifetime. */
export const usePaperGrain = () => {
  useEffect(() => {
    let cancelled = false
    let url: string | undefined
    const root = document.documentElement
    paintPaperGrain().then(blob => {
      if (cancelled || !blob) return
      url = URL.createObjectURL(blob)
      root.style.setProperty('--paper-grain', `url(${url})`)
    })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
      root.style.removeProperty('--paper-grain')
    }
  }, [])
}
