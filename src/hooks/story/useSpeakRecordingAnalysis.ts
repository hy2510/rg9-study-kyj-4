import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getSpeechRecognitionConstructor,
  type SpeechRecognitionEventLike,
  type SpeechRecognitionLike,
} from '@utils/story/speechRecognition'

export type SpeakRecordingResult =
  | 'correct'
  | 'incorrect'
  | 'unsupported'
  | 'error'

const WORD_MATCH_THRESHOLD = 0.45
const SENTENCE_PASS_THRESHOLD = 0.5

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

function getSpeechWords(text: string): string[] {
  const normalizedText = normalizeSpeechText(text)
  if (!normalizedText) return []
  return normalizedText.split(' ').filter(Boolean)
}

function isSentenceSpeechMatch(transcript: string, sentence: string): boolean {
  const matchedWordCount = getSequentialMatchedWordIndexes(
    transcript,
    sentence,
  ).length
  const targetWords = getSpeechWords(sentence)
  if (targetWords.length === 0) return false

  return matchedWordCount / targetWords.length >= SENTENCE_PASS_THRESHOLD
}

function getSequentialMatchedWordIndexes(
  transcript: string,
  sentence: string,
): number[] {
  const targetWords = getSpeechWords(sentence)
  const spokenWords = getSpeechWords(transcript)
  if (targetWords.length === 0 || spokenWords.length === 0) return []

  const matchedIndexes: number[] = []
  let spokenCursor = 0

  targetWords.forEach((targetWord, targetIndex) => {
    for (let i = spokenCursor; i < spokenWords.length; i += 1) {
      if (
        getTextSimilarity(spokenWords[i] ?? '', targetWord) <
        WORD_MATCH_THRESHOLD
      ) {
        continue
      }

      matchedIndexes.push(targetIndex)
      spokenCursor = i + 1
      break
    }
  })

  return matchedIndexes
}

function getTranscriptStateFromEvent(event: SpeechRecognitionEventLike): {
  transcript: string
  isFinal: boolean
} {
  const transcripts: string[] = []

  for (let i = 0; i < event.results.length; i += 1) {
    const transcript = event.results[i]?.[0]?.transcript
    if (transcript) transcripts.push(transcript)
  }

  const lastResult = event.results[event.results.length - 1]

  return {
    transcript: transcripts.join(' '),
    isFinal: lastResult?.isFinal ?? false,
  }
}

type UseSpeakRecordingAnalysisParams = {
  targetSentence: string
  maxDurationMs?: number
}

export function useSpeakRecordingAnalysis({
  targetSentence,
  maxDurationMs,
}: UseSpeakRecordingAnalysisParams) {
  const [isRecordingMode, setIsRecordingMode] = useState(false)
  const [recordingResult, setRecordingResult] = useState<SpeakRecordingResult>()
  const [recognizedText, setRecognizedText] = useState('')
  const [matchedWordIndexes, setMatchedWordIndexes] = useState<number[]>([])
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const durationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetRecordingAnalysis = useCallback(() => {
    if (durationTimerRef.current !== null) {
      clearTimeout(durationTimerRef.current)
      durationTimerRef.current = null
    }
    recognitionRef.current?.abort()
    recognitionRef.current = null
    setIsRecordingMode(false)
    setRecordingResult(undefined)
    setRecognizedText('')
    setMatchedWordIndexes([])
  }, [])

  const startRecordingAnalysis = useCallback(() => {
    const Recognition = getSpeechRecognitionConstructor()

    if (!Recognition) {
      setIsRecordingMode(false)
      setRecordingResult('unsupported')
      return
    }

    recognitionRef.current?.abort()
    setRecordingResult(undefined)
    setRecognizedText('')
    setMatchedWordIndexes([])
    setIsRecordingMode(true)

    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      const { transcript, isFinal } = getTranscriptStateFromEvent(event)
      console.log('[SpeakPractice] recognized text:', transcript, {
        targetSentence,
      })
      setRecognizedText(transcript)
      setMatchedWordIndexes(
        getSequentialMatchedWordIndexes(transcript, targetSentence),
      )
      if (!isFinal) return

      setRecordingResult(
        isSentenceSpeechMatch(transcript, targetSentence)
          ? 'correct'
          : 'incorrect',
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
      if (maxDurationMs) {
        durationTimerRef.current = setTimeout(() => {
          recognition.stop()
          durationTimerRef.current = null
        }, maxDurationMs)
      }
    } catch {
      setIsRecordingMode(false)
      setRecordingResult('error')
      recognitionRef.current = null
    }
  }, [targetSentence, maxDurationMs])

  useEffect(() => resetRecordingAnalysis, [resetRecordingAnalysis])

  return {
    isRecordingMode,
    matchedWordIndexes,
    recognizedText,
    recordingResult,
    resetRecordingAnalysis,
    startRecordingAnalysis,
  }
}
