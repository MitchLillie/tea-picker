import {useEffect, useState} from 'react'

/** Blob URL for sprite markup, created in an effect and revoked on cleanup. */
export const useSpriteUrl = (svg: string): string | undefined => {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    const u = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml'}))
    setUrl(u)
    return () => {
      URL.revokeObjectURL(u)
      setUrl(undefined)
    }
  }, [svg])
  return url
}
