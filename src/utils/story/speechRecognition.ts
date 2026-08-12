export type SpeechRecognitionResultLike = {
  readonly transcript: string
}

export type SpeechRecognitionEventLike = Event & {
  readonly results: {
    readonly length: number
    readonly [index: number]: {
      readonly isFinal: boolean
      readonly [index: number]: SpeechRecognitionResultLike
    }
  }
}

export type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

export function getSpeechRecognitionConstructor() {
  const speechWindow = window as SpeechRecognitionWindow
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
}
