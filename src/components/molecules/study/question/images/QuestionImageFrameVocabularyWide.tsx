import { media } from '@styles/tokens/breakpoints'
import styled from 'styled-components'

import QuestionImageFrame, {
  QUESTION_IMAGE_FRAME_HEIGHT_PX,
} from '@components/atoms/study/question/images/QuestionImageFrame'

/** VocabularyTest1 — 직각 이미지, 넓은 프레임 */
const QuestionImageFrameVocabularyWide = styled(QuestionImageFrame)`
  min-width: 370px;
  min-height: 220px;
  max-width: 100%;
  margin-bottom: 16px;

  img {
    display: block;
    min-width: 0;
    max-width: 100%;
    width: auto;
    height: ${QUESTION_IMAGE_FRAME_HEIGHT_PX}px;
    object-fit: contain;
  }

  ${media.mobile} {
    min-width: 0;
    margin-bottom: 12px;

    img {
      height: auto;
      max-height: ${QUESTION_IMAGE_FRAME_HEIGHT_PX}px;
    }
  }
`

export default QuestionImageFrameVocabularyWide
