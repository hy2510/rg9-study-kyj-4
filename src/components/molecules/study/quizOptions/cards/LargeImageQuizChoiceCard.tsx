import { useState } from 'react'

import { styled } from 'styled-components'

import { CardImageSkeleton } from '@components/atoms/study/cards/CardImageSkeleton'
import { QuizSelectableFeedbackBox } from '@components/atoms/study/feedback/QuizSelectableFeedbackFoundation'
import QuizOptionImageFrameLargeChoice from '@components/molecules/study/quizOptions/images/QuizOptionImageFrameLargeChoice'

export type LargeImageQuizChoiceCardProps = {
  index: number
  image: string
  text: string
  selectedText: string | null
  isCorrect: boolean
  isIncorrect: boolean
  onCardClick: (index: number) => void
}

const LargeImageQuizChoiceCardBox = styled(QuizSelectableFeedbackBox)`
  min-width: 380px;
  width: 100%;
  min-height: 380px;
  height: auto;
  cursor: pointer;
  overflow: hidden;
  background: #fff;
  border-radius: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transition: all 0.05s ease;
`

export function LargeImageQuizChoiceCard({
  index,
  image,
  text,
  selectedText,
  isCorrect,
  isIncorrect,
  onCardClick,
}: LargeImageQuizChoiceCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <LargeImageQuizChoiceCardBox
      $pressed={selectedText === text}
      $isCorrect={isCorrect}
      $isIncorrect={isIncorrect}
      onClick={() => onCardClick(index)}
    >
      <QuizOptionImageFrameLargeChoice>
        {!imageLoaded && <CardImageSkeleton />}
        <img
          src={image}
          alt=''
          onLoad={() => setImageLoaded(true)}
          style={{ opacity: imageLoaded ? 1 : 0 }}
        />
      </QuizOptionImageFrameLargeChoice>
    </LargeImageQuizChoiceCardBox>
  )
}
