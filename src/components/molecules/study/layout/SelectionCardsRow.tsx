import { media } from '@styles/tokens/breakpoints'
import type { ReactNode } from 'react'
import styled from 'styled-components'

type FlexDirection = 'row' | 'column'

type SelectionCardsRowProps = {
  children: ReactNode
  direction?: FlexDirection
  mobileDirection?: FlexDirection
}

export default function SelectionCardsRow({
  children,
  direction = 'row',
  mobileDirection = direction,
}: SelectionCardsRowProps) {
  return (
    <Wrap $direction={direction} $mobileDirection={mobileDirection}>
      {children}
    </Wrap>
  )
}

const Wrap = styled.div<{
  $direction: FlexDirection
  $mobileDirection: FlexDirection
}>`
  display: flex;
  flex-direction: ${(p) => p.$direction};
  gap: 12px;
  justify-content: center;
  align-items: center;

  ${media.mobile} {
    gap: 8px;
    flex-direction: ${(p) => p.$mobileDirection};
  }
`
