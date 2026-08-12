import styled from 'styled-components'

import QuizOptionImageFrame from '@components/atoms/study/quizOptions/images/QuizOptionImageFrame'

const QUIZ_OPTION_LARGE_CHOICE_IMAGE_HEIGHT_PX = 360
const QUIZ_OPTION_LARGE_CHOICE_IMAGE_RADIUS_PX = 44

/** ListeningActivity3, ReadingComprehension1 — LargeImageQuizChoiceCard 이미지 영역 */
const QuizOptionImageFrameLargeChoice = styled(QuizOptionImageFrame)`
  min-height: 380px;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    display: block;
    width: auto;
    height: ${QUIZ_OPTION_LARGE_CHOICE_IMAGE_HEIGHT_PX}px;
    background-color: #fff;
    border-radius: ${QUIZ_OPTION_LARGE_CHOICE_IMAGE_RADIUS_PX}px;
    transition: opacity 0.3s ease;
  }
`

export default QuizOptionImageFrameLargeChoice
