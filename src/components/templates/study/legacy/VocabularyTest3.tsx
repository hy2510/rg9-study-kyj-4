import { useCallback, useContext, useEffect, useRef, useState } from 'react'

import { useTranslation } from 'react-i18next'

import CenteredLoading from '@components/atoms/common/CenteredLoading'
import TextBox from '@components/atoms/common/TextBox'
import { MeaningPanel } from '@components/atoms/study/activities/vocabulary-test-03/MeaningPanel'
import QuizComment from '@components/atoms/study/comments/QuizComment'
import { QuizBody } from '@components/atoms/study/layout/QuizBody'
import SpellingInputDisplay from '@components/organisms/study/common/SpellingInputDisplay'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { useHeartContext } from '@contexts/HeartContext'
import { useQuizFeedbackOptional } from '@contexts/QuizFeedbackContext'
import { useStudentAnswer } from '@hooks/study/legacy/useStudentAnswer'
import useStudyAudio from '@hooks/study/legacy/useStudyAudio'
import {
  useVocabularyTest3View,
  VocabularyTest3PenaltyState,
} from '@hooks/study/legacy/useVocabularyTest3View'
import { useSpellingPhysicalKeyboard } from '@hooks/study/remix/useSpellingPhysicalKeyboard'
import { ILegacyStudyData } from '@interfaces/study/legacy/LegacyStudy'
import { deletePenalty, saveUserAnswer } from '@services/studyApi'
import { ACTIVITY_INSTRUCTIONS } from '@src/constants/study/activityInstructions'
import {
  IRecordAnswerType,
  IScoreBoardData,
} from '@src/interfaces/common/Common'
import { IVocabulary3Test } from '@src/interfaces/study/IVocabulary'
import {
  buildDisplayText,
  getLettersOnly,
  isSpellingCorrect,
} from '@utils/spellingUtils'

