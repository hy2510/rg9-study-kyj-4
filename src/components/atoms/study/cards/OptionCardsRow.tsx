import { media } from '@styles/tokens/breakpoints'
import styled from 'styled-components'

export const OptionCardsRow = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;

  ${media.mobile} {
    gap: 8px;
  }
`
