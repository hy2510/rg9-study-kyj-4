/**
 * Practice B2 — 한글 뜻 플래시카드 + 영단어 말하기
 * - 정답: 컨페티 → 단어 음성 → 카드 fly-up 전환
 * - 2회 오답: 정답 공개 후 자동 전환 / 스킵 즉시 이동
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { media } from '@styles/tokens/breakpoints'
import { useTranslation } from 'react-i18next'
import styled, { css, keyframes } from 'styled-components'

import arrowRightIcon from '@assets/icons/arrow-right.svg'
import microphoneIcon from '@assets/icons/microphone.svg'
import correctionIncorrectSound from '@assets/sounds/common/correction-incorrect-sound.mp3'
import TextBox from '@components/atoms/common/TextBox'
import QuizComment from '@components/atoms/study/comments/QuizComment'
import QuizCorrectConfettiLayer from '@components/atoms/study/feedback/QuizCorrectConfettiLayer'
import { QuizBody } from '@components/atoms/study/layout/QuizBody'
import MicrophoneUnavailableConfirm from '@components/molecules/common/MicrophoneUnavailableConfirm'
import { ACTIVITY_INSTRUCTIONS } from '@constants/study/activityInstructions'
import { useWordPracticeScoreOptional } from '@contexts/WordPracticeScoreContext'
import { useQuizContainerShake } from '@hooks/study/useQuizContainerShake'
import { useQuizCorrectCelebration } from '@hooks/study/useQuizCorrectCelebration'
import type { WordPracticeRecordingResult } from '@hooks/study/useWordPracticeRecording'
import { useWordPracticeRecording } from '@hooks/study/useWordPracticeRecording'
import type { WordMeaningPracticeItem } from '@interfaces/study/word-practice/wordMeaningPractice'

const AUTO_ADVANCE_MS = 1500
const CARD_TRANSITION_MS = 500
const CORRECT_FLOW_FALLBACK_MS = 4000
const WORD_SOUND_TIMEOUT_MS = 3000
const MAX_VISIBLE_STACK_CARDS = 3
const BACK_CARD_OFFSET_Y_PX = 14
const BACK_CARD_SCALE_STEP = 0.06
const MAX_INCORRECT_ATTEMPTS = 2
const RECORD_BUTTON_SIZE_PX = 60
const SKIP_ARROW_SIZE_PX = 16

type PracticeB2Props = {
  items: WordMeaningPracticeItem[]
  initialIndex?: number
  onComplete?: () => void
  onProgressChange?: (current: number, total: number) => void
}

export default function PracticeB2({
  items,
  initialIndex = 0,
  onComplete,
  onProgressChange,
}: PracticeB2Props) {
  const { t } = useTranslation()
  const wordPracticeScore = useWordPracticeScoreOptional()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const scoreRecordedRef = useRef(false)
  const [isCardExiting, setIsCardExiting] = useState(false)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const [incorrectAttemptCount, setIncorrectAttemptCount] = useState(0)
  const [showIncorrectFeedback, setShowIncorrectFeedback] = useState(false)
  const [showMicUnavailableDialog, setShowMicUnavailableDialog] =
    useState(false)
  const incorrectAudioRef = useRef<HTMLAudioElement | null>(null)
  const wordAudioRef = useRef<HTMLAudioElement | null>(null)
  const advanceTimerRef = useRef<number | null>(null)
  const retryTimerRef = useRef<number | null>(null)
  const correctFlowFallbackTimerRef = useRef<number | null>(null)
  const wordSoundProceedRef = useRef<(() => void) | null>(null)
  const isCardTransitioningRef = useRef(false)
  const shouldAnimateCardAfterBurstRef = useRef(false)
  const { confettiBurstKey, trigger, clearConfetti } =
    useQuizCorrectCelebration()
  const { triggerShake } = useQuizContainerShake()

  const currentItem = items[currentIndex]

  const recordB2Score = useCallback(
    (result: 'correct' | 'neutral') => {
      if (scoreRecordedRef.current || !currentItem) return
      scoreRecordedRef.current = true
      wordPracticeScore?.recordStepResult(
        currentItem.word,
        'practiceB2',
        result,
      )
    },
    [currentItem, wordPracticeScore],
  )

  const remainingQuestionCount = items.length - currentIndex
  const backCardCount = Math.min(
    MAX_VISIBLE_STACK_CARDS - 1,
    Math.max(0, remainingQuestionCount - 1),
  )

  const clearTimers = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    if (correctFlowFallbackTimerRef.current !== null) {
      window.clearTimeout(correctFlowFallbackTimerRef.current)
      correctFlowFallbackTimerRef.current = null
    }
  }, [])

  const advanceToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= items.length - 1) {
        onComplete?.()
        return prev
      }
      return prev + 1
    })
  }, [items.length, onComplete])

  const advanceToNextRef = useRef(advanceToNext)
  useLayoutEffect(() => {
    advanceToNextRef.current = advanceToNext
  })

  const stopWordAudio = useCallback(() => {
    const audio = wordAudioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      wordAudioRef.current = null
    }
  }, [])

  const startCardTransitionRef = useRef<() => void>(() => {})

  const playWordSoundAndProceed = useCallback(
    (proceed: () => void) => {
      wordSoundProceedRef.current = proceed

      if (!currentItem?.sound) {
        wordSoundProceedRef.current = null
        proceed()
        return
      }

      stopWordAudio()
      const audio = new Audio(currentItem.sound)
      wordAudioRef.current = audio

      const finish = () => {
        if (wordAudioRef.current === audio) {
          wordAudioRef.current = null
        }
        const pendingProceed = wordSoundProceedRef.current
        wordSoundProceedRef.current = null
        pendingProceed?.()
      }

      const fallbackTimer = window.setTimeout(finish, WORD_SOUND_TIMEOUT_MS)
      const finishWithCleanup = () => {
        window.clearTimeout(fallbackTimer)
        finish()
      }

      audio.addEventListener('ended', finishWithCleanup, { once: true })
      audio.addEventListener('error', finishWithCleanup, { once: true })
      audio.play().catch(finishWithCleanup)
    },
    [currentItem, stopWordAudio],
  )

  const playWordSoundAndProceedRef = useRef(playWordSoundAndProceed)
  useLayoutEffect(() => {
    playWordSoundAndProceedRef.current = playWordSoundAndProceed
  })

  const resetRecordingAnalysisRef = useRef<() => void>(() => {})

  const startCardTransition = useCallback(() => {
    isCardTransitioningRef.current = true
    setIsCardExiting(true)
    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null
      isCardTransitioningRef.current = false
      setIsCardExiting(false)
      setIsAnswerRevealed(false)
      resetRecordingAnalysisRef.current()
      advanceToNextRef.current()
    }, CARD_TRANSITION_MS)
  }, [])

  useLayoutEffect(() => {
    startCardTransitionRef.current = startCardTransition
  })

  const playWordSoundThenTransition = useCallback(() => {
    playWordSoundAndProceedRef.current(startCardTransitionRef.current)
  }, [])

  const playIncorrectSound = useCallback(() => {
    incorrectAudioRef.current?.pause()
    const audio = new Audio(correctionIncorrectSound)
    incorrectAudioRef.current = audio
    audio.play().catch(() => {})
  }, [])

  const handleRecordingResult = useCallback(
    (result: WordPracticeRecordingResult) => {
      clearTimers()

      if (result === 'correct') {
        recordB2Score('correct')
        setIsAnswerRevealed(true)
        shouldAnimateCardAfterBurstRef.current = true

        const didTrigger = trigger()
        if (!didTrigger) {
          shouldAnimateCardAfterBurstRef.current = false
          playWordSoundThenTransition()
          return
        }

        correctFlowFallbackTimerRef.current = window.setTimeout(() => {
          if (!shouldAnimateCardAfterBurstRef.current) return

          shouldAnimateCardAfterBurstRef.current = false
          playWordSoundThenTransition()
        }, CORRECT_FLOW_FALLBACK_MS)
        return
      }

      if (result === 'incorrect') {
        playIncorrectSound()
        triggerShake()
        setShowIncorrectFeedback(true)
        resetRecordingAnalysisRef.current()

        const nextAttemptCount = incorrectAttemptCount + 1
        setIncorrectAttemptCount(nextAttemptCount)

        if (nextAttemptCount >= MAX_INCORRECT_ATTEMPTS) {
          recordB2Score('neutral')
          setIsAnswerRevealed(true)
          advanceTimerRef.current = window.setTimeout(() => {
            playWordSoundThenTransition()
          }, AUTO_ADVANCE_MS)
          return
        }

        retryTimerRef.current = window.setTimeout(() => {
          setShowIncorrectFeedback(false)
        }, AUTO_ADVANCE_MS)
        return
      }

      if (result === 'no_microphone') {
        resetRecordingAnalysisRef.current()
        setShowMicUnavailableDialog(true)
        return
      }

      triggerShake()
      setShowIncorrectFeedback(true)
      resetRecordingAnalysisRef.current()
      retryTimerRef.current = window.setTimeout(() => {
        setShowIncorrectFeedback(false)
      }, AUTO_ADVANCE_MS)
    },
    [
      clearTimers,
      incorrectAttemptCount,
      playIncorrectSound,
      playWordSoundThenTransition,
      recordB2Score,
      trigger,
      triggerShake,
    ],
  )

  const {
    isRecordingMode,
    recordingResult,
    resetRecordingAnalysis,
    startRecordingAnalysis,
  } = useWordPracticeRecording({
    targetWord: currentItem?.word ?? '',
    onResult: handleRecordingResult,
  })

  useLayoutEffect(() => {
    resetRecordingAnalysisRef.current = resetRecordingAnalysis
  })

  const isCorrect = recordingResult === 'correct'
  const isIncorrect = showIncorrectFeedback && !isAnswerRevealed
  const isInteractionLocked =
    isRecordingMode || isAnswerRevealed || isCorrect || showMicUnavailableDialog

  const handleBurstEnd = useCallback(() => {
    clearConfetti()
    if (!shouldAnimateCardAfterBurstRef.current) return

    if (correctFlowFallbackTimerRef.current !== null) {
      window.clearTimeout(correctFlowFallbackTimerRef.current)
      correctFlowFallbackTimerRef.current = null
    }

    shouldAnimateCardAfterBurstRef.current = false
    playWordSoundThenTransition()
  }, [clearConfetti, playWordSoundThenTransition])

  useEffect(() => {
    onProgressChange?.(currentIndex + 1, items.length)
  }, [currentIndex, items.length, onProgressChange])

  useEffect(() => {
    if (isCardTransitioningRef.current) return

    scoreRecordedRef.current = false
    clearTimers()
    wordSoundProceedRef.current = null
    resetRecordingAnalysis()
    clearConfetti()
    stopWordAudio()
    shouldAnimateCardAfterBurstRef.current = false
    setIsCardExiting(false)
    setIsAnswerRevealed(false)
    setIncorrectAttemptCount(0)
    setShowIncorrectFeedback(false)
    setShowMicUnavailableDialog(false)
  }, [
    clearConfetti,
    clearTimers,
    currentIndex,
    resetRecordingAnalysis,
    stopWordAudio,
  ])

  useEffect(() => {
    return () => {
      clearTimers()
      incorrectAudioRef.current?.pause()
      incorrectAudioRef.current = null
      stopWordAudio()
    }
  }, [clearTimers, stopWordAudio])

  const handleSkip = () => {
    if (isRecordingMode) return
    recordB2Score('neutral')
    clearTimers()
    isCardTransitioningRef.current = false
    wordSoundProceedRef.current = null
    shouldAnimateCardAfterBurstRef.current = false
    setIsCardExiting(false)
    setIsAnswerRevealed(false)
    setShowIncorrectFeedback(false)
    resetRecordingAnalysisRef.current()
    advanceToNext()
  }

  const handleRecord = () => {
    if (isInteractionLocked) return
    clearTimers()
    isCardTransitioningRef.current = false
    setIsCardExiting(false)
    setShowIncorrectFeedback(false)
    startRecordingAnalysis()
  }

  const handleMicUnavailableConfirmSkip = () => {
    setShowMicUnavailableDialog(false)
    clearTimers()
    isCardTransitioningRef.current = false
    wordSoundProceedRef.current = null
    shouldAnimateCardAfterBurstRef.current = false
    setIsCardExiting(false)
    setIsAnswerRevealed(false)
    setShowIncorrectFeedback(false)
    resetRecordingAnalysisRef.current()
    onComplete?.()
  }

  if (!currentItem) return null

  const skipControl = (
    <SkipButton
      type='button'
      onClick={handleSkip}
      disabled={isRecordingMode}
      aria-label='Skip'
    >
      <TextBox fontSize={1} fontWeight={600} color='secondary'>
        Skip
      </TextBox>
      <img
        src={arrowRightIcon}
        width={SKIP_ARROW_SIZE_PX}
        height={SKIP_ARROW_SIZE_PX}
        alt=''
      />
    </SkipButton>
  )

  return (
    <>
      <MicrophoneUnavailableConfirm
        open={showMicUnavailableDialog}
        onConfirmSkip={handleMicUnavailableConfirmSkip}
        onCancel={() => setShowMicUnavailableDialog(false)}
      />
      <QuizCorrectConfettiLayer
        burstKey={confettiBurstKey}
        onBurstEnd={handleBurstEnd}
      >
        <QuizBody>
          <QuizHeader>
            <QuizComment>{t(ACTIVITY_INSTRUCTIONS.PRACTICE_B2)}</QuizComment>
            <HeaderSkipSlot>{skipControl}</HeaderSkipSlot>
          </QuizHeader>

          <CardStack>
            {Array.from({ length: backCardCount }, (_, index) => {
              const stackDepth = backCardCount - index
              const backItem = items[currentIndex + stackDepth]
              if (!backItem) return null

              return (
                <Flashcard
                  key={`back-${currentIndex + stackDepth}-${backItem.word}`}
                  $layer='back'
                  $stackDepth={stackDepth}
                  $promoting={isCardExiting && stackDepth === 1}
                  aria-hidden
                >
                  <MeaningText>{backItem.meaning}</MeaningText>
                </Flashcard>
              )
            })}
            <Flashcard
              key={currentIndex}
              $layer='front'
              $exiting={isCardExiting}
              $isIncorrect={isIncorrect}
              $showCorrectFeedback={isAnswerRevealed && isCorrect}
              aria-label={currentItem.meaning}
            >
              <CardContent>
                {isAnswerRevealed ? (
                  <>
                    <AnswerWord $matchedCorrect={isCorrect}>
                      {currentItem.word}
                    </AnswerWord>
                    <MeaningText $isSubtle>{currentItem.meaning}</MeaningText>
                  </>
                ) : (
                  <MeaningText $isIncorrect={isIncorrect}>
                    {currentItem.meaning}
                  </MeaningText>
                )}
              </CardContent>
            </Flashcard>
          </CardStack>

          <RecordButtonRow>
            <RecordButton
              type='button'
              $recording={isRecordingMode}
              disabled={isInteractionLocked}
              onClick={handleRecord}
              aria-label={t('study.record')}
              aria-pressed={isRecordingMode}
            >
              <img
                src={microphoneIcon}
                width={RECORD_BUTTON_SIZE_PX}
                height={RECORD_BUTTON_SIZE_PX}
                alt=''
              />
            </RecordButton>
          </RecordButtonRow>

          <FooterSkipSlot>{skipControl}</FooterSkipSlot>
        </QuizBody>
      </QuizCorrectConfettiLayer>
    </>
  )
}

const QuizHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

const HeaderSkipSlot = styled.div`
  display: flex;
  align-items: center;

  ${media.mobile} {
    display: none;
  }
`

const FooterSkipSlot = styled.div`
  display: none;
  justify-content: center;
  width: 100%;

  ${media.mobile} {
    display: flex;
    padding: 4px 0 8px 0;
  }
`

const SkipButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: transform 0.05s ease;

  &:active:not(:disabled) {
    transform: scale(0.96) translateY(1px);
  }

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }
`

const CardStack = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 220px;
  padding: 24px 0 32px;

  ${media.mobile} {
    min-height: 180px;
    padding: 16px 0 24px;
  }
`

const cardFlyUp = keyframes`
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-140px) scale(0.96);
    opacity: 0;
  }
`

const cardPromote = keyframes`
  0% {
    transform: translateY(${BACK_CARD_OFFSET_Y_PX}px) scale(${1 - BACK_CARD_SCALE_STEP});
    opacity: 0.72;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
`

const meaningTurnGreen = keyframes`
  0% {
    color: #3c4b62;
    transform: scale(1);
  }
  65% {
    color: #2ec88a;
    transform: scale(1.05);
  }
  100% {
    color: #1baa70;
    transform: scale(1);
  }
`

const Flashcard = styled.div<{
  $layer: 'front' | 'back'
  $stackDepth?: number
  $exiting?: boolean
  $promoting?: boolean
  $showCorrectFeedback?: boolean
  $isIncorrect?: boolean
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: calc(100% - 48px);
  max-width: 320px;
  min-height: 180px;
  padding: 32px 24px;
  background-color: #fff;
  border: 1.5px solid #e9edf3;
  border-radius: 25px;
  will-change: transform, opacity;

  ${media.mobile} {
    width: calc(100% - 24px);
    max-width: none;
    min-height: 150px;
    padding: 24px 16px;
  }

  ${({ $showCorrectFeedback }) =>
    $showCorrectFeedback
      ? css`
          background-color: #ddf2ea;
          border-color: #1baa70;
          transition:
            background-color 0.35s ease,
            border-color 0.35s ease;
        `
      : css`
          background-color: #fff;
          border-color: #e9edf3;
        `}

  ${({ $layer, $stackDepth = 1 }) =>
    $layer === 'back' &&
    css`
      position: absolute;
      z-index: ${MAX_VISIBLE_STACK_CARDS - $stackDepth};
      transform: translateY(${BACK_CARD_OFFSET_Y_PX * $stackDepth}px)
        scale(${1 - BACK_CARD_SCALE_STEP * $stackDepth});
    `}

  ${({ $layer }) =>
    $layer === 'front' &&
    css`
      position: relative;
      z-index: ${MAX_VISIBLE_STACK_CARDS};
    `}

  ${({ $exiting }) =>
    $exiting &&
    css`
      animation: ${cardFlyUp} ${CARD_TRANSITION_MS}ms
        cubic-bezier(0.22, 1, 0.36, 1) forwards;
      pointer-events: none;
    `}

  ${({ $promoting }) =>
    $promoting &&
    css`
      animation: ${cardPromote} ${CARD_TRANSITION_MS}ms
        cubic-bezier(0.22, 1, 0.36, 1) forwards;
      z-index: ${MAX_VISIBLE_STACK_CARDS + 1};
    `}
`

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
`

const MeaningText = styled.p<{
  $isIncorrect?: boolean
  $isSubtle?: boolean
}>`
  margin: 0;
  font-family: 'Rg-B', sans-serif;
  font-size: ${({ $isSubtle }) => ($isSubtle ? '18px' : '24px')};
  font-weight: ${({ $isSubtle }) => ($isSubtle ? 500 : 600)};
  line-height: 1.2;
  text-align: center;
  color: ${({ $isIncorrect, $isSubtle }) =>
    $isIncorrect ? '#ef3d2e' : $isSubtle ? '#6b7a8f' : '#3c4b62'};
  opacity: ${({ $isSubtle }) => ($isSubtle ? 0.85 : 1)};

  ${media.mobile} {
    font-size: ${({ $isSubtle }) => ($isSubtle ? '20px' : '24px')};
  }
`

const AnswerWord = styled.p<{ $matchedCorrect?: boolean }>`
  margin: 0;
  font-family: 'Rg-B', sans-serif;
  font-size: 36px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  color: #3c4b62;
  will-change: transform, color;

  ${media.mobile} {
    font-size: 32px;
  }

  ${({ $matchedCorrect }) =>
    $matchedCorrect &&
    css`
      animation: ${meaningTurnGreen} 0.5s cubic-bezier(0.22, 1, 0.36, 1)
        forwards;
    `}
`

const RecordButtonRow = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`

const recordingBorderWave = keyframes`
  0% {
    box-shadow:
      0 0 0 0 rgba(239, 61, 100, 0.38),
      0 0 0 0 rgba(239, 61, 100, 0.22);
  }
  70% {
    box-shadow:
      0 0 0 8px rgba(239, 61, 100, 0),
      0 0 0 18px rgba(239, 61, 100, 0);
  }
  100% {
    box-shadow:
      0 0 0 0 rgba(239, 61, 100, 0),
      0 0 0 0 rgba(239, 61, 100, 0);
  }
`

const RecordButton = styled.button<{ $recording?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: transform 0.05s ease;

  ${({ $recording }) =>
    $recording &&
    css`
      animation: ${recordingBorderWave} 1.35s ease-out infinite;
    `}

  &:active:not(:disabled) {
    transform: scale(0.96) translateY(1px);
  }

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }
`
