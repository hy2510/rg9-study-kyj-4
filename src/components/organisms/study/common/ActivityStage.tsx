import { type ReactNode } from 'react'

import styled from 'styled-components'

import { useQuizContainerWidthScale } from '@hooks/study/useQuizContainerWidthScale'

type ActivityStageProps = {
  /** stage 안에 그릴 활동 콘텐츠 */
  children: ReactNode
  /**
   * Content/Body 바깥에 띄우고 싶은
   * 부수 요소(Remix 의 ActivityTypeBadge 등). Legacy 는 미전달.
   */
  extras?: ReactNode
}

/**
 * Remix / Legacy 학습 활동 공통 무대.
 *
 * - StageContent: 가로 뷰포트 1980px 초과 시 scale 최대 1.25
 * - 반투명 검정 + blur + 둥근 테두리 패널 (배경판)
 * - 내부 flex column + gap 24px (활동 안의 섹션들 사이 간격)
 *
 * 이 셸 위에 `QuizBody`/`QuizComment`/카드 섹션 등이 그려진다.
 */
export default function ActivityStage({
  children,
  extras,
}: ActivityStageProps) {
  const contentScale = useQuizContainerWidthScale()

  return (
    <StageWrapper>
      <StageContent $scale={contentScale}>
        <StageBody>{children}</StageBody>
      </StageContent>
      {extras}
    </StageWrapper>
  )
}

const StageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`

const StageContent = styled.div<{ $scale: number }>`
  transform: scale(${(p) => p.$scale});
  transform-origin: center center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 900px;
  min-height: 100px;
  background-color: rgba(255, 255, 255, 0.9);
  -webkit-backdrop-filter: blur(3px);
  backdrop-filter: blur(3px);
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 30px;
`

const StageBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`
