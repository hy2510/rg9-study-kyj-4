import { useEffect, useRef, useState } from 'react'

type UseSpeakAudioProps = {
  soundPath: string
  onEnded?: () => void
}

export default function useSpeakAudio({
  soundPath,
  onEnded,
}: UseSpeakAudioProps) {
  const playerRef = useRef(new Audio())
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const onEndedRef = useRef(onEnded)
  useEffect(() => {
    onEndedRef.current = onEnded
  })

  useEffect(() => {
    const player = playerRef.current
    setAudioDuration(0)
    setIsPlaying(false)
    setIsAudioReady(false)

    const handleLoadedMetadata = () => setAudioDuration(player.duration)
    const handleCanPlayThrough = () => {
      setIsAudioReady(true)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      onEndedRef.current?.()
    }

    player.addEventListener('loadedmetadata', handleLoadedMetadata)
    player.addEventListener('canplaythrough', handleCanPlayThrough)
    player.addEventListener('ended', handleEnded)
    player.src = soundPath

    return () => {
      player.removeEventListener('loadedmetadata', handleLoadedMetadata)
      player.removeEventListener('canplaythrough', handleCanPlayThrough)
      player.removeEventListener('ended', handleEnded)
      player.pause()
      player.src = ''
    }
  }, [soundPath])

  const play = () => {
    const player = playerRef.current
    player.currentTime = 0
    player
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false))
  }

  const reset = () => {
    const player = playerRef.current
    player.pause()
    setIsPlaying(false)
  }

  return { isPlaying, isAudioReady, audioDuration, play, reset }
}
