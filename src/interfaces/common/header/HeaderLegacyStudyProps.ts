import { HeaderStudyBaseProps } from '@interfaces/common/header/HeaderStudyBaseProps'
import { LegacyStepProgress } from '@interfaces/common/header/LegacyStepProgress'

/** Legacy 학습 엔진(LegacyStudyContainer) 전용 헤더 props */
export type HeaderLegacyStudyProps = HeaderStudyBaseProps & {
  engine: 'legacy'
  /** 학습 가능한 step 번호 목록 (사이드바 카드 갯수의 기준) */
  openSteps: number[]
  /** 현재 진행 중인 step 번호 */
  currentStepId: number
  /**
   * stepId → 사이드바 카드 진행 정보 (없으면 prefetch 미완료/미지원 활동).
   * `useLegacyQuizManager.stepDataMap` 의 `quizData` + `recordedData` 를
   * 기반으로 컨테이너가 계산해 전달한다.
   */
  stepProgressMap: Record<number, LegacyStepProgress | undefined>
  /** PB Vocabulary — 사이드 메뉴 단어 카드 노출 여부 */
  showVocaCardsMenu?: boolean
  onOpenVocaCards?: () => void
}
