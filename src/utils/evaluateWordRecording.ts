import {
  WORD_RECORDING_ALWAYS_PASS_WORDS,
  WORD_RECORDING_SPEECH_MATCH_THRESHOLD,
} from '@src/constants/study/word-practice/wordRecordingExceptions'

export function normalizeSpeechText(text: string): string {
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

export function getTextSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1
  const maxLength = Math.max(a.length, b.length)
  if (maxLength === 0) return 0
  return (maxLength - getLevenshteinDistance(a, b)) / maxLength
}

function getTranscriptCandidates(transcript: string): string[] {
  const normalizedTranscript = normalizeSpeechText(transcript)
  if (!normalizedTranscript) return []
  return [
    normalizedTranscript,
    ...normalizedTranscript.split(' ').filter(Boolean),
  ]
}

export function getBestSpeechSimilarity(
  transcript: string,
  target: string,
): number {
  const normalizedTarget = normalizeSpeechText(target)
  if (!normalizedTarget) return 0
  const candidates = getTranscriptCandidates(transcript)
  if (candidates.length === 0) return 0
  return Math.max(
    ...candidates.map((candidate) =>
      getTextSimilarity(candidate, normalizedTarget),
    ),
  )
}

export function isWordRecordingAlwaysPass(targetWord: string): boolean {
  return WORD_RECORDING_ALWAYS_PASS_WORDS.has(normalizeSpeechText(targetWord))
}

export function isWordRecordingMatch(
  transcript: string,
  targetWord: string,
): boolean {
  if (isWordRecordingAlwaysPass(targetWord)) return true
  return (
    getBestSpeechSimilarity(transcript, targetWord) >=
    WORD_RECORDING_SPEECH_MATCH_THRESHOLD
  )
}
