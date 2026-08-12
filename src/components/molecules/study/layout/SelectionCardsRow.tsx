import type { ReactNode } from 'react'
import styled from 'styled-components'

type SelectionCardsRowProps = {
  children: ReactNode
}

export default function SelectionCardsRow({
  children,
}: SelectionCardsRowProps) {
  return <Wrap>{children}</Wrap>
}

const Wrap = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
`
