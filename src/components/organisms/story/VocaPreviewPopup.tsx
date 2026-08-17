import {
  type MouseEvent,
  type TouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useTranslation } from 'react-i18next'
import styled, { keyframes } from 'styled-components'

import { IconChevLeftGray } from '@components/atoms/common/icons/IconChevLeftGray'
import { IconChevRightGray } from '@components/atoms/common/icons/IconChevRightGray'
import PopupLayout from '@components/molecules/common/PopupLayout'
import VocaWordCard, {
  type VocaSlide,
} from '@components/organisms/story/VocaWordCard'
import useStoryAudioWord from '@hooks/story/useStoryAudioWord'
import useStoryBookSwipe from '@hooks/story/useStoryBookSwipe'
import type {
  IVocabulary1Practice,
  IVocabulary1Quiz,
  IVocabulary2Practice,
  IVocabulary2Quiz,
  IVocabulary3Practice,
  IVocabulary3Quiz,
  IVocabulary4Practice,
  IVocabulary4Quiz,
  IVocaQuestionBase,
  MeanLanguage,
} from '@src/interfaces/study/IVocabulary'
import { getMeaning } from '@utils/story/getVocaMeaning'

type TransitionDirection = 'prev' | 'next'

function getSlideKey(slide: VocaSlide): string {
  return `${slide.word}::${slide.sentence}::${slide.soundUrl}::${slide.sentenceSoundUrl}::${slide.imageUrl}`
}

function isBookLevelAtLeastTwo(bookLevel?: string): boolean {
  const level = Number.parseInt(bookLevel?.trim().substring(0, 1) ?? '', 10)
  return Number.isFinite(level) && level >= 2
}

function isBookLevelOne(bookLevel?: string): boolean {
  const level = Number.parseInt(bookLevel?.trim().substring(0, 1) ?? '', 10)
  return level === 1
}

function getVocaCardDisplayOptions(bookLevel?: string, bookType?: string) {
  const isLevelOne = isBookLevelOne(bookLevel)
  const isPbLevelOne = bookType === 'PB' && isLevelOne

  return {
    showMeaning: isPbLevelOne || isBookLevelAtLeastTwo(bookLevel),
    showSentence: isLevelOne && !isPbLevelOne,
    showFlipHint: !isBookLevelAtLeastTwo(bookLevel),
  }
}

function toSlide(
  word: string,
  question: IVocaQuestionBase,
  mainMeanLanguage: MeanLanguage,
  soundUrl: string,
  sentence = '',
  sentenceSoundUrl = '',
): VocaSlide {
  const imageUrl = (question as IVocaQuestionBase & { Image?: string }).Image

  return {
    word,
    sentence,
    meaning: getMeaning(question, mainMeanLanguage),
    speechPart: question.SpeechPart,
    soundUrl,
    sentenceSoundUrl,
    imageUrl: imageUrl ?? '',
  }
}

function buildVocaSlides(
  vocaData1?: IVocabulary1Practice,
  vocaData2?: IVocabulary2Practice,
  vocaData3?: IVocabulary3Practice,
  vocaData4?: IVocabulary4Practice,
): VocaSlide[] {
  if (vocaData1) {
    return vocaData1.Quiz.map((q: IVocabulary1Quiz) =>
      toSlide(
        q.Examples[0]?.Text ?? q.Question.Text,
        q.Question,
        vocaData1.MainMeanLanguage,
        q.Question.Sound,
        q.Question.Text,
        '',
      ),
    )
  }
  if (vocaData2) {
    return vocaData2.Quiz.map((q: IVocabulary2Quiz) =>
      toSlide(
        q.Examples[0]?.Text ? q.Question.Word : q.Question.Text,
        q.Question,
        vocaData2.MainMeanLanguage,
        q.Question.WordSound,
        q.Question.Text,
        q.Question.Sound,
      ),
    )
  }
  if (vocaData3) {
    return vocaData3.Quiz.map((q: IVocabulary3Quiz) =>
      toSlide(
        q.Question.Text,
        q.Question,
        vocaData3.MainMeanLanguage,
        q.Question.Sound,
      ),
    )
  }
  if (vocaData4) {
    return vocaData4.Quiz.map((q: IVocabulary4Quiz) =>
      toSlide(
        q.Examples[0]?.Text ?? q.Question.Text,
        q.Question,
        vocaData4.MainMeanLanguage,
        q.Question.Sound,
      ),
    )
  }
  return []
}

