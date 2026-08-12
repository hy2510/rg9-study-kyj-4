import { media } from '@styles/tokens/breakpoints'
import styled from 'styled-components'

import { IconClockBasic } from '@components/atoms/common/icons/IconClockBasic'
import { IconHeartBasic } from '@components/atoms/common/icons/IconHeartBasic'
import TextBox from '@components/atoms/common/TextBox'

export type QuizStatusPillProps = {
  showStudyStatus: boolean
  isReviewMode: boolean
  reviewCurrent?: number
  reviewTotal?: number
  timeText: string
  currentHeart: number
  showProgressText: boolean
  progress: number
  total: number
  statusLabel?: string
}

export default function QuizStatusPill({
  showStudyStatus,
  isReviewMode,
  reviewCurrent,
  reviewTotal,
  timeText,
  currentHeart,
  showProgressText,
  progress,
  total,
  statusLabel,
}: QuizStatusPillProps) {
  if (!showStudyStatus && !showProgressText) return null

  return (
    <PillRoot>
      {showStudyStatus &&
        (statusLabel ? (
          <TextBox fontSize={1} fontWeight={6} color='primary'>
            {statusLabel}
          </TextBox>
        ) : isReviewMode && reviewCurrent != null && reviewTotal != null ? (
          <TextBox fontSize={1} fontWeight={6} color='primary'>
            Review {reviewCurrent}/{reviewTotal}
          </TextBox>
        ) : (
          <>
            <div className='time'>
              <IconClockBasic width={24} height={24} alt='' aria-hidden />
              <TextBox fontSize={1} fontWeight={6} color='primary'>
                {timeText}
              </TextBox>
            </div>
            <div className='heart'>
              <IconHeartBasic width={24} height={24} alt='' aria-hidden />
              <TextBox fontSize={1} fontWeight={6} color='primary'>
                {currentHeart}
              </TextBox>
            </div>
          </>
        ))}
      {showProgressText && (
        <TextBox
          fontSize={0.9}
          fontWeight={6}
          color='primary'
          style={{ opacity: 0.5 }}
        >
          {progress} / {total}
        </TextBox>
      )}
    </PillRoot>
  )
}

const PillRoot = styled.div`
  position: fixed;
  top: calc(15px + env(safe-area-inset-top, 0px));
  left: calc(15px + env(safe-area-inset-left, 0px));
  z-index: 100;
  min-width: 40px;
  width: auto;
  height: 37px;
  background: rgb(255, 255, 255, 0.5);
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 12px;
  padding-top: 3px;

  ${media.mobile} {
    top: calc(10px + env(safe-area-inset-top, 0px));
    left: calc(10px + env(safe-area-inset-left, 0px));
    height: 34px;
    padding: 0 10px;
  }

  .time,
  .heart {
    display: flex;
    align-items: center;
    gap: 6px;

    img {
      display: block;
      width: 24px;
      height: 24px;
      margin-bottom: 3px;
    }
  }
`
