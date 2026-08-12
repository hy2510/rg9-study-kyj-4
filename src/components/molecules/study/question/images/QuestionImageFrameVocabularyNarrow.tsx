import styled from 'styled-components'

import QuestionImageFrame, {
  QUESTION_IMAGE_FRAME_HEIGHT_PX,
} from '@components/atoms/study/question/images/QuestionImageFrame'

/** VocabularyTest2 — 직각 이미지, 좁은 프레임 */
const QuestionImageFrameVocabularyNarrow = styled(QuestionImageFrame)`
  min-width: 307px;
  margin-bottom: 0;

  img {
    display: block;
    min-width: 307px;
    width: auto;
    height: ${QUESTION_IMAGE_FRAME_HEIGHT_PX}px;
  }
`

export default QuestionImageFrameVocabularyNarrow
