import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getSpeechRecognitionConstructor,
  type SpeechRecognitionLike,
} from '@utils/story/speechRecognition'

export type RecordingResult = 'correct' | 'incorrect' | 'unsupported' | 'error'

// 단어 발음 통과 기준
const SPEECH_MATCH_THRESHOLD = 0.2

function normalizeSpeechText(text: string): string {
  return text
    .toLowerCase()
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getLevenshteinDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)

  for (let row = 1; row <= a.length; row += 1) {
    const current = [row]

    for (let col = 1; col <= b.length; col += 1) {
      const substitutionCost = a[row - 1] === b[col - 1] ? 0 : 1
      current[col] = Math.min(
        (previous[col] ?? 0) + 1,
        (current[col - 1] ?? 0) + 1,
        (previous[col - 1] ?? 0) + substitutionCost,
      )
    }

    previous = current
  }

  return previous[b.length] ?? 0
}

function getTextSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1

  const maxLength = Math.max(a.length, b.length)
  if (maxLength === 0) return 0

  return (maxLength - getLevenshteinDistance(a, b)) / maxLength
}

function getBestSpeechSimilarity(transcript: string, word: string): number {
  const normalizedTranscript = normalizeSpeechText(transcript)
  const normalizedWord = normalizeSpeechText(word)
  if (!normalizedTranscript || !normalizedWord) return 0

  const candidates = [normalizedTranscript, ...normalizedTranscript.split(' ')]
  return Math.max(
    ...candidates.map((candidate) =>
      getTextSimilarity(candidate, normalizedWord),
    ),
  )
}

function isSpeechMatch(transcript: string, word: string): boolean {
  return getBestSpeechSimilarity(transcript, word) >= SPEECH_MATCH_THRESHOLD
}

type UseVocaRecordingAnalysisParams = {
  targetWord: string
  pauseBookAudio: () => void
}

export function useVocaRecordingAnalysis({
  targetWord,
  pauseBookAudio,
}: UseVocaRecordingAnalysisParams) {
  const [isRecordingMode, setIsRecordingMode] = useState(false)
  const [recordingResult, setRecordingResult] = useState<RecordingResult>()
  const [recognizedText, setRecognizedText] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const resetRecordingAnalysis = useCallback(() => {
    recognitionRef.current?.abort()
    recognitionRef.current = null
    setIsRecordingMode(false)
    setRecordingResult(undefined)
    setRecognizedText('')
  }, [])

  const startRecordingAnalysis = useCallback(() => {
    const Recognition = getSpeechRecognitionConstructor()

    if (!Recognition) {
      setIsRecordingMode(false)
      setRecordingResult('unsupported')
      setRecognizedText('')
      return
    }

    recognitionRef.current?.abort()
    pauseBookAudio()
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
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      console.log('[VocaRecording] recognized text:', transcript, {
        targetWord,
      })
      setRecognizedText(transcript)
      setRecordingResult(
        isSpeechMatch(transcript, targetWord) ? 'correct' : 'incorrect',
      )
    }

    recognition.onerror = () => {
      setIsRecordingMode(false)
      setRecordingResult('error')
      recognitionRef.current = null
    }

    recognition.onend = () => {
      setIsRecordingMode(false)
      recognitionRef.current = null
    }

    try {
      recognition.start()
    } catch {
      setIsRecordingMode(false)
      setRecordingResult('error')
      recognitionRef.current = null
    }
  }, [pauseBookAudio, targetWord])

  useEffect(() => resetRecordingAnalysis, [resetRecordingAnalysis])

  return {
    isRecordingMode,
    recognizedText,
    recordingResult,
    resetRecordingAnalysis,
    startRecordingAnalysis,
  }
}
