import styled from 'styled-components'

import QuestionImageFrame, {
  QUESTION_IMAGE_FRAME_HEIGHT_PX,
} from '@components/atoms/study/question/images/QuestionImageFrame'

const QUESTION_IMAGE_INNER_IMAGE_BORDER_RADIUS_PX = 33

/** ListeningActivity4, ReadingComprehension2·3 — 둥근 이미지 */
const QuestionImageFrameRounded = styled(QuestionImageFrame)`
  min-width: 370px;
  margin-bottom: 16px;

  img {
    display: block;
    width: auto;
    height: ${QUESTION_IMAGE_FRAME_HEIGHT_PX}px;
    border-radius: ${QUESTION_IMAGE_INNER_IMAGE_BORDER_RADIUS_PX}px;
  }
`

export default QuestionImageFrameRounded
