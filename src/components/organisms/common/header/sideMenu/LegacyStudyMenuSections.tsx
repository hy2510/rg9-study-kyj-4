import { useEffect, useState } from 'react'

import styled from 'styled-components'

import Divider from '@components/atoms/common/Divider'
import { IconChevronDown } from '@components/atoms/common/icons/IconChevronDown'
import { IconChevronUp } from '@components/atoms/common/icons/IconChevronUp'
import Stack from '@components/atoms/common/Stack'
import type { HeaderLegacyStudyProps } from '@interfaces/common/header/HeaderLegacyStudyProps'
import type { LegacyStepProgress } from '@interfaces/common/header/LegacyStepProgress'

import StudyBottomNavSection from './StudyBottomNavSection'

type LegacyStudyMenuSectionsProps = {
  studyProps: HeaderLegacyStudyProps
  onNavigateStoryStudy: () => void
  onExitStudy: () => void
  closeMenu: () => void
}

/**
 * Legacy 학습 엔진 사이드바.
 * - openSteps 갯수만큼 "Activity {stepId}" 카드를 렌더링
 * - 카드 안에는 Q1~Q{quizCount} 행을 그리고, 각 행은 시도 횟수(quizAnswerCount)
 *   만큼의 칸으로 나누어 시도별 'O' / 'X' / 공백 을 표시
 *   (예: 기회 3번에서 두번째에 정답이면 → X O 공백)
 * - 공통 하단 내비게이션 (다시 읽기 / 나가기)
 *
 * Remix 전용 액션(Act1 건너뛰기, 획득 증강 가방)은 노출하지 않는다.
 */
export default function LegacyStudyMenuSections({
  studyProps,
  onNavigateStoryStudy,
  onExitStudy,
  closeMenu,
}: LegacyStudyMenuSectionsProps) {
  const handleOpenVocaCards = () => {
    studyProps.onOpenVocaCards?.()
    closeMenu()
  }

  return (
    <Stack gap={18}>
      <LegacyStudyProgressSection studyProps={studyProps} />
      <Divider />
      <StudyBottomNavSection
        isBookTypePB={studyProps.isBookTypePB}
        onNavigateStoryStudy={onNavigateStoryStudy}
        onExitStudy={onExitStudy}
        showVocaCardsMenu={studyProps.showVocaCardsMenu}
        onOpenVocaCards={handleOpenVocaCards}
      />
    </Stack>
  )
}

type LegacyStudyProgressSectionProps = {
  studyProps: HeaderLegacyStudyProps
}

/**
 * 진행 카드 묶음.
 * - 카드 한 개 = openSteps 의 한 step
 * - 한 번에 하나의 카드만 펼침 (Remix `RemixStudyMenuSections` 와 동일 인터랙션)
 * - 기본 펼침 인덱스는 현재 step 의 카드
 */
function LegacyStudyProgressSection({
  studyProps,
}: LegacyStudyProgressSectionProps) {
  const { openSteps, currentStepId, stepProgressMap } = studyProps

  const initialOpenIdx = Math.max(
    0,
    openSteps.findIndex((stepId) => stepId === currentStepId),
  )
  const [openCardIndex, setOpenCardIndex] = useState<number>(initialOpenIdx)

  /** currentStepId 변경 시 그 step 으로 펼침 카드 동기화 */
  useEffect(() => {
    const idx = openSteps.findIndex((stepId) => stepId === currentStepId)
    if (idx >= 0) setOpenCardIndex(idx)
  }, [currentStepId, openSteps])

  const toggleCard = (idx: number) => {
    setOpenCardIndex((prev) => (prev === idx ? -1 : idx))
  }

  return (
    <Stack gap={12}>
      {openSteps.map((stepId, cardIndex) => {
        const isOpen = openCardIndex === cardIndex
        const progress = stepProgressMap[stepId]

        return (
          <StudyCard key={stepId}>
            <StudyHead
              type='button'
              onClick={() => toggleCard(cardIndex)}
              aria-expanded={isOpen}
            >
              Step {stepId}
              {isOpen ? (
                <IconChevronUp width={16} height={16} alt='' />
              ) : (
                <IconChevronDown width={16} height={16} alt='' />
              )}
            </StudyHead>
            {isOpen && <StudyBody progress={progress} />}
          </StudyCard>
        )
      })}
    </Stack>
  )
}

type StudyBodyProps = {
  progress: LegacyStepProgress | undefined
}

/**
 * 한 step 의 시도별 정·오답 표시.
 *
 * - progress 없음 / quizCount === 0 (prefetch 미완료, Quiz 배열 없는 활동):
 *   placeholder 한 줄
 * - 그 외: Q1 ~ Q{quizCount} 행을 그리고, 각 행은 시도 횟수(quizAnswerCount)
 *   만큼의 칸으로 구성. 각 칸에는 attempts[quizIdx][attemptIdx] 의
 *   'O' / 'X' / '' 를 그대로 표시한다.
 */
function StudyBody({ progress }: StudyBodyProps) {
  const quizCount = progress?.quizCount ?? 0
  const quizAnswerCount = progress?.quizAnswerCount ?? 0
  const attempts = progress?.attempts ?? []

  if (quizCount <= 0 || quizAnswerCount <= 0) {
    return (
      <StudyTable $attemptCount={1}>
        <tbody>
          <tr>
            <td>-</td>
            <td>-</td>
          </tr>
        </tbody>
      </StudyTable>
    )
  }

  return (
    <StudyTable $attemptCount={quizAnswerCount}>
      <tbody>
        {Array.from({ length: quizCount }).map((_, qi) => {
          const row = attempts[qi] ?? []
          return (
            <tr key={qi}>
              <td>Q{qi + 1}</td>
              {Array.from({ length: quizAnswerCount }).map((_, ai) => (
                <td key={ai}>{row[ai] ?? ''}</td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </StudyTable>
  )
}

const StudyCard = styled.div`
  border: 1px solid #e9edf3;
  border-radius: 14px;
  overflow: hidden;
`

const StudyHead = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  border: none;
  background: rgba(233, 237, 243, 0.5);
  padding: 12px 14px;
  font-family: 'Rg-B', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
`

const StudyTable = styled.table<{ $attemptCount: number }>`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;

  tbody {
    tr {
      display: grid;
      grid-template-columns: ${({ $attemptCount }) =>
        `60px ${'1fr '.repeat($attemptCount).trim()}`};

      td {
        font-family: 'Rg-B', sans-serif;
        font-size: 0.9em;
        text-align: center;
        padding: 8px 10px;
        border-top: 1px solid #e9edf3;
        min-height: 1em;

        &:first-child {
          color: #a2b1c4;
        }
      }
    }
  }
`
