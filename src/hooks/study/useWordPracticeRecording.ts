import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { isWordRecordingMatch } from '@utils/evaluateWordRecording'
import {
  getSpeechRecognitionConstructor,
  isMicrophoneUnavailableSpeechError,
  type SpeechRecognitionLike,
} from '@utils/wordSpeechRecognition'

export type WordPracticeRecordingResult =
  | 'correct'
  | 'incorrect'
  | 'no_microphone'
  | 'error'

type UseWordPracticeRecordingParams = {
  targetWord: string
  onResult?: (result: WordPracticeRecordingResult) => void
}

function detachRecognitionHandlers(recognition: SpeechRecognitionLike) {
  recognition.onresult = null
  recognition.onerror = null
  recognition.onend = null
}

export function useWordPracticeRecording({
  targetWord,
  onResult,
}: UseWordPracticeRecordingParams) {
  const [isRecordingMode, setIsRecordingMode] = useState(false)
  const [recordingResult, setRecordingResult] =
    useState<WordPracticeRecordingResult>()
  const [recognizedText, setRecognizedText] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const hasReportedResultRef = useRef(false)
  const recordingSessionIdRef = useRef(0)
  const onResultRef = useRef(onResult)

  useLayoutEffect(() => {
    onResultRef.current = onResult
  })

  const reportResult = useCallback(
    (result: WordPracticeRecordingResult, transcript = '') => {
      if (hasReportedResultRef.current) return
      hasReportedResultRef.current = true
      setIsRecordingMode(false)
      setRecordingResult(result)
      setRecognizedText(transcript)
      onResultRef.current?.(result)
    },
    [],
  )

  const resetRecordingAnalysis = useCallback(() => {
    recordingSessionIdRef.current += 1
    const recognition = recognitionRef.current
    if (recognition) {
      detachRecognitionHandlers(recognition)
      recognition.abort()
    }
    recognitionRef.current = null
    hasReportedResultRef.current = false
    setIsRecordingMode(false)
    setRecordingResult(undefined)
    setRecognizedText('')
  }, [])

  const startRecordingAnalysis = useCallback(() => {
    const Recognition = getSpeechRecognitionConstructor()
    if (!Recognition) {
      reportResult('no_microphone')
      return
    }

    const sessionId = recordingSessionIdRef.current + 1
    recordingSessionIdRef.current = sessionId

    const previousRecognition = recognitionRef.current
    if (previousRecognition) {
      detachRecognitionHandlers(previousRecognition)
      previousRecognition.abort()
      recognitionRef.current = null
    }

    hasReportedResultRef.current = false
    setRecordingResult(undefined)
    setRecognizedText('')
    setIsRecordingMode(true)

    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      if (sessionId !== recordingSessionIdRef.current) return
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      if (!transcript.trim()) return
      reportResult(
        isWordRecordingMatch(transcript, targetWord) ? 'correct' : 'incorrect',
        transcript,
      )
    }

    recognition.onerror = (event) => {
      if (sessionId !== recordingSessionIdRef.current) return
      if (event.error === 'aborted') return
      reportResult(
        isMicrophoneUnavailableSpeechError(event.error)
          ? 'no_microphone'
          : 'error',
      )
      recognitionRef.current = null
    }

    recognition.onend = () => {
      if (sessionId !== recordingSessionIdRef.current) return
      setIsRecordingMode(false)
      recognitionRef.current = null
    }

    try {
      recognition.start()
    } catch {
      if (sessionId !== recordingSessionIdRef.current) return
      reportResult('error')
      recognitionRef.current = null
    }
  }, [reportResult, targetWord])

  useEffect(() => {
    return () => {
      resetRecordingAnalysis()
    }
  }, [resetRecordingAnalysis])

  return {
    isRecordingMode,
    recognizedText,
    recordingResult,
    resetRecordingAnalysis,
    startRecordingAnalysis,
  }
}
