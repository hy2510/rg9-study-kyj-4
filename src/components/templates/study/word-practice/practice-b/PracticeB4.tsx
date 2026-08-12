/** Practice B4 — 한글 뜻을 보고 영단어 타이핑 (가상·물리 키보드) */
import { useCallback, useEffect, useRef, useState } from 'react'

import { BREAKPOINT_MOBILE_MAX, media } from '@styles/tokens/breakpoints'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import correctionIncorrectSound from '@assets/sounds/common/correction-incorrect-sound.mp3'
import QuizComment from '@components/atoms/study/comments/QuizComment'
import QuizCorrectConfettiLayer from '@components/atoms/study/feedback/QuizCorrectConfettiLayer'
import { QuizBody } from '@components/atoms/study/layout/QuizBody'
import { SpellingSlotDisplay } from '@components/organisms/study/common/SpellingInputDisplay'
import SpellingKeyboard from '@components/organisms/study/common/SpellingKeyboard'
import { ACTIVITY_INSTRUCTIONS } from '@constants/study/activityInstructions'
import { useActivityStageFooter } from '@contexts/ActivityStageFooterContext'
import { useWordPracticeScoreOptional } from '@contexts/WordPracticeScoreContext'
import { useSpellingPhysicalKeyboard } from '@hooks/study/remix/useSpellingPhysicalKeyboard'
import { useQuizContainerShake } from '@hooks/study/useQuizContainerShake'
import { useQuizCorrectCelebration } from '@hooks/study/useQuizCorrectCelebration'
import type { WordMeaningPracticeItem } from '@interfaces/study/word-practice/wordMeaningPractice'
import { getLettersOnly, isSpellingCorrect } from '@utils/spellingUtils'

const AUTO_ADVANCE_MS = 1500

type PracticeB4Props = {
  items: WordMeaningPracticeItem[]
  initialIndex?: number
  onComplete?: () => void
  onProgressChange?: (current: number, total: number) => void
}

