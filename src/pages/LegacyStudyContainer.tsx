import {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useTranslation } from 'react-i18next'

import CenteredLoading from '@components/atoms/common/CenteredLoading'
import VocaPreviewPopup from '@components/organisms/story/VocaPreviewPopup'
import ActivityResultPopup from '@components/organisms/study/common/ActivityResultPopup'
import ActivityStage from '@components/organisms/study/common/ActivityStage'
import ClozeTest1 from '@components/templates/study/legacy/ClozeTest1'
import ClozeTest2 from '@components/templates/study/legacy/ClozeTest2'
import ClozeTest3 from '@components/templates/study/legacy/ClozeTest3'
import ListeningActivity1 from '@components/templates/study/legacy/ListeningActivity1'
import ListeningActivity2 from '@components/templates/study/legacy/ListeningActivity2'
import ListeningActivity3 from '@components/templates/study/legacy/ListeningActivity3'
import ListeningActivity4 from '@components/templates/study/legacy/ListeningActivity4'
import ReadingComprehension1 from '@components/templates/study/legacy/ReadingComprehension1'
import ReadingComprehension2 from '@components/templates/study/legacy/ReadingComprehension2'
import ReadingComprehension3 from '@components/templates/study/legacy/ReadingComprehension3'
import ReadingComprehension4 from '@components/templates/study/legacy/ReadingComprehension4'
import Summary1 from '@components/templates/study/legacy/Summary1'
import Summary2 from '@components/templates/study/legacy/Summary2'
import TrueOrFalse from '@components/templates/study/legacy/TrueOrFalse'
import VocabularyTest1 from '@components/templates/study/legacy/VocabularyTest1'
import VocabularyTest2 from '@components/templates/study/legacy/VocabularyTest2'
import VocabularyTest3 from '@components/templates/study/legacy/VocabularyTest3'
import VocabularyTest4 from '@components/templates/study/legacy/VocabularyTest4'
import WritingActivity1 from '@components/templates/study/legacy/WritingActivity1'
import WritingActivity2 from '@components/templates/study/legacy/WritingActivity2'
import WritingActivity2Review from '@components/templates/study/legacy/WritingActivity2Review'
import WritingActivity2Rewriting from '@components/templates/study/legacy/WritingActivity2Rewriting'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { HeartContextProvider, useHeartState } from '@contexts/HeartContext'
import { QuestionSoundSlotProvider } from '@contexts/QuestionSoundSlotContext'
import useCharacter from '@hooks/study/legacy/useCharacter'
import { useLegacyQuizManager } from '@hooks/study/legacy/useLegacyQuizManager'
import { useVocabularyPracticeByActivity } from '@hooks/study/legacy/useVocabularyPracticeByActivity'
import { useTimer } from '@hooks/study/remix/useTimer'
import { ViewType } from '@interfaces/common/ViewType'
import StudyShell from '@src/components/templates/study/common/StudyShell'
import { ACTIVITY } from '@src/constants/study/studyConstants'
import { IQuizStudyRef, IRecordAnswerType } from '@src/interfaces/common/Common'
import { StudyTypeCode } from '@src/interfaces/common/Types'
import { IReadingComprehension4 } from '@src/interfaces/study/IReadingComprehension'
import { IWritingActivity2 } from '@src/interfaces/study/IWritingActivity'
import { ILegacyStudyData } from '@src/interfaces/study/legacy/LegacyStudy'
import { buildStepProgressMap } from '@src/utils/study/legacy/buildStepProgressMap'
import { computeStepScore } from '@src/utils/study/legacy/computeStepScore'
import {
  resolveWritingRevisionMode,
  writingRevisionModeLabelKey,
} from '@src/utils/study/legacy/writingRevisionMode'

const LEGACY_TIMER_INITIAL_SEC = 1200

/**
 * ReadingComprehension4 재시험 정책 — 점수가 이 값 미만이면 다음 스텝으로
 * 진행하지 않고 해당 스텝을 처음부터 다시 풀게 한다.
 */
const RC4_RETEST_MIN_SCORE = 70

