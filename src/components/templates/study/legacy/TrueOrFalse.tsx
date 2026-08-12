import { useContext, useEffect, useRef, useState } from 'react'

import { TEXT_SHADOW_SOFT } from '@styles/tokens/textShadow'
import { useTranslation } from 'react-i18next'

import CenteredLoading from '@components/atoms/common/CenteredLoading'
import { IconSoundPlay } from '@components/atoms/common/icons/IconSoundPlay'
import { IconSoundStop } from '@components/atoms/common/icons/IconSoundStop'
import TextBox from '@components/atoms/common/TextBox'
import { TrueSentenceBox } from '@components/atoms/study/activities/true-or-false/TrueSentenceBox'
import { QuestionSoundWrapper } from '@components/atoms/study/audio/QuestionSoundWrapper'
import { SoundPlayToggleIcon } from '@components/atoms/study/audio/SoundPlayToggleIcon'
import QuizComment from '@components/atoms/study/comments/QuizComment'
import { QuizBody } from '@components/atoms/study/layout/QuizBody'
import TwoColumnCardsSection from '@components/molecules/study/layout/TwoColumnCardsSection'
import {
  NextQuestionButton,
  NextQuestionButtonWrap,
} from '@components/molecules/study/question/NextQuestionButton'
import QuestionContentRow from '@components/molecules/study/question/QuestionContentRow'
import { BlockTextQuizCardBox } from '@components/molecules/study/quizOptions/cards/BlockTextQuizCardBox'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { useHeartContext } from '@contexts/HeartContext'
import { useQuizFeedbackOptional } from '@contexts/QuizFeedbackContext'
import { useStudentAnswer } from '@hooks/study/legacy/useStudentAnswer'
import useStudyAudio from '@hooks/study/legacy/useStudyAudio'
import { useTrueFalseView } from '@hooks/study/legacy/useTrueFalseView'
import { ILegacyStudyData } from '@interfaces/study/legacy/LegacyStudy'
import { saveUserAnswer } from '@services/studyApi'
import { ACTIVITY_INSTRUCTIONS } from '@src/constants/study/activityInstructions'
import {
  IRecordAnswerType,
  IScoreBoardData,
} from '@src/interfaces/common/Common'
import { ITrueOrFalse } from '@src/interfaces/study/ITrueOrFalse'
const OPTIONS = ['True', 'False'] as const

