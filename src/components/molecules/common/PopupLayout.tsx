import { media } from '@styles/tokens/breakpoints'
import styled from 'styled-components'

import { IconDeleteGray } from '@components/atoms/common/icons/IconDeleteGray'

type PopupLayoutProps = {
  onClose: () => void
  children: React.ReactNode
  backdropColor?: 'on' | 'off'
  /**
   * 우상단 닫기(✕) 버튼 숨김 여부.
   * - 결과 팝업처럼 "닫기" 가 곧 진행과 동일해서 모호한 화면에서 false 대신 true 사용.
   * - 기본값 false (기존 사용처 호환).
   */
  hideCloseButton?: boolean
}

export default function PopupLayout({
  onClose,
  children,
  backdropColor = 'on',
  hideCloseButton = false,
}: PopupLayoutProps) {
  return (
    <Backdrop backdropColor={backdropColor}>
      <PopupContainer onClick={(e) => e.stopPropagation()}>
        <PopupBody>
          {children}
          {!hideCloseButton && (
            <CloseButton type='button' onClick={onClose} aria-label='Close'>
              <IconDeleteGray alt='' width={30} height={30} />
            </CloseButton>
          )}
        </PopupBody>
      </PopupContainer>
    </Backdrop>
  )
}

const Backdrop = styled.div<{ backdropColor: 'on' | 'off' }>`
  position: fixed;
  inset: 0;
  z-index: 999;
  background-color: ${({ backdropColor }) =>
    backdropColor === 'on' ? 'rgb(0, 0, 0, 0.25)' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateZ(0);
  isolation: isolate;
`

const PopupContainer = styled.div`
  background-color: #fff;
  width: min(700px, calc(100vw - 32px));
  height: min(500px, calc(100vh - 32px));
  border-radius: 40px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: visible;
  padding: 20px;

  ${media.mobile} {
    width: calc(100vw - 16px);
    height: min(560px, calc(100dvh - 16px));
    border-radius: 24px;
    padding: 12px;
  }
`

const PopupBody = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: visible;
  border: 1px solid #e9edf3;
  border-radius: 30px;
  padding: 20px;
  position: relative;

  ${media.mobile} {
    border-radius: 18px;
    padding: 14px;
  }
`

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 1000;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
`
