import { BookType, Mode, StudyEntryType } from '@src/interfaces/common/Types'

interface IStudyInfo {
  allSteps: number[]
  availableQuizStatus: 0 | 1 | 2
  isSubmitPreference: boolean
  mappedStepActivity: string[]
  openSteps: number[]
  startStep: number

  studyId: string
  studentHistoryId: string
  bookType: BookType
  mode: Mode
  /** 레거시 퀴즈 Review 모드 표시용 */
  isReview?: boolean
  isSuper: boolean
  isQuizLearning: boolean

  token: string
  isDev: boolean

  /** 7th: EB 다른 해상도(정사각/비표준) — StoryBodySquare + StoryPageSquare 분기 */
  isEbAnotherSizeYn: boolean

  bookmarkPage: number
  pbookStorySoundPath: string | undefined

  studyEntryType: StudyEntryType

  /** 진입 시 Word Practice 화면으로 곧바로 이동할지 여부 (REF 유래) */
  isStartWordPractice?: boolean

  /** 진입 시 Speak 화면으로 곧바로 이동할지 여부 (REF 유래) */
  isStartSpeak?: boolean
}

export type { IStudyInfo }