const VOCABULARY_ACTIVITIES = new Set<string>([
  ACTIVITY.VOCABULARY_1,
  ACTIVITY.VOCABULARY_2,
  ACTIVITY.VOCABULARY_3,
  ACTIVITY.VOCABULARY_4,
])

export type LegacyStudyContainerChildProps = {
  currentStep: number
  onFinishActivity: () => void
}

type LegacyStudyContainerProps = {
  changeCurrentView: (view: ViewType) => void
  isVisible?: boolean
}

export default function LegacyStudyContainer({
  changeCurrentView,
  isVisible = true,
}: LegacyStudyContainerProps) {
  const { t } = useTranslation()
  const CHARACTER = useCharacter()
  const { studyInfo, bookInfo, handler } = useContext(
    AppContext,
  ) as AppContextProps

  useEffect(() => {
    if (studyInfo.availableQuizStatus === 2) {
      alert(t('common.dailyPointLimitExceeded'))
      try {
        window.onExitStudy()
      } catch {
        location.replace('/')
      }
    }
  }, [])

  let startStep = studyInfo.startStep

  if (bookInfo.RevisionStatusCode === '028010') {
    const isOpenStep5 = studyInfo.openSteps.find((step) => step === 5)
    if (isOpenStep5) {
      startStep = 5
    }
  }

  const [currentStepId, setCurrentStepId] = useState<number>(startStep)

  /**
   * 활동 종료 후 "다음 스텝 진행 전" 게이트.
   * - 값이 number 면 해당 step 의 결과 팝업이 노출되고, 사용자가 진행 버튼을 눌러야
   *   다음 스텝으로 넘어간다.
   * - null 이면 게이트 닫힘 (정상 진행 / 미사용 상태).
   *
   * WritingActivity2 류는 결과 팝업 정책이 추후 별도로 정해질 예정이라
   * 게이트를 열지 않는다 (아래 `onCurrentActivityFinish` 분기 참고).
   */
  const [pendingFinishStepId, setPendingFinishStepId] = useState<number | null>(
    null,
  )

  /**
   * 재시험(현재 스텝 처음부터 다시 풀기) 트리거용 nonce.
   * 증가 시 `ActivityStage` key 가 바뀌어 활동이 재마운트되고 첫 문제부터 시작한다.
   */
  const [stepRunNonce, setStepRunNonce] = useState(0)

  // 하트: 활동이 fetch 후 setMax(QuizAnswerCount)로 동적 설정.
  // currentStepId 변경 시 max/current 모두 0 으로 리셋 (활동 setMax 까지 빈 하트로 노출)
  const heart = useHeartState(0, currentStepId)

  /**
   * 스텝당 20분 타이머 — 사내 정책 (모든 Legacy 활동 공통).
   *
   * - `currentStepId` 변경 시 `setup(LEGACY_TIMER_INITIAL_SEC)` 재호출 (스텝마다 리셋)
   * - 타임아웃(`isFinished`) 시 `onLogoutStudy()` 호출 (7th 의 활동별 타이머 콜백과 동등)
   * - `isVisible` false 시 일시정지, true 시 재개
   *
   * 시간 관리는 컨테이너 단일 책임 — 활동 컴포넌트는 자체 타이머 hook 을 두지 않는다.
   */
  const {
    time,
    setup,
    startTimer,
    pauseTimer,
    resumeTimer,
    isFinished,
    initialTime,
  } = useTimer()

  // 활동 컴포넌트가 패널티 등의 이유로 타이머 정지를 요청했는지 추적.
  // ref 를 사용해 isVisible effect 가 startTimer 를 호출하기 전에 확인할 수 있도록 함.
  // (자식 effect → 부모 effect 순서: 자식의 onPauseTimer 가 먼저 실행되어 ref 를 true 로 설정,
  //  이후 부모의 startTimer effect 가 ref 를 확인해 타이머를 시작하지 않는다.)
  const activityPauseRef = useRef(false)

  // 현재 스텝의 퀴즈 데이터 로딩 완료 여부 — 로딩 중에는 타이머를 시작하지 않기 위해 사용
  const [isQuizDataReady, setIsQuizDataReady] = useState(false)

  const onPauseTimer = useCallback(() => {
    activityPauseRef.current = true
    pauseTimer()
  }, [pauseTimer])

  const onResumeTimer = useCallback(() => {
    activityPauseRef.current = false
    resumeTimer()
  }, [resumeTimer])

  const currentActivity = studyInfo.mappedStepActivity[currentStepId - 1] ?? ''
  const isBookTypePB = studyInfo.bookType === 'PB'
  const isVocabularyActivity = VOCABULARY_ACTIVITIES.has(currentActivity)
  const needsPbVocaPreview = isBookTypePB && isVocabularyActivity

  const { vocaData1, vocaData2, vocaData3, vocaData4, isVocaPracticeLoading } =
    useVocabularyPracticeByActivity(
      needsPbVocaPreview ? currentActivity : undefined,
    )

  const hasVocaData = Boolean(vocaData1 || vocaData2 || vocaData3 || vocaData4)

  const [isVocaCardsOpen, setIsVocaCardsOpen] = useState(false)
  const [isPbVocaGateDone, setIsPbVocaGateDone] = useState(!needsPbVocaPreview)

  const handleCloseVocaCards = useCallback(() => {
    setIsVocaCardsOpen(false)
    setIsPbVocaGateDone(true)
    onResumeTimer()
  }, [onResumeTimer])

  const handleOpenVocaCardsFromMenu = useCallback(() => {
    if (!hasVocaData) return
    setIsVocaCardsOpen(true)
    onPauseTimer()
  }, [hasVocaData, onPauseTimer])

  useEffect(() => {
    setIsPbVocaGateDone(!needsPbVocaPreview)
    setIsVocaCardsOpen(false)
  }, [currentStepId, needsPbVocaPreview])

  useEffect(() => {
    if (!needsPbVocaPreview || isPbVocaGateDone) return
    if (isVocaPracticeLoading) return

    if (!hasVocaData) {
      setIsPbVocaGateDone(true)
      return
    }

    setIsVocaCardsOpen(true)
    onPauseTimer()
  }, [
    needsPbVocaPreview,
    isPbVocaGateDone,
    isVocaPracticeLoading,
    hasVocaData,
    onPauseTimer,
  ])

  useEffect(() => {
    setup(LEGACY_TIMER_INITIAL_SEC)
    setIsQuizDataReady(false)
  }, [currentStepId, setup])

  useEffect(() => {
    if (isVisible) {
      if (
        !activityPauseRef.current &&
        isQuizDataReady &&
        isPbVocaGateDone &&
        (time.timeMin > 0 || time.timeSec > 0)
      ) {
        startTimer()
      }
    } else {
      pauseTimer()
    }
  }, [
    isVisible,
    time,
    startTimer,
    pauseTimer,
    isQuizDataReady,
    isPbVocaGateDone,
  ])

  useEffect(() => {
    // setup 호출 전(initialTime===0)이면 무시 — 초기 마운트 시 즉시 로그아웃 방지
    if (initialTime > 0 && isFinished) {
      try {
        ;(window as Window & { onLogoutStudy?: () => void }).onLogoutStudy?.()
      } catch {
        /* ignore */
      }
    }
  }, [isFinished, initialTime])

  const formatTime = (timeMin: number, timeSec: number): string => {
    const min = String(timeMin).padStart(2, '0')
    const sec = String(timeSec).padStart(2, '0')
    return `${min}:${sec}`
  }

  /**
   * 모든 step 의 quizData + recordedData prefetch.
   * - 활동 코드별 fetcher 매핑은 이 컨테이너의 switch(currentActivity) 와 1:1 대응
   * - Vocabulary 1~4 는 사내 정책으로 Practice 폐지 → 항상 Test fetcher
   * - 결과는 사이드바(stepProgressMap) 와 마이그레이션 완료 활동 컴포넌트의 props 로 주입된다.
   */
  const quizStudyRef = useMemo<IQuizStudyRef>(
    () => ({
      mode: studyInfo.mode,
      studyId: studyInfo.studyId,
      studentHistoryId: studyInfo.studentHistoryId,
      bookType: studyInfo.bookType,
      studyTypeCode: (studyInfo.bookType === 'EB'
        ? '001006'
        : '001001') as StudyTypeCode,
    }),
    [
      studyInfo.mode,
      studyInfo.studyId,
      studyInfo.studentHistoryId,
      studyInfo.bookType,
    ],
  )
  const openStepsMemo = useMemo(
    () => studyInfo.openSteps,
    [studyInfo.openSteps],
  )
  const mappedStepActivityMemo = useMemo(
    () => studyInfo.mappedStepActivity,
    [studyInfo.mappedStepActivity],
  )
  const legacyQuizManager = useLegacyQuizManager({
    studyRef: quizStudyRef,
    openSteps: openStepsMemo,
    mappedStepActivity: mappedStepActivityMemo,
  })

  /**
   * 사이드바 카드용 step 진행 정보.
   * 빌드 로직은 `buildStepProgressMap` 유틸로 분리 (자세한 표시 규칙은 유틸 참조).
   */
  const stepProgressMap = useMemo(
    () => buildStepProgressMap(legacyQuizManager.stepDataMap),
    [legacyQuizManager.stepDataMap],
  )

  /**
   * 새로고침 재진입 게이트 (RC4 미통과 시 재응시).
   *
   * 서버는 RC4 답안이 저장돼 있으면 완료로 보고 다음 스텝을 `startStep` 으로 준다.
   * 하지만 RC4 점수가 통과 기준 미만이면 다음 스텝으로 넘어가서는 안 되므로,
   * prefetch 완료 후 RC4 스텝 점수를 확인해 미통과 + 현재 그 뒤 스텝이면
   * RC4 스텝으로 되돌리고 기록을 초기화해 처음부터 다시 풀게 한다. (최초 1회만)
   */
  const rc4ResumeGateAppliedRef = useRef(false)
  useEffect(() => {
    if (rc4ResumeGateAppliedRef.current) return
    if (legacyQuizManager.isLoading) return
    if (bookInfo.RevisionStatusCode === '028010') {
      rc4ResumeGateAppliedRef.current = true
      return
    }

    const rc4StepId = studyInfo.openSteps.find(
      (stepId) =>
        (studyInfo.mappedStepActivity[stepId - 1] ?? '') ===
        ACTIVITY.READING_COMP_4,
    )
    if (!rc4StepId) {
      rc4ResumeGateAppliedRef.current = true
      return
    }

    const rc4Data = legacyQuizManager.stepDataMap[rc4StepId]
    if (!rc4Data) return

    rc4ResumeGateAppliedRef.current = true

    const attempted = rc4Data.recordedData.length > 0
    const score = computeStepScore(stepProgressMap[rc4StepId]?.attempts ?? [])
    const rc4Index = studyInfo.openSteps.indexOf(rc4StepId)
    const currentIndex = studyInfo.openSteps.indexOf(currentStepId)

    if (attempted && score < RC4_RETEST_MIN_SCORE && currentIndex > rc4Index) {
      legacyQuizManager.resetStepRecord(rc4StepId)
      setCurrentStepId(rc4StepId)
    }
  }, [
    legacyQuizManager.isLoading,
    legacyQuizManager.stepDataMap,
    legacyQuizManager,
    stepProgressMap,
    studyInfo.openSteps,
    studyInfo.mappedStepActivity,
    bookInfo.RevisionStatusCode,
    currentStepId,
  ])

  const getNextStepId = (): number | undefined => {
    const idx = studyInfo.openSteps.findIndex(
      (value) => value === currentStepId,
    )
    return idx >= 0 && studyInfo.openSteps.length > idx + 1
      ? studyInfo.openSteps[idx + 1]
      : undefined
  }

  /**
   * 실제 다음 스텝(또는 학습 종료)로 진행하는 단일 콜백.
   *
   * 결과 팝업의 진행 버튼과, 결과 팝업을 사용하지 않는 활동(WritingActivity2 등)의
   * 즉시 진행 분기 양쪽에서 호출된다. 게이트(`pendingFinishStepId`)도 함께 닫는다.
   */
  const proceedToNextStep = () => {
    setPendingFinishStepId(null)
    const nextStepId = getNextStepId()

    if (nextStepId) {
      setCurrentStepId(nextStepId)
    } else {
      if (studyInfo.mode === 'student') {
        const tempFinishStudyInfo =
          window.sessionStorage.getItem('finishStudyInfo')

        if (tempFinishStudyInfo) {
          window.sessionStorage.removeItem('finishStudyInfo')
          handler.actionFinishStudy(JSON.parse(tempFinishStudyInfo), CHARACTER)
        } else {
          handler.actionFinishStudy(handler.finishStudy, CHARACTER)
        }
      } else {
        try {
          window.onExitStudy()
        } catch {
          location.replace('/')
        }
      }
    }
  }

  /**
   * 현재 스텝을 처음부터 다시 풀게 한다 (RC4 재시험).
   * - 해당 스텝의 로컬 recordedData 초기화 → 시작 위치가 첫 문제로 복귀
   * - nonce 증가로 활동 재마운트 (하트/진행도도 활동 마운트 시 리셋됨)
   */
  const retryCurrentStep = () => {
    const stepId = pendingFinishStepId
    setPendingFinishStepId(null)
    if (stepId === null) return
    legacyQuizManager.resetStepRecord(stepId)
    activityPauseRef.current = false
    setup(LEGACY_TIMER_INITIAL_SEC)
    setStepRunNonce((n) => n + 1)
  }

  const onCurrentActivityFinish = () => {
    if (currentActivity === ACTIVITY.WRITING_2) {
      proceedToNextStep()
      return
    }
    setPendingFinishStepId(currentStepId)
  }

  const changeStep = (step: number) => {
    setCurrentStepId(step)
  }

  const datas: ILegacyStudyData = {
    mode: studyInfo.mode,
    currentStep: currentStepId,
    studyId: studyInfo.studyId,
    studentHistoryId: studyInfo.studentHistoryId,
    bookType: studyInfo.bookType,
    studyTypeCode: (studyInfo.bookType === 'EB'
      ? '001006'
      : '001001') as StudyTypeCode,
    lastStep: studyInfo.openSteps[studyInfo.openSteps.length - 1],
    onFinishActivity: onCurrentActivityFinish,
    changeStep,
  }

  /**
   * Phase 2 마이그레이션 완료된 활동에는 prefetch 결과를 주입한다.
   * ListeningActivity2 가 첫 파일럿이며, 나머지 활동은 후속 단계에서 추가 예정.
   *
   * `onUpdateRecord` — 활동이 채점 직후 호출하면 currentStep 의 `recordedData`
   * 가 머지되어 사이드바(stepProgressMap)가 다음 렌더에서 즉시 갱신된다.
   */
  const currentStepData = legacyQuizManager.stepDataMap[currentStepId]

  // 퀴즈 데이터 로딩 완료 시 타이머 시작 허용
  useEffect(() => {
    if (currentStepData?.quizData) {
      setIsQuizDataReady(true)
    }
  }, [currentStepData?.quizData])

  const onUpdateRecord = useCallback(
    (record: IRecordAnswerType) => {
      legacyQuizManager.patchStepRecord(currentStepId, record)
    },
    [currentStepId, legacyQuizManager],
  )
  const datasWithPrefetch: ILegacyStudyData = {
    ...datas,
    quizData: currentStepData?.quizData,
    recordedData: currentStepData?.recordedData,
    onUpdateRecord,
    onPauseTimer,
    onResumeTimer,
  }

  let component: ReactNode

  switch (currentActivity) {
    case ACTIVITY.LISTENING_1:
      component = <ListeningActivity1 {...datasWithPrefetch} />
      break
    case ACTIVITY.LISTENING_2:
      component = <ListeningActivity2 {...datasWithPrefetch} />
      break
    case ACTIVITY.LISTENING_3:
      component = <ListeningActivity3 {...datasWithPrefetch} />
      break
    case ACTIVITY.LISTENING_4:
      component = <ListeningActivity4 {...datasWithPrefetch} />
      break
    case ACTIVITY.VOCABULARY_1:
      component = <VocabularyTest1 {...datasWithPrefetch} />
      break
    case ACTIVITY.VOCABULARY_2:
      component = <VocabularyTest2 {...datasWithPrefetch} />
      break
    case ACTIVITY.VOCABULARY_3:
      component = <VocabularyTest3 {...datasWithPrefetch} />
      break
    case ACTIVITY.VOCABULARY_4:
      component = <VocabularyTest4 {...datasWithPrefetch} />
      break
    case ACTIVITY.READING_COMP_1:
      component = <ReadingComprehension1 {...datasWithPrefetch} />
      break
    case ACTIVITY.READING_COMP_2:
      component = <ReadingComprehension2 {...datasWithPrefetch} />
      break
    case ACTIVITY.READING_COMP_3:
      component = <ReadingComprehension3 {...datasWithPrefetch} />
      break
    case ACTIVITY.READING_COMP_4:
      component = <ReadingComprehension4 {...datasWithPrefetch} />
      break
    case ACTIVITY.SUMMARY_1:
      component = <Summary1 {...datasWithPrefetch} />
      break
    case ACTIVITY.SUMMARY_2:
      component = <Summary2 {...datasWithPrefetch} />
      break
    case ACTIVITY.TRUE_OR_FALSE:
      component = <TrueOrFalse {...datasWithPrefetch} />
      break
    case ACTIVITY.CLOZE_1:
      component = <ClozeTest1 {...datasWithPrefetch} />
      break
    case ACTIVITY.CLOZE_2:
      component = <ClozeTest2 {...datasWithPrefetch} />
      break
    case ACTIVITY.CLOZE_3:
      component = <ClozeTest3 {...datasWithPrefetch} />
      break
    case ACTIVITY.WRITING_1:
      component = <WritingActivity1 {...datasWithPrefetch} />
      break
    case ACTIVITY.WRITING_2:
      if (studyInfo.isReview) {
        if (
          bookInfo.RevisionStatusCode === '028010' ||
          bookInfo.RevisionStatusCode === '028009'
        ) {
          component = <WritingActivity2Rewriting {...datas} />
        } else {
          component = <WritingActivity2Review {...datas} />
        }
      } else {
        component = <WritingActivity2 {...datasWithPrefetch} />
      }
      break
    default:
      component = null
  }

  /**
   * 헤더 프로그레스바: 현재 activity(step) 내부 quiz 진행만 표시.
   * activity 가 바뀌면 0 부터 다시 채워진다.
   * - progress: `attempts` 행 중 최소 1회 이상 시도된 quiz 수 (record 보유)
   * - total   : 현재 step 의 `quizCount` (없으면 1 로 폴백)
   */
  const currentStepProgress = stepProgressMap[currentStepId]
  const currentStepSolvedCount = currentStepProgress
    ? currentStepProgress.attempts.filter((row) =>
        row.some((mark) => mark !== ''),
      ).length
    : 0

  /**
   * RC4 결과 분기 — 방금 완료한 스텝이 ReadingComprehension4 인지, 점수가 기준
   * 이상(통과)인지로 나뉜다.
   * - 미통과(`isRc4Retest`): 진행 버튼이 "Try Again" 으로 바뀌고 재시험 실행.
   * - 통과(`isRc4Pass`): 틀린 문제의 학생 답/정답 리뷰(`rc4ReviewItems`)를 노출.
   */
  const isRc4Finish =
    pendingFinishStepId !== null &&
    (studyInfo.mappedStepActivity[pendingFinishStepId - 1] ?? '') ===
      ACTIVITY.READING_COMP_4

  const rc4Score =
    pendingFinishStepId !== null
      ? computeStepScore(stepProgressMap[pendingFinishStepId]?.attempts ?? [])
      : 0

  const isRc4Retest = isRc4Finish && rc4Score < RC4_RETEST_MIN_SCORE
  const isRc4Pass = isRc4Finish && rc4Score >= RC4_RETEST_MIN_SCORE

  const rc4QuizList =
    isRc4Pass && pendingFinishStepId !== null
      ? ((
          legacyQuizManager.stepDataMap[pendingFinishStepId]?.quizData as
            | IReadingComprehension4
            | undefined
        )?.Quiz ?? [])
      : []

  const rc4ReviewItems =
    isRc4Pass && pendingFinishStepId !== null
      ? (legacyQuizManager.stepDataMap[pendingFinishStepId]?.recordedData ?? [])
          .filter((record) => record.OX !== '1')
          .map((record) => ({
            questionNo: record.CurrentQuizNo,
            questionText:
              rc4QuizList.find((quiz) => quiz.QuizNo === record.QuizNo)
                ?.Question.Text ?? '',
            studentAnswer: record.StudentAnswer,
            correctAnswer: record.Correct,
          }))
      : undefined

  return (
    <HeartContextProvider value={heart}>
      <StudyShell
        character={CHARACTER}
        headerProps={{
          variant: 'study',
          engine: 'legacy',
          bookCode: bookInfo.BookCode,
          bookTitle: bookInfo.Title,
          keywords: bookInfo.Keywords,
          isBookTypePB: studyInfo.bookType === 'PB',
          changeCurrentView,
          shouldShowCenterInfo: true,
          currentHeart: heart.current,
          maxHeart: heart.max,
          time,
          formatTime,
          progress: currentStepSolvedCount,
          total: currentStepProgress?.quizCount ?? 1,
          openSteps: studyInfo.openSteps,
          currentStepId,
          stepProgressMap,
          mappedStepActivity: studyInfo.mappedStepActivity,
          showVocaCardsMenu: needsPbVocaPreview && hasVocaData,
          onOpenVocaCards: handleOpenVocaCardsFromMenu,
          statusLabel:
            currentActivity === ACTIVITY.WRITING_2
              ? (currentStepData?.quizData as IWritingActivity2 | undefined)
                  ?.Writing?.Type === 'No Revision'
                ? 'Writing Activity'
                : t(
                    writingRevisionModeLabelKey(
                      resolveWritingRevisionMode(
                        (
                          currentStepData?.quizData as
                            | IWritingActivity2
                            | undefined
                        )?.Writing?.Mode,
                      ),
                    ),
                  )
              : undefined,
        }}
      >
        {isVisible && isPbVocaGateDone && !isVocaCardsOpen && component ? (
          <ActivityStage key={`${currentStepId}:${stepRunNonce}`}>
            <QuestionSoundSlotProvider>
              {component}
            </QuestionSoundSlotProvider>
          </ActivityStage>
        ) : null}
        {isVisible &&
        needsPbVocaPreview &&
        !isPbVocaGateDone &&
        isVocaPracticeLoading ? (
          <CenteredLoading />
        ) : null}
        {pendingFinishStepId !== null && (
          <ActivityResultPopup
            stepId={pendingFinishStepId}
            activity={
              studyInfo.mappedStepActivity[pendingFinishStepId - 1] ?? ''
            }
            stepProgress={stepProgressMap[pendingFinishStepId]}
            isLastStep={getNextStepId() === undefined}
            onProceed={isRc4Retest ? retryCurrentStep : proceedToNextStep}
            proceedLabel={isRc4Retest ? 'Try Again' : undefined}
            notice={
              isRc4Retest
                ? t('study.rc4RetestNotice', { score: RC4_RETEST_MIN_SCORE })
                : undefined
            }
            character={CHARACTER}
            reviewItems={rc4ReviewItems}
          />
        )}
        {isVocaCardsOpen ? (
          <VocaPreviewPopup
            bookLevel={bookInfo.BookLevel}
            bookType={studyInfo.bookType}
            onClose={handleCloseVocaCards}
            pauseBookAudio={() => {}}
            vocaData1={vocaData1}
            vocaData2={vocaData2}
            vocaData3={vocaData3}
            vocaData4={vocaData4}
          />
        ) : null}
      </StudyShell>
    </HeartContextProvider>
  )
}
