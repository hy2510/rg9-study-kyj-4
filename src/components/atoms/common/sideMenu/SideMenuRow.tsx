import { type ComponentPropsWithoutRef, forwardRef } from 'react'

import styled from 'styled-components'

type SideMenuRowProps = ComponentPropsWithoutRef<'button'>

/**
 * 사이드 메뉴 전용 row 버튼.
 * - width 100% / space-between 레이아웃
 * - Chiron GoRound TC 폰트 톤
 */
const SideMenuRow = forwardRef<HTMLButtonElement, SideMenuRowProps>(
  function SideMenuRow({ type = 'button', ...rest }, ref) {
    return <SideMenuRowStyled type={type} ref={ref} {...rest} />
  },
)

export default SideMenuRow

const SideMenuRowStyled = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: none;
  border-radius: 12px;
  background: transparent;
  font-family: 'Chiron GoRound TC', sans-serif;
  font-size: 0.95em;
  font-weight: 600;
  cursor: pointer;
  text-align: left;

  img {
    filter: brightness(0) saturate(100%) invert(73%) sepia(8%) saturate(431%)
      hue-rotate(176deg) brightness(94%) contrast(85%);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
`
