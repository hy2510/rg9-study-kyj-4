import { useEffect, useRef, useState } from 'react'

export type PlayState = '' | 'playing' | 'paused' | 'endFn'

export default function useStudyAudio() {
  const [playState, setPlayState] = useState<PlayState>('')

  const audioRef = useRef<HTMLAudioElement>(
    (() => {
      const a = new Audio()
      a.autoplay = true
      return a
    })(),
  )
  const player = audioRef.current

  const endFn = useRef<() => void>()

  const stopAudio = () => {
    player.pause()
    player.src = ''
    player.currentTime = 0

    setPlayState('')
  }

  const pauseAudio = () => {
    if (!player.src) return
    player.pause()
    setPlayState('paused')
  }

  const resumeAudio = () => {
    if (!player.src) return
    setPlayState('playing')
    void player.play()
  }

  const seekBy = (deltaSec: number) => {
    if (!player.src) return
    const duration = Number.isFinite(player.duration) ? player.duration : null
    const next = Math.max(0, player.currentTime + deltaSec)
    player.currentTime =
      duration != null ? Math.min(next, duration) : next
  }

  useEffect(() => {
    if (playState === 'playing' || playState === 'endFn') {
      const handlerCanPlayThrough = () => {
        player.play()
      }

      player.addEventListener('canplaythrough', handlerCanPlayThrough)

      const handlerEnded = () => {
        if (playState === 'endFn') {
          if (endFn.current) {
            endFn.current()
          }
        } else {
          setPlayState('')
        }
      }

      player.addEventListener('ended', handlerEnded)

      return () => {
        player.removeEventListener('canplaythrough', handlerCanPlayThrough)
        player.removeEventListener('ended', handlerEnded)
      }
    }
  }, [playState])

  useEffect(() => {
    return () => {
      player.pause()
      player.src = ''
    }
  }, [])

  const playAudio = (src: string, cb?: () => void) => {
    player.src = src

    if (cb) {
      endFn.current = cb
      setPlayState('endFn')
    } else {
      setPlayState('playing')
    }
  }

  const changePlayState = (state: PlayState) => {
    setPlayState(state)
  }

  return {
    playState,
    changePlayState,
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
    seekBy,
  }
}
