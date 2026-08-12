import { styled } from 'styled-components'

/** 하단 버튼 공통: SideClickArea 기준 position: absolute 하단 중앙 */
const BottomButton = styled.button`
  position: absolute;
  bottom: 10px;
  transform: translateX(-50%);
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;

  &:active {
    transform: translateX(-50%) scale(0.93);
    opacity: 0.85;
  }
`

/** 데스크톱: SideClickArea 안쪽 하단 중앙 floating 재생 버튼 */
const PlayButton = styled(BottomButton)`
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  left: 50px;
`

export default PlayButton
