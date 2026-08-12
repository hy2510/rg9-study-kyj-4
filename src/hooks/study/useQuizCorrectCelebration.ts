import { useCallback, useEffect, useRef, useState } from 'react'

const CORRECTION_CORRECT_SOUND_URL = 'https://wcfresource.a1edu.com/newsystem/sound/common/correct.mp3'
const TRIGGER_DEBOUNCE_MS = 500

export function useQuizCorrectCelebration() {
  const feedbackAudioRef = useRef<HTMLAudioElement | null>(null)
  const lastTriggerAtRef = useRef(0)
  const [confettiBurstKey, setConfettiBurstKey] = useState<number | null>(null)

  useEffect(() => {
    return () => {
      feedbackAudioRef.current?.pause()
      feedbackAudioRef.current = null
    }
  }, [])

  const clearConfetti = useCallback(() => {
    setConfettiBurstKey(null)
  }, [])

  const trigger = useCallback((onSoundEnd?: () => void): boolean => {
    const now = Date.now()
    if (now - lastTriggerAtRef.current < TRIGGER_DEBOUNCE_MS) return false
    lastTriggerAtRef.current = now

    feedbackAudioRef.current?.pause()
    const audio = new Audio(CORRECTION_CORRECT_SOUND_URL)
    feedbackAudioRef.current = audio

    if (onSoundEnd) {
      audio.addEventListener('ended', onSoundEnd, { once: true })
      audio.addEventListener('error', onSoundEnd, { once: true })
    }

    audio.play().catch(() => { onSoundEnd?.() })
    setConfettiBurstKey((prev) => (prev ?? 0) + 1)
    return true
  }, [])

  return { confettiBurstKey, trigger, clearConfetti }
}
