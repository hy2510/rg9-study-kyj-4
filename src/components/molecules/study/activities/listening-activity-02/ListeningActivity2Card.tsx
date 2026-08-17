import { useEffect, useState } from 'react'

import { media } from '@styles/tokens/breakpoints'
import { styled } from 'styled-components'

import TextBox from '@components/atoms/common/TextBox'
import {
  quizSelectablePressedStyle,
  resolveQuizSelectableFeedback,
} from '@components/atoms/study/feedback/QuizSelectableFeedbackFoundation'

export type ListeningActivity2CardProps = {
  text: string
  index: number
  selectedIndex: number | null
  isCorrectAnswer?: boolean
  isSolved?: boolean
  onCardClick: (index: number) => void
}

const ListeningActivity2CardBox = styled.div<{
  $pressed?: boolean
  $isCorrect?: boolean
  $isIncorrect?: boolean
  $showResultText?: boolean
}>`
  min-width: 250px;
  width: calc(100% / 3 - 16px);
  min-height: 168px;
  height: auto;
  cursor: pointer;
  overflow: hidden;
  border-radius: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transition: all 0.05s ease;
  background: ${(props) =>
    props.$showResultText
      ? '#E9EDF3'
      : resolveQuizSelectableFeedback(props).bg};
  border: ${(props) =>
    props.$showResultText
      ? '1.5px solid #e9edf3'
      : resolveQuizSelectableFeedback(props).border};
  box-shadow: ${(props) =>
    props.$showResultText
      ? '0 3px 0 0 #e9edf3'
      : resolveQuizSelectableFeedback(props).boxShadow};

  ${(props) => props.$pressed && quizSelectablePressedStyle}

  ${media.mobile} {
    min-width: 0;
    width: 100%;
    min-height: 140px;
    border-radius: 20px;
  }
`

const CardText = styled(TextBox)`
  ${media.mobile} {
    font-size: 1.75em;
  }
`

export function ListeningActivity2Card({
  text,
  index,
  selectedIndex,
  isCorrectAnswer = false,
  isSolved = false,
  onCardClick,
}: ListeningActivity2CardProps) {
  const [showResultText, setShowResultText] = useState(false)

  const isCorrect = selectedIndex === index && isCorrectAnswer

  useEffect(() => {
    if (!isCorrect) return
    const timer = setTimeout(() => setShowResultText(true), 1000)
    return () => {
      clearTimeout(timer)
      setShowResultText(false)
    }
  }, [isCorrect])

  return (
    <ListeningActivity2CardBox
      $pressed={isSolved || selectedIndex === index}
      $isCorrect={isSolved || (selectedIndex === index && isCorrectAnswer)}
      $isIncorrect={!isSolved && selectedIndex === index && !isCorrectAnswer}
      $showResultText={isSolved || (isCorrect && showResultText)}
      onClick={() => onCardClick(index)}
    >
      <CardText
        fontSize={2.5}
        fontWeight={6}
        color={
          isSolved || (isCorrect && showResultText) ? 'secondary' : 'primary'
        }
      >
        <span dangerouslySetInnerHTML={{ __html: text }} />
      </CardText>
    </ListeningActivity2CardBox>
  )
}
