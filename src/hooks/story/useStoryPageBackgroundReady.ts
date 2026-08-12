import { useEffect, useState } from 'react'

/**
 * CSS background-image용 URL이 브라우저에서 디코드·표시 가능할 때까지 대기.
 */
export function useStoryPageBackgroundReady(imageSrc: string): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(false)
    const trimmed = imageSrc.trim()
    if (!trimmed) {
      setReady(true)
      return undefined
    }

    const img = new Image()
    let cancelled = false

    const done = () => {
      if (!cancelled) setReady(true)
    }

    img.onload = done
    img.onerror = done
    img.src = trimmed
    if (img.complete && img.naturalWidth > 0) done()

    return () => {
      cancelled = true
      img.onload = null
      img.onerror = null
    }
  }, [imageSrc])

  return ready
}
