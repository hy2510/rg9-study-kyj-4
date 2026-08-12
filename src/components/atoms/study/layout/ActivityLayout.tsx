import { styled } from 'styled-components'

/** 좌측 상단 오버레이 버튼 컨테이너 (사운드 버튼 등) */
export const SoundPlayButtonWrap = styled.div`
  position: absolute;
  top: -20px;
  left: -20px;
  z-index: 2;
`

/** 우측 상단 오버레이 버튼 컨테이너 (다음 단계 이동 버튼 등) */
export const AugmentNextButtonWrap = styled.div`
  position: absolute;
  top: -20px;
  right: -20px;
  z-index: 2;
`

/** 60px 원형 투명 버튼 — 사운드 토글 / 다음 단계 이동 공통 사용 */
export const ActivityRoundButton = styled.button`
  cursor: pointer;
  width: 60px;
  height: 60px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.05s ease;

  &:active {
    transform: scale(0.98) translateY(1px);
  }
`

/** 퀴즈 본문 flex 컨테이너 */
export const MainContentBox = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 0;
`