export default function VocabularyTest3(props: ILegacyStudyData) {
  const { t } = useTranslation()
  const { bookInfo, studyInfo } = useContext(AppContext) as AppContextProps
  const quizFeedback = useQuizFeedbackOptional()
  const heart = useHeartContext()

  const quizData = props.quizData as IVocabulary3Test | undefined
  const recordedData = props.recordedData ?? []

  const {
    isReady,
    totalQuiz,
    quizAnswerCount,
    isEnabledPenalty,
    initial,
    getQuizMeta,
  } = useVocabularyTest3View({
    quizData,
    recordedData,
    studyMode: studyInfo.mode,
  })

  const studentAnswer = useStudentAnswer(studyInfo.mode)
  const { playAudio, stopAudio } = useStudyAudio()

  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(1)
  const [tryCount, setTryCount] = useState<number>(0)
  const [inputLetters, setInputLetters] = useState<string>('')
  const [penaltyState, setPenaltyState] =
    useState<VocabularyTest3PenaltyState>('none')
  const [checkedIncorrect, setCheckedIncorrect] = useState<boolean>(false)
  const isWorking = useRef<boolean>(true)
  const onEnterRef = useRef<() => void>(() => {})

  const autoFillInputIfNeeded = (correctText: string) => {
    if (
      (studyInfo.mode === 'review' && Number(bookInfo.Average) >= 70) ||
      studyInfo.mode === 'staff'
    ) {
      setInputLetters(getLettersOnly(correctText).toLowerCase())
    } else {
      setInputLetters('')
    }
  }

  useEffect(() => {
    if (!isReady) return
    if (initial.startQuizNo > totalQuiz) {
      props.onFinishActivity()
      return
    }
    setCurrentQuizIndex(initial.startQuizNo)
    setTryCount(initial.startTryCount)
    setPenaltyState(initial.startPenaltyState)
    studentAnswer.setStudentAnswers(recordedData, quizAnswerCount)
    heart.setMax(quizAnswerCount)
    heart.setCurrent(quizAnswerCount - initial.startTryCount)
    isWorking.current = false
    const meta = getQuizMeta(initial.startQuizNo)
    if (initial.startPenaltyState === 'none' && meta)
      autoFillInputIfNeeded(meta.correctText)
    else setInputLetters('')
  }, [isReady])

  useEffect(() => {
    if (!isReady) return
    if (currentQuizIndex === initial.startQuizNo) return
    setPenaltyState('none')
    setCheckedIncorrect(false)
    isWorking.current = false
    const meta = getQuizMeta(currentQuizIndex)
    if (meta) autoFillInputIfNeeded(meta.correctText)
  }, [currentQuizIndex])

  const currentMeta = isReady ? getQuizMeta(currentQuizIndex) : null

  useEffect(() => {
    if (penaltyState === 'penalty') {
      isWorking.current = false
    } else if (penaltyState === 'success') {
      // eslint-disable-next-line react-hooks/immutability -- finalizePenalty 는 컴포넌트 함수 내 정의
      finalizePenalty()
    }
  }, [penaltyState])

  useEffect(() => {
    onEnterRef.current = () => {
      if (!currentMeta) return
      if (isWorking.current) return
      const correctLetterLen = getLettersOnly(currentMeta.correctText).length
      if (inputLetters.length < correctLetterLen) return

      if (penaltyState === 'penalty') {
        if (isSpellingCorrect(inputLetters, currentMeta.correctText)) {
          setPenaltyState('success')
        } else {
          setCheckedIncorrect(true)
        }
        return
      }

      if (penaltyState !== 'none') return

      if (!isSpellingCorrect(inputLetters, currentMeta.correctText)) {
        setCheckedIncorrect(true)
      }
      // eslint-disable-next-line react-hooks/immutability -- checkAnswer 는 컴포넌트 함수 내 정의
      checkAnswer(buildDisplayText(currentMeta.correctText, inputLetters))
    }
  })

  const handleKeyPress = useCallback(
    (key: string) => {
      if (!currentMeta) return
      if (isWorking.current) return
      const maxLen = getLettersOnly(currentMeta.correctText).length
      if (key === 'backspace') {
        setCheckedIncorrect(false)
        setInputLetters((prev) => prev.slice(0, -1))
      } else if (key === 'enter') {
        onEnterRef.current()
      } else if (/^[a-zA-Z]$/.test(key)) {
        setCheckedIncorrect(false)
        setInputLetters((prev) => (prev + key.toLowerCase()).slice(0, maxLen))
      }
    },
    [currentMeta],
  )

  useSpellingPhysicalKeyboard({ onKeyPress: handleKeyPress })

  if (!isReady || !currentMeta) return <CenteredLoading />

  const advanceToNext = () => {
    const nextQuizNo = currentQuizIndex + 1
    if (nextQuizNo <= totalQuiz) {
      setInputLetters('')
      setCheckedIncorrect(false)
      setPenaltyState('none')
      setCurrentQuizIndex(nextQuizNo)
      setTryCount(0)
      heart.setCurrent(quizAnswerCount)
      isWorking.current = false
    } else {
      props.onFinishActivity()
    }
  }

  const proceedAfterAnswer = (isCorrect: boolean, newTryCount: number) => {
    if (isCorrect) {
      const goNext = () => {
        stopAudio()
        advanceToNext()
      }
      if (currentMeta.sound) playAudio(currentMeta.sound, goNext)
      else goNext()
      return
    }

    if (newTryCount >= quizAnswerCount) {
      if (isEnabledPenalty) {
        setInputLetters('')
        setCheckedIncorrect(false)
        setPenaltyState('penalty')
      } else {
        advanceToNext()
      }
      return
    }

    setInputLetters('')
    setCheckedIncorrect(false)
    setTryCount(newTryCount)
    isWorking.current = false
    if (newTryCount === quizAnswerCount - 1) {
      if (currentMeta.sound) playAudio(currentMeta.sound)
    }
  }

  const checkAnswer = async (selectedAnswer: string) => {
    if (isWorking.current) return
    isWorking.current = true
    stopAudio()

    const isCorrect = isSpellingCorrect(selectedAnswer, currentMeta.correctText)
    const newTryCount = tryCount + 1

    const answerData: IScoreBoardData = {
      quizNo: currentMeta.quizNo,
      maxCount: quizAnswerCount,
      answerCount: newTryCount,
      ox: isCorrect,
    }

    const userAnswer = studentAnswer.makeUserAnswerData({
      mobile: '',
      studyId: props.studyId,
      studentHistoryId: props.studentHistoryId,
      bookType: props.bookType,
      step: props.currentStep,
      quizId: currentMeta.quizId,
      quizNo: currentMeta.quizNo,
      currentQuizNo: currentQuizIndex,
      correct: currentMeta.correctText,
      selectedAnswer,
      tryCount: newTryCount,
      maxQuizCount: quizAnswerCount,
      quizLength: totalQuiz,
      isCorrect,
      answerData,
      isEnabledPenalty,
      isFinishStudy: props.lastStep === props.currentStep,
    })

    try {
      const res = await saveUserAnswer(studyInfo.mode, userAnswer)
      if (Number(res.result) !== 0) {
        isWorking.current = false
        return
      }
    } catch {
      isWorking.current = false
      return
    }

    studentAnswer.addStudentAnswer(answerData)
    const tempRecord: IRecordAnswerType = {
      QuizId: `${currentMeta.quizId}`,
      QuizNo: currentMeta.quizNo,
      CurrentQuizNo: currentQuizIndex,
      OX: isCorrect ? '1' : '2',
      TempText: '',
      PenaltyWord: '',
      Correct: currentMeta.correctText,
      StudentAnswer: selectedAnswer,
      AnswerCount: newTryCount,
    }
    props.onUpdateRecord?.(tempRecord)
    if (!isCorrect) {
      heart.decrease()
    }

    if (quizFeedback) {
      quizFeedback.presentResult(isCorrect, () =>
        proceedAfterAnswer(isCorrect, newTryCount),
      )
    } else {
      proceedAfterAnswer(isCorrect, newTryCount)
    }
  }

  /**
   * 패널티 완료 → deletePenalty → 음원 재생 → 다음 문제 진행.
   */
  const finalizePenalty = async () => {
    const isLastQuiz = currentQuizIndex + 1 > totalQuiz
    try {
      const res = await deletePenalty({
        mobile: '',
        bookType: props.bookType,
        studyId: props.studyId,
        studentHistoryId: props.studentHistoryId,
        step: String(props.currentStep),
        quizId: currentMeta.quizId,
        isLastQuiz,
        isFinishStudy: isLastQuiz && props.lastStep === props.currentStep,
      })
      if (Number(res.result) !== 0) return
    } catch {
      return
    }

    const goNext = () => {
      stopAudio()
      advanceToNext()
    }
    if (currentMeta.sound) playAudio(currentMeta.sound, goNext)
    else goNext()
  }

  // === Render ===

  const isPenalty = penaltyState !== 'none'
  const isAllFilled =
    inputLetters.length === getLettersOnly(currentMeta.correctText).length

  return (
    <QuizBody>
      <QuizComment>{t(ACTIVITY_INSTRUCTIONS.VOCABULARY_TEST3)}</QuizComment>
      <div>
        <MeaningPanel>
          <TextBox fontSize={1.6} fontWeight={700} color='primary'>
            {currentMeta.speechPart}. {currentMeta.mainMean}
          </TextBox>
          {currentMeta.subMean && (
            <TextBox fontSize={1} fontWeight={400} color='lightslategray'>
              {currentMeta.speechPart}. {currentMeta.subMean}
            </TextBox>
          )}
        </MeaningPanel>

        <SpellingInputDisplay
          correctWord={currentMeta.correctText}
          inputLetters={inputLetters}
          isCorrect={false}
          isIncorrect={checkedIncorrect}
          isPenalty={isPenalty}
          showEnterButton
          isEnterEnabled={isAllFilled}
          wrongKeyCount={1}
          allowFullKeyboardToggle
          onKeyPress={handleKeyPress}
        />
      </div>
    </QuizBody>
  )
}
