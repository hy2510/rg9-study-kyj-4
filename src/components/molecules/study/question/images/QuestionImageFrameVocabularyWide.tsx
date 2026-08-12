import { media } from '@styles/tokens/breakpoints'
import styled from 'styled-components'

import QuestionImageFrame from '@components/atoms/study/question/images/QuestionImageFrame'

/** VocabularyTest1 — 직각 이미지, 넓은 프레임 (높이는 이미지 비율에 따름) */
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
    height: auto;
    object-fit: contain;
  }

  ${media.mobile} {
    min-width: 0;
    width: 100%;
    margin-bottom: 12px;
  }
`

export default QuestionImageFrameVocabularyWide
