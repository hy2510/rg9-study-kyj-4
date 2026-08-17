import { useEffect, useMemo } from 'react'

import { media } from '@styles/tokens/breakpoints'
import styled from 'styled-components'

import TextBox from '@components/atoms/common/TextBox'
import { resolveQuizSelectableFeedback } from '@components/atoms/study/feedback/QuizSelectableFeedbackFoundation'
import { IntroStartButton } from '@components/molecules/common/intro/IntroLayout'
import PopupLayout from '@components/molecules/common/PopupLayout'
import type { LegacyQuizMark } from '@interfaces/common/header/LegacyQuizMark'
import type { LegacyStepProgress } from '@interfaces/common/header/LegacyStepProgress'
import {
  computeStepScore,
  countCorrectRows,
} from '@src/utils/study/legacy/computeStepScore'
import { getQuizCorrectionCharacterMarks } from '@utils/Assets'
import { formatActivityLabel } from '@utils/study/formatActivityLabel'

/**
 * 사내 정책 — 한 문제당 시도 가능 횟수는 최대 3번.
 * 실제 표 컬럼 수는 활동의 `stepProgress.quizAnswerCount` 에 맞춰 1 ~ 3 으로 조정된다.
 */
const ATTEMPT_COLUMNS_HARD_CAP = 3
const ATTEMPT_COLUMN_LABELS = ['1st', '2nd', '3rd'] as const

/** 이 점수 미만이면 캐릭터 미노출 + Average 텍스트 빨간색 */
const AVERAGE_PASS_SCORE = 70

type ActivityResultPopupProps = {
  /** 결과를 보여줄 step (= 방금 완료한 step) */
  stepId: number
  /** `studyInfo.mappedStepActivity[stepId - 1]` — 헤더 라벨용 활동 코드 */
  activity: string
  /** 컨테이너의 `stepProgressMap[stepId]` (`buildStepProgressMap` 산출물) */
  stepProgress: LegacyStepProgress | undefined
  /** 마지막 step 이면 "Finish", 아니면 "Next" 라벨 */
  isLastStep: boolean
  /** 사용자가 "Next" / "Finish" 클릭 시 — 컨테이너의 단일 진행 콜백 */
  onProceed: () => void
  /**
   * 진행 버튼 라벨 오버라이드 (예: 재시험 "Re Test").
   * 지정 시 `isLastStep` 기반 기본 라벨("Next"/"Finish") 대신 사용된다.
   */
  proceedLabel?: string
  /** 점수 영역 아래에 표시할 안내 문구 (예: 재시험 안내). */
  notice?: string
  /** 현재 설정된 리딩유닛(캐릭터) 이름 — 헤더에 표시 */
  character?: string
  /**
   * 오답 리뷰 항목 (예: RC4 통과 시 틀린 문제의 학생 답/정답).
   * 지정되고 항목이 있으면 Body 의 시도 표 대신 오답 리뷰를 노출한다.
   */
  reviewItems?: ActivityResultReviewItem[]
}

export type ActivityResultReviewItem = {
  /** 문제 순번 (표시용) */
  questionNo: number
  /** 문제 텍스트 (HTML 가능) */
  questionText: string
  /** 학생이 선택한 답 (HTML 가능) */
  studentAnswer: string
  /** 정답 (HTML 가능) */
  correctAnswer: string
}

/**
 * 활동 종료 시 컨테이너 게이트가 띄우는 결과 팝업.
 */