export default function TrueOrFalse(props: ILegacyStudyData) {
  const { t } = useTranslation()
  const { studyInfo } = useContext(AppContext) as AppContextProps
  const quizFeedback = useQuizFeedbackOptional()
  const heart = useHeartContext()

  const quizData = props.quizData as ITrueOrFalse | undefined
  const recordedData = props.recordedData ?? []

  const { isReady, totalQuiz, quizAnswerCount, startQuizNo, getQuizMeta } =
    useTrueFalseView({
      quizData,
      recordedData,
      studyMode: studyInfo.mode,
    })

  const studentAnswer = useStudentAnswer(studyInfo.mode)
  const { playState, playAudio, stopAudio } = useStudyAudio()

  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(1)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showTrueSentence, setShowTrueSentence] = useState<boolean>(false)
  const isWorking = useRef<boolean>(true)

  useEffect(() => {
    if (!isReady) return
    setCurrentQuizIndex(startQuizNo)
    studentAnswer.setStudentAnswers(recordedData, quizAnswerCount)
    heart.setMax(quizAnswerCount)
    isWorking.current = false
  }, [isReady])

  useEffect(() => {
    if (!isReady) return
    setSelectedIndex(null)
    setShowTrueSentence(false)
    isWorking.current = false
  }, [currentQuizIndex])

  const currentMeta = isReady ? getQuizMeta(currentQuizIndex) : null

  useEffect(() => {
    if (!isReady || !currentMeta?.questionSound) return
    playAudio(currentMeta.questionSound)
  }, [currentQuizIndex, isReady])

  useEffect(() => {
    if (!showTrueSentence || !currentMeta?.trueSentenceSound) return
    playAudio(currentMeta.trueSentenceSound)
  }, [showTrueSentence])

  if (!isReady || !currentMeta) return <CenteredLoading />

  const correctIndex = currentMeta.isQuestionTrue ? 0 : 1

  const proceedAfterAnswer = () => {
    setSelectedIndex(null)
    setShowTrueSentence(false)
    stopAudio()
    const nextQuizNo = currentQuizIndex + 1
    if (nextQuizNo <= totalQuiz) {
      setCurrentQuizIndex(nextQuizNo)
      heart.setCurrent(quizAnswerCount)
    } else {
      props.onFinishActivity()
    }
  }

  const handleCardClick = async (index: number) => {
    if (isWorking.current) return
    if (selectedIndex !== null) return

    isWorking.current = true
    setSelectedIndex(index)
    stopAudio()

    const isCorrect = index === correctIndex
    const newTryCount = 1
    const replaceHTMLReg = /<[^>]*>/gi
    const trueText = currentMeta.trueSentenceText.replace(replaceHTMLReg, '')

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
      currentQuizNo: currentMeta.quizNo,
      correct: trueText,
      selectedAnswer: isCorrect ? trueText : 'user has the wrong opinion.',
      tryCount: newTryCount,
      maxQuizCount: quizAnswerCount,
      quizLength: totalQuiz,
      isCorrect,
      answerData,
      isFinishStudy: props.lastStep === props.currentStep,
    })

    try {
      const res = await saveUserAnswer(studyInfo.mode, userAnswer)
      if (Number(res.result) !== 0) {
        isWorking.current = false
        setSelectedIndex(null)
        return
      }
    } catch {
      isWorking.current = false
      setSelectedIndex(null)
      return
    }

    studentAnswer.addStudentAnswer(answerData)
    const tempRecord: IRecordAnswerType = {
      QuizId: `${currentMeta.quizId}`,
      QuizNo: currentMeta.quizNo,
      CurrentQuizNo: currentMeta.quizNo,
      OX: isCorrect ? '1' : '2',
      TempText: '',
      PenaltyWord: '',
      Correct: trueText,
      StudentAnswer: isCorrect ? trueText : 'user has the wrong opinion.',
      AnswerCount: newTryCount,
    }
    props.onUpdateRecord?.(tempRecord)
    if (!isCorrect) {
      heart.decrease()
    }

    const finalize = () => {
      // 정답 문장이 거짓이면 정답 문장 노출 후 사용자 다음 클릭 대기
      if (!currentMeta.isQuestionTrue) {
        setShowTrueSentence(true)
        isWorking.current = false
      } else {
        proceedAfterAnswer()
      }
    }

    if (quizFeedback) {
      quizFeedback.presentResult(isCorrect, finalize)
    } else {
      finalize()
    }
  }

  const handleQuestionSound = () => {
    if (!currentMeta.questionSound) return
    if (playState === 'playing') {
      stopAudio()
    } else {
      playAudio(currentMeta.questionSound)
    }
  }

  const handleTrueSentenceSound = () => {
    if (!currentMeta.trueSentenceSound) return
    if (playState === 'playing') {
      stopAudio()
    } else {
      playAudio(currentMeta.trueSentenceSound)
    }
  }

  return (
    <>
      <QuestionSoundWrapper>
        <SoundPlayToggleIcon
          isPlaying={playState === 'playing' && !showTrueSentence}
          disabled={selectedIndex !== null}
          onClick={handleQuestionSound}
        />
      </QuestionSoundWrapper>

      <QuizBody>
        <QuizComment>{t(ACTIVITY_INSTRUCTIONS.TRUE_OR_FALSE)}</QuizComment>

        <QuestionContentRow>
          <TextBox fontSize={1.5} fontWeight={800}>
            <span
              dangerouslySetInnerHTML={{ __html: currentMeta.questionText }}
            />
          </TextBox>
        </QuestionContentRow>

        <TwoColumnCardsSection>
          {OPTIONS.map((text, index) => (
            <BlockTextQuizCardBox
              key={`${currentMeta.quizId}-${index}`}
              $pressed={selectedIndex === index}
              $isCorrect={selectedIndex === index && index === correctIndex}
              $isIncorrect={selectedIndex === index && index !== correctIndex}
              onClick={() => handleCardClick(index)}
            >
              <TextBox fontSize={1.2} fontWeight={600} color='primary'>
                {text}
              </TextBox>
            </BlockTextQuizCardBox>
          ))}
        </TwoColumnCardsSection>

        {showTrueSentence && (
          <TrueSentenceBox>
            <span className='label'>True sentence</span>
            <div className='content'>
              <button
                type='button'
                tabIndex={-1}
                className='play-btn'
                onClick={handleTrueSentenceSound}
                disabled={!currentMeta.trueSentenceSound}
                aria-label={playState === 'playing' ? '정지' : '재생'}
              >
                {playState === 'playing' ? (
                  <IconSoundStop width={32} height={32} />
                ) : (
                  <IconSoundPlay width={32} height={32} />
                )}
              </button>
              <TextBox fontSize={1.1} fontWeight={600}>
                <span
                  dangerouslySetInnerHTML={{
                    __html: currentMeta.trueSentenceText,
                  }}
                />
              </TextBox>
            </div>

            <NextQuestionButtonWrap>
              <NextQuestionButton
                $marginBottom={0}
                type='button'
                tabIndex={-1}
                onClick={proceedAfterAnswer}
              >
                {t('study.nextQuestion')}
              </NextQuestionButton>
            </NextQuestionButtonWrap>
          </TrueSentenceBox>
        )}
      </QuizBody>
    </>
  )
}
