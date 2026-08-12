type SpeechRecognitionResultItem = {
  readonly transcript: string
}

type SpeechRecognitionResultList = {
  readonly length: number
  readonly [index: number]: {
    readonly isFinal: boolean
    readonly [index: number]: SpeechRecognitionResultItem
  }
}

export type WordSpeechRecognitionEvent = {
  readonly results: SpeechRecognitionResultList
}

export type WordSpeechRecognitionErrorEvent = {
  readonly error: string
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

export type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: WordSpeechRecognitionEvent) => void) | null
  onerror: ((event: WordSpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isMicrophoneUnavailableSpeechError(error: string): boolean {
  return error === 'not-allowed' || error === 'service-not-allowed'
}
