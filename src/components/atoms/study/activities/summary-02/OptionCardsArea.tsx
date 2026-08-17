import { media } from '@styles/tokens/breakpoints'
import { styled } from 'styled-components'

export const OptionCardsArea = styled.div`
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  overflow-y: auto;
  padding-bottom: 4px;

  ${media.mobile} {
    flex: 1 1 0;
    align-content: start;
  }
`
