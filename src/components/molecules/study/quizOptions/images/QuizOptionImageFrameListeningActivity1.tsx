import styled from 'styled-components'

import QuizOptionImageFrame from '@components/atoms/study/quizOptions/images/QuizOptionImageFrame'

/** ListeningActivity1 보기 카드 이미지 영역 */
const QuizOptionImageFrameListeningActivity1 = styled(QuizOptionImageFrame)`
  min-height: 168px;

  img {
    width: 100%;
    height: auto;
    display: block;
    transition: opacity 0.3s ease;
  }
`

export default QuizOptionImageFrameListeningActivity1
