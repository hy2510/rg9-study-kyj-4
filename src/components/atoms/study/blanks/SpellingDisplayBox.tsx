import { media } from '@styles/tokens/breakpoints'
import styled from 'styled-components'

import {
  QuizSelectableFeedbackStateProps,
  resolveQuizSelectableFeedback,
} from '@components/atoms/study/feedback/QuizSelectableFeedbackFoundation'

/**
 * Atom: 스펠링 입력 영역 컨테이너 (퀴즈 카드 팔레트).
 * 정답: #DDF2EA / 오답: #EDE7EE / 기본: #fff
 */
export const SpellingDisplayBox = styled.div<QuizSelectableFeedbackStateProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  height: 80px;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 15px;
  border: ${(p) => resolveQuizSelectableFeedback(p).border};
  background: ${(p) => resolveQuizSelectableFeedback(p).bg};
  transition: all 0.2s ease;
  box-sizing: border-box;
  max-width: 100%;

  ${media.mobile} {
    gap: 2px;
    height: 64px;
    padding: 10px 8px;
    margin-bottom: 8px;
    border-radius: 12px;
  }
`
