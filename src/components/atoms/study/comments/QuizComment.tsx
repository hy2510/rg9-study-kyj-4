/** 퀴즈 안내·피드백 문구용 스타일드 텍스트 */
import { media } from '@styles/tokens/breakpoints'
import styled from 'styled-components'

type QuizCommentProps = {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

export default function QuizComment({
  children,
  style,
  className,
}: QuizCommentProps) {
  return (
    <CommentText style={style} className={className}>
      {children}
    </CommentText>
  )
}

const CommentText = styled.p`
  margin: 0;
  font-family: 'Chiron GoRound TC', sans-serif;
  font-size: 18.4px;
  font-weight: 600;
  line-height: 1.4;
  color: #a2b1c4;

  ${media.mobile} {
    padding: 10px;
    font-size: 16px;
  }
`
