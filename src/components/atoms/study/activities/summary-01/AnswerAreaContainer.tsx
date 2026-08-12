import { styled } from 'styled-components'

export const AnswerAreaContainer = styled.div<{ $isCompleted?: boolean }>`
  flex: 0 1 auto;
  max-height: ${(props) => (props.$isCompleted ? 'none' : '250px')};
  display: flex;
  flex-direction: column;
`