type VocaPreviewPopupProps = {
  bookLevel?: string
  bookType?: string
  onClose: () => void
  pauseBookAudio: () => void
  vocaData1?: IVocabulary1Practice
  vocaData2?: IVocabulary2Practice
  vocaData3?: IVocabulary3Practice
  vocaData4?: IVocabulary4Practice
}

export default function VocaPreviewPopup({
  bookLevel,
  bookType,
  onClose,
  pauseBookAudio,
  vocaData1,
  vocaData2,
  vocaData3,
  vocaData4,
}: VocaPreviewPopupProps) {
  const { t } = useTranslation()
  const { playAudio, stopAudio, playingPhase } = useStoryAudioWord({
    pauseBookAudio,
  })

  const pauseAllAudio = useCallback(() => {
    stopAudio()
    pauseBookAudio()
  }, [stopAudio, pauseBookAudio])
  const { showMeaning, showSentence, showFlipHint } = getVocaCardDisplayOptions(
    bookLevel,
    bookType,
  )
  const slides = useMemo(
    () => buildVocaSlides(vocaData1, vocaData2, vocaData3, vocaData4),
    [vocaData1, vocaData2, vocaData3, vocaData4],
  )
  const count = slides.length
  const [index, setIndex] = useState(0)
  const [learnedSlideKeys, setLearnedSlideKeys] = useState<Set<string>>(
    () => new Set(),
  )
  const [transitionDirection, setTransitionDirection] =
    useState<TransitionDirection>('next')
  const currentSlide = slides[index]
  const currentSlideKey = currentSlide ? getSlideKey(currentSlide) : ''

  useEffect(() => {
    setTransitionDirection('next')
    setLearnedSlideKeys(new Set())
    setIndex(0)
  }, [slides])

  const goPrev = useCallback(() => {
    if (count <= 1) return
    setTransitionDirection('prev')
    setIndex((i) => (i - 1 + count) % count)
  }, [count])

  const goNext = useCallback(() => {
    if (count <= 1) return
    setTransitionDirection('next')
    setIndex((i) => (i + 1) % count)
  }, [count])

  const swipeConsumedRef = useRef(false)
  const { onTouchStart, onTouchCancel, onTouchEnd } = useStoryBookSwipe({
    onSwipeLeft: () => {
      swipeConsumedRef.current = true
      goNext()
    },
    onSwipeRight: () => {
      swipeConsumedRef.current = true
      goPrev()
    },
  })

  const handleCardTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      swipeConsumedRef.current = false
      onTouchStart(e)
    },
    [onTouchStart],
  )

  const handleCardClickCapture = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!swipeConsumedRef.current) return
    e.preventDefault()
    e.stopPropagation()
    swipeConsumedRef.current = false
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev])

  const stopPop = (e: MouseEvent) => e.stopPropagation()

  const markCurrentSlideLearned = useCallback(() => {
    if (!currentSlideKey) return

    setLearnedSlideKeys((prev) => {
      if (prev.has(currentSlideKey)) return prev
      return new Set(prev).add(currentSlideKey)
    })
  }, [currentSlideKey])

  // 카드 최초 진입 및 카드 이동 시 현재 단어 음원 자동 재생
  useEffect(() => {
    if (!currentSlide) return
    playAudio(currentSlide.soundUrl, undefined, 'word')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 슬라이드 변경 시에만 재생 (playAudio 는 매 렌더 재생성)
  }, [currentSlideKey])

  return (
    <PopupLayout onClose={onClose}>
      <MainContainer>
        <TitleContainer>
          <Title>Word Preview</Title>
          {showFlipHint && <Description>{t('story.vocaFlipHint')}</Description>}
        </TitleContainer>

        {count === 0 ? (
          <Empty>{t('story.vocabularyListEmpty')}</Empty>
        ) : (
          <>
            <Cards>
              <Chevron
                type='button'
                aria-label={t('story.vocaPrevWord')}
                disabled={count <= 1}
                onClick={(e) => {
                  stopPop(e)
                  goPrev()
                }}
              >
                <IconChevLeftGray width={28} height={28} />
              </Chevron>

              <Viewport
                onTouchStart={handleCardTouchStart}
                onTouchCancel={onTouchCancel}
                onTouchEnd={onTouchEnd}
                onClickCapture={handleCardClickCapture}
              >
                <Stage
                  key={`${index}-${transitionDirection}`}
                  $direction={transitionDirection}
                >
                  <VocaWordCard
                    slide={currentSlide}
                    isLearned={learnedSlideKeys.has(currentSlideKey)}
                    showMeaning={showMeaning}
                    showSentence={showSentence}
                    isSentenceSoundPlaying={playingPhase === 'sentence'}
                    onPlaySound={(src, onEnded) => {
                      const sentenceUrl = currentSlide.sentenceSoundUrl.trim()
                      const resolvedSrc = src ?? currentSlide.soundUrl
                      const phase =
                        src && src === sentenceUrl ? 'sentence' : 'word'
                      playAudio(resolvedSrc, onEnded, phase)
                    }}
                    pauseBookAudio={pauseAllAudio}
                    onMarkLearned={markCurrentSlideLearned}
                  />
                </Stage>
              </Viewport>

              <Chevron
                type='button'
                aria-label={t('story.vocaNextWord')}
                disabled={count <= 1}
                onClick={(e) => {
                  stopPop(e)
                  goNext()
                }}
              >
                <IconChevRightGray width={28} height={28} />
              </Chevron>
            </Cards>

            <Dots role='tablist' aria-label={t('story.vocaDotNav')}>
              {slides.map((_, i) => (
                <Dot
                  key={i}
                  type='button'
                  role='tab'
                  aria-selected={i === index}
                  aria-label={t('story.vocaWordNth', { n: i + 1 })}
                  $active={i === index}
                  onClick={(e) => {
                    stopPop(e)
                    if (i === index) return
                    setTransitionDirection(i < index ? 'prev' : 'next')
                    setIndex(i)
                  }}
                />
              ))}
            </Dots>
          </>
        )}
      </MainContainer>
    </PopupLayout>
  )
}

const slideInFromLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`

const slideInFromRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`

const MainContainer = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
`

const Title = styled.div`
  text-align: center;
  font-size: 1.75em;
  color: #1e293b;
  font-family: 'Rg-B', 'Fredoka', sans-serif;
`

const Description = styled.div`
  text-align: center;
  font-size: 1em;
  color: #94a3b8;
`

const Empty = styled.p`
  margin: 0;
  padding: 32px 16px;
  text-align: center;
  font-size: 14px;
  color: #94a3b8;
`

const Cards = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`

const Chevron = styled.button`
  flex-shrink: 0;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 120px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #b8c0c8;
  opacity: 0.95;

  &:hover:not(:disabled) {
    color: #64748b;
  }

  &:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  img {
    display: block;
    filter: grayscale(0.2);
  }
`

const Viewport = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: pan-y;
`

const Stage = styled.div<{ $direction: TransitionDirection }>`
  width: 100%;
  max-width: 400px;
  display: flex;
  justify-content: center;
  animation: ${(p) =>
      p.$direction === 'prev' ? slideInFromLeft : slideInFromRight}
    0.22s ease;
`

const Dots = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  padding-bottom: 4px;
`

const Dot = styled.button<{ $active: boolean }>`
  width: ${(p) => (p.$active ? 10 : 8)}px;
  height: ${(p) => (p.$active ? 10 : 8)}px;
  border-radius: 50%;
  padding: 0;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  background: ${(p) => (p.$active ? '#475569' : '#d1d5db')};
  box-shadow: ${(p) =>
    p.$active ? '0 0 0 2px rgba(71, 85, 105, 0.2)' : 'none'};
  transition:
    background 0.2s ease,
    transform 0.2s ease;

  &:hover {
    background: ${(p) => (p.$active ? '#334155' : '#9ca3af')};
  }
`