export default function ActivityResultPopup({
  stepId,
  activity,
  stepProgress,
  isLastStep,
  onProceed,
  proceedLabel: proceedLabelOverride,
  notice,
  character,
  reviewItems,
}: ActivityResultPopupProps) {
  const attempts = stepProgress?.attempts ?? []
  const score = useMemo(() => computeStepScore(attempts), [attempts])
  const correctRows = useMemo(() => countCorrectRows(attempts), [attempts])
  const totalRows = attempts.length

  /**
   * 표 컬럼 수 — 활동의 `quizAnswerCount` 에 맞춰 1 ~ 3 으로 동적 조정.
   * - 사내 정책상 4 이상은 표시하지 않는다 (hard cap 3).
   * - `quizAnswerCount` 가 비어 있거나 0 이면 표는 placeholder 로 빠지므로
   *   여기서는 안전한 최소값(1) 으로만 보장한다.
   */
  const attemptColumns = Math.min(
    Math.max(stepProgress?.quizAnswerCount ?? 0, 1),
    ATTEMPT_COLUMNS_HARD_CAP,
  )

  const proceedLabel = proceedLabelOverride ?? (isLastStep ? 'Finish' : 'Next')

  const hasReviewItems = Boolean(reviewItems && reviewItems.length > 0)

  const isAverageBelowPass = score < AVERAGE_PASS_SCORE
  const characterMarks = character
    ? getQuizCorrectionCharacterMarks(character)
    : null
  const characterImage = characterMarks
    ? isAverageBelowPass
      ? characterMarks.incorrect
      : characterMarks.correct
    : ''

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat) return
      e.preventDefault()
      onProceed()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onProceed])

  return (
    <PopupLayout onClose={onProceed} hideCloseButton fitContent>
      <Container>
        <Header>
          <TextBox fontSize={0.9} fontWeight={5} color='secondary'>
            {`Step ${stepId} · ${formatActivityLabel(activity)}`}
          </TextBox>
          <TextBox fontSize={1.6} fontWeight={7} color='primary'>
            Your Score
          </TextBox>

          {characterImage ? (
            <CharacterFigure>
              <img src={characterImage} alt='' draggable={false} />
            </CharacterFigure>
          ) : null}

          {notice ? <NoticeText>{notice}</NoticeText> : null}

          <SummaryRow $isBelowPass={isAverageBelowPass}>
            <SummaryItem>
              <SummaryLabel $isBelowPass={isAverageBelowPass}>
                Average
              </SummaryLabel>
              <SummaryValue $isBelowPass={isAverageBelowPass}>
                {`${score}`}
              </SummaryValue>
            </SummaryItem>
            <SummaryDivider $isBelowPass={isAverageBelowPass} aria-hidden />
            <SummaryItem>
              <SummaryLabel $isBelowPass={isAverageBelowPass}>
                Correct
              </SummaryLabel>
              <SummaryValue $isBelowPass={isAverageBelowPass}>
                {`${correctRows} / ${totalRows}`}
              </SummaryValue>
            </SummaryItem>
          </SummaryRow>
        </Header>

        <Body>
          {hasReviewItems ? (
            <ReviewScroll>
              {reviewItems!.map((item, i) => (
                <ReviewCard key={i}>
                  <ReviewQno>{`Q${item.questionNo}`}</ReviewQno>
                  <ReviewQuestion
                    dangerouslySetInnerHTML={{ __html: item.questionText }}
                  />
                  <ReviewLine>
                    <ReviewLabel>My Answer</ReviewLabel>
                    <ReviewWrong
                      dangerouslySetInnerHTML={{ __html: item.studentAnswer }}
                    />
                  </ReviewLine>
                  <ReviewLine>
                    <ReviewLabel>Answer</ReviewLabel>
                    <ReviewCorrect
                      dangerouslySetInnerHTML={{ __html: item.correctAnswer }}
                    />
                  </ReviewLine>
                </ReviewCard>
              ))}
            </ReviewScroll>
          ) : totalRows === 0 ? (
            <EmptyState>
              <TextBox fontSize={1} color='secondary'>
                No records.
              </TextBox>
            </EmptyState>
          ) : (
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <Th $width={72}>#</Th>
                    {Array.from({ length: attemptColumns }).map((_, i) => (
                      <Th key={i}>{ATTEMPT_COLUMN_LABELS[i]}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <TdIndex>{`Q ${rowIdx + 1}`}</TdIndex>
                      {Array.from({ length: attemptColumns }).map(
                        (_, colIdx) => (
                          <TdCell key={colIdx}>
                            <Mark mark={row[colIdx] ?? ''} />
                          </TdCell>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
          )}
        </Body>

        <Footer>
          <ProceedButton type='button' onClick={onProceed}>
            {proceedLabel}
          </ProceedButton>
        </Footer>
      </Container>
    </PopupLayout>
  )
}

/**
 * 표 셀 마크 — 'O' / 'X' / '-' (빈 시도).
 */
function Mark({ mark }: { mark: LegacyQuizMark }) {
  if (mark === 'O') return <MarkBadge $variant='correct'>O</MarkBadge>
  if (mark === 'X') return <MarkBadge $variant='incorrect'>X</MarkBadge>
  return <MarkDash aria-hidden>-</MarkDash>
}

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 16px;
  padding: 4px 8px 0;

  ${media.mobile} {
    flex: 0 1 auto;
  }
`

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const CharacterFigure = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 4px;
  position: absolute;
  top: -82px;
  right: -12px;

  img {
    display: block;
    width: auto;
    height: 180px;
    object-fit: contain;
  }

  ${media.mobile} {
    top: -8px;
    right: 8px;

    img {
      height: 90px;
    }
  }
`

const NoticeText = styled.p`
  margin: 0;
  font-family: 'Rg-B', sans-serif;
  font-size: 0.85em;
  font-weight: 600;
  color: #3c4b62;
`

const SummaryRow = styled.div<{ $isBelowPass: boolean }>`
  margin-top: 6px;
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 20px;
  border: ${({ $isBelowPass }) =>
    resolveQuizSelectableFeedback({
      $isCorrect: !$isBelowPass,
      $isIncorrect: $isBelowPass,
    }).border};
  background-color: ${({ $isBelowPass }) =>
    resolveQuizSelectableFeedback({
      $isCorrect: !$isBelowPass,
      $isIncorrect: $isBelowPass,
    }).bg};
`

const SummaryItem = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`

const SummaryLabel = styled.div<{ $isBelowPass: boolean }>`
  font-family: 'Rg-B', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: ${({ $isBelowPass }) => ($isBelowPass ? '#ef3d2e' : '#158b5c')};
  opacity: 0.55;
`

const SummaryValue = styled.div<{ $isBelowPass: boolean }>`
  font-family: 'Rg-B', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: ${({ $isBelowPass }) => ($isBelowPass ? '#ef3d2e' : '#158b5c')};
`

const SummaryDivider = styled.div<{ $isBelowPass: boolean }>`
  width: 1.5px;
  background-color: ${({ $isBelowPass }) =>
    $isBelowPass ? 'rgba(239, 61, 46, 0.25)' : 'rgba(27, 170, 112, 0.25)'};
`

const Body = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  ${media.mobile} {
    flex: 0 1 auto;
  }
`

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ReviewScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const ReviewCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border: 1.5px solid #e9edf3;
  border-radius: 20px;
  background-color: rgb(250, 251, 253);
`

const ReviewQno = styled.div`
  font-family: 'Rg-B', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: #a2b1c4;
`

const ReviewQuestion = styled.div`
  font-family: 'Rg-B', sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: #3c4b62;
`

const ReviewLine = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: 'Rg-B', sans-serif;
  font-size: 1rem;
`

const ReviewLabel = styled.span`
  flex-shrink: 0;
  width: 84px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #a2b1c4;
`

const ReviewWrong = styled.span`
  font-weight: 700;
  color: #ef3d64;
`

const ReviewCorrect = styled.span`
  font-weight: 700;
  color: #20ad75;
`

const TableScroll = styled.div`
  flex: 0 1 auto;
  min-height: 0;
  height: fit-content;
  overflow-y: auto;
  border: 1.5px solid #e9edf3;
  border-radius: 20px;
`

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Rg-B', sans-serif;

  thead th {
    position: sticky;
    top: 0;
    background-color: #fafbfd;
    z-index: 1;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`

const Th = styled.th<{ $width?: number }>`
  font-size: 0.85rem;
  font-weight: 600;
  color: #a2b1c4;
  padding: 10px 8px;
  border-bottom: 1.5px solid #e9edf3;
  text-align: center;
  ${(p) => (p.$width ? `width: ${p.$width}px;` : '')}
`

const TdIndex = styled.td`
  padding: 10px 8px;
  text-align: center;
  white-space: nowrap;
  font-size: 0.95rem;
  font-weight: 600;
  color: #3c4b62;
  border-bottom: 1.5px solid #e9edf3;
`

const TdCell = styled.td`
  padding: 8px;
  text-align: center;
  border-bottom: 1.5px solid #e9edf3;
`

const MarkBadge = styled.span<{ $variant: 'correct' | 'incorrect' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${(p) => (p.$variant === 'correct' ? '#20ad75' : '#ef3d64')};
  /* background-color: ${(p) =>
    p.$variant === 'correct' ? '#20ad75' : '#ef3d64'}; */
`

const MarkDash = styled.span`
  display: inline-block;
  color: #c8d2df;
  font-size: 1rem;
  font-weight: 600;
`

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;

  ${media.mobile} {
    padding-top: 0;
    padding-bottom: 4px;
  }
`

const ProceedButton = styled(IntroStartButton)`
  max-width: none;
  margin-top: 0;
  margin-bottom: 8px;
  height: 50px;
  font-size: 1.1em;
  font-weight: 700;
  border-color: #ff374b;
  background-color: #ff374b;
  box-shadow: 0 3px 0 0 #ce0000;

  ${media.mobile} {
    margin-bottom: 6px;
  }
`