export default function PracticeB4({
  items,
  initialIndex = 0,
  onComplete,
  onProgressChange,
}: PracticeB4Props) {
  const { t } = useTranslation()
  const wordPracticeScore = useWordPracticeScoreOptional()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [inputLetters, setInputLetters] = useState('')
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showIncorrect, setShowIncorrect] = useState(false)
  const isWorkingRef = useRef(false)
  const incorrectAudioRef = useRef<HTMLAudioElement | null>(null)
  const wordAudioRef = useRef<HTMLAudioElement | null>(null)
  const { confettiBurstKey, trigger, clearConfetti } =
    useQuizCorrectCelebration()
  const { triggerShake } = useQuizContainerShake()
  const { setFooter } = useActivityStageFooter()
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth <= BREAKPOINT_MOBILE_MAX
      : false,
  )

  const currentItem = items[currentIndex]
  const correctWord = currentItem?.word ?? ''
  const lettersOnlyLength = getLettersOnly(correctWord).length
  const isAllFilled = inputLetters.length === lettersOnlyLength

  const stopWordAudio = useCallback(() => {
    const audio = wordAudioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      wordAudioRef.current = null
    }
  }, [])

  const advanceToNext = useCallback(() => {
    if (currentIndex >= items.length - 1) {
      onComplete?.()
      return
    }
    setCurrentIndex((prev) => prev + 1)
  }, [currentIndex, items.length, onComplete])

  const playWordSoundAndAdvance = useCallback(() => {
    if (!currentItem?.sound) {
      advanceToNext()
      return
    }

    stopWordAudio()
    const audio = new Audio(currentItem.sound)
    wordAudioRef.current = audio

    const finish = () => {
      if (wordAudioRef.current === audio) {
        wordAudioRef.current = null
      }
      advanceToNext()
    }

    audio.addEventListener('ended', finish, { once: true })
    audio.addEventListener('error', finish, { once: true })
    audio.play().catch(finish)
  }, [advanceToNext, currentItem, stopWordAudio])

  const playIncorrectSound = useCallback(() => {
    incorrectAudioRef.current?.pause()
    const audio = new Audio(correctionIncorrectSound)
    incorrectAudioRef.current = audio
    audio.play().catch(() => {})
  }, [])

  const submitAnswer = useCallback(() => {
    if (!currentItem || isAnswered || isWorkingRef.current) return
    if (inputLetters.length < lettersOnlyLength) return

    isWorkingRef.current = true
    setIsAnswered(true)

    const spellingCorrect = isSpellingCorrect(inputLetters, correctWord)
    wordPracticeScore?.recordStepResult(
      currentItem.word,
      'practiceB4',
      spellingCorrect ? 'correct' : 'incorrect',
    )

    if (spellingCorrect) {
      setIsCorrect(true)
      trigger()
      return
    }

    setShowIncorrect(true)
    playIncorrectSound()
    triggerShake()
  }, [
    correctWord,
    currentItem,
    inputLetters,
    isAnswered,
    lettersOnlyLength,
    playIncorrectSound,
    trigger,
    triggerShake,
    wordPracticeScore,
  ])

  const handleKeyPress = useCallback(
    (key: string) => {
      if (!currentItem || isAnswered || isWorkingRef.current) return

      if (key === 'backspace') {
        setShowIncorrect(false)
        setInputLetters((prev) => prev.slice(0, -1))
        return
      }

      if (key === 'enter') {
        submitAnswer()
        return
      }

      if (/^[a-z]$/.test(key)) {
        setShowIncorrect(false)
        setInputLetters((prev) => (prev + key).slice(0, lettersOnlyLength))
      }
    },
    [currentItem, isAnswered, lettersOnlyLength, submitAnswer],
  )

  useSpellingPhysicalKeyboard({
    enabled: !isAnswered,
    onKeyPress: handleKeyPress,
    nonEnglishAlertMessage: t('study.spellingEnglishOnly'),
  })

  useEffect(() => {
    onProgressChange?.(currentIndex + 1, items.length)
  }, [currentIndex, items.length, onProgressChange])

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${BREAKPOINT_MOBILE_MAX}px)`,
    )

    const syncViewport = () => {
      setIsMobileViewport(mediaQuery.matches)
    }

    syncViewport()
    mediaQuery.addEventListener('change', syncViewport)

    return () => {
      mediaQuery.removeEventListener('change', syncViewport)
    }
  }, [])

  useEffect(() => {
    if (!isMobileViewport) {
      setFooter(null)
      return undefined
    }

    setFooter(
      <MobileKeyboardFooter>
        <SpellingKeyboard
          correctWord={correctWord}
          wrongKeyCount={0}
          allowFullKeyboardToggle
          showEnterButton
          isEnterEnabled={isAllFilled && !isAnswered}
          onKeyPress={handleKeyPress}
        />
      </MobileKeyboardFooter>,
    )

    return () => {
      setFooter(null)
    }
  }, [
    correctWord,
    handleKeyPress,
    isAllFilled,
    isAnswered,
    isMobileViewport,
    setFooter,
  ])

  useEffect(() => {
    setInputLetters('')
    setIsAnswered(false)
    setIsCorrect(false)
    setShowIncorrect(false)
    isWorkingRef.current = false
    clearConfetti()
    stopWordAudio()
  }, [clearConfetti, currentIndex, stopWordAudio])

  useEffect(() => {
    if (!isAnswered) return undefined

    const timer = window.setTimeout(() => {
      playWordSoundAndAdvance()
    }, AUTO_ADVANCE_MS)

    return () => window.clearTimeout(timer)
  }, [isAnswered, playWordSoundAndAdvance])

  useEffect(() => {
    return () => {
      incorrectAudioRef.current?.pause()
      incorrectAudioRef.current = null
      stopWordAudio()
    }
  }, [stopWordAudio])

  if (!currentItem) return null

  return (
    <QuizCorrectConfettiLayer
      burstKey={confettiBurstKey}
      onBurstEnd={clearConfetti}
    >
      <QuizBody>
        <QuizComment>{t(ACTIVITY_INSTRUCTIONS.PRACTICE_B4)}</QuizComment>

        <PromptPanel>
          <MeaningPrompt>{currentItem.meaning}</MeaningPrompt>
        </PromptPanel>

        <SpellingSlotDisplay
          correctWord={correctWord}
          inputLetters={inputLetters}
          isCorrect={isCorrect}
          isIncorrect={showIncorrect}
        />

        {!isMobileViewport ? (
          <InlineKeyboardArea>
            <SpellingKeyboard
              correctWord={correctWord}
              wrongKeyCount={0}
              allowFullKeyboardToggle
              showEnterButton
              isEnterEnabled={isAllFilled && !isAnswered}
              onKeyPress={handleKeyPress}
            />
          </InlineKeyboardArea>
        ) : null}
      </QuizBody>
    </QuizCorrectConfettiLayer>
  )
}

const MobileKeyboardFooter = styled.div`
  width: 100%;
`

const InlineKeyboardArea = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`

const PromptPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  padding: 40px 0 24px;

  ${media.mobile} {
    padding: 20px 0 12px;
    gap: 12px;
  }
`

const MeaningPrompt = styled.p`
  margin: 0;
  font-family: 'Rg-B', sans-serif;
  font-size: 36px;
  font-weight: 600;
  line-height: 1.2;
  color: #3c4b62;
  text-align: center;

  ${media.mobile} {
    font-size: 24px;
  }
`
