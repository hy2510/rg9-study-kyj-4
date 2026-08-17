import { createContext, useContext, useMemo, type ReactNode } from 'react'

import type { HeaderProps } from '@interfaces/common/header/HeaderProps'
import type { HeaderStudyProps } from '@interfaces/common/header/HeaderStudyProps'

export type StudyStatusValue = {
  show: boolean
  timeText: string
  currentHeart: number
  statusLabel?: string
  isReviewMode: boolean
  reviewCurrent?: number
  reviewTotal?: number
}

const StudyStatusContext = createContext<StudyStatusValue | null>(null)

function studyStatusFromHeader(headerProps: HeaderProps): StudyStatusValue {
  if (headerProps.variant !== 'study') {
    return {
      show: false,
      timeText: '',
      currentHeart: 0,
      isReviewMode: false,
    }
  }

  const studyProps = headerProps as HeaderStudyProps
  const remix = studyProps.engine === 'remix' ? studyProps : null

  return {
    show: !!studyProps.shouldShowCenterInfo,
    timeText: studyProps.formatTime(
      studyProps.time.timeMin,
      studyProps.time.timeSec,
    ),
    currentHeart: studyProps.currentHeart,
    statusLabel: studyProps.statusLabel,
    isReviewMode: remix?.quizInfo.mode === 'Review',
    reviewCurrent: remix?.reviewCurrent,
    reviewTotal: remix?.reviewTotal,
  }
}

export function StudyStatusProvider({
  headerProps,
  children,
}: {
  headerProps: HeaderProps
  children: ReactNode
}) {
  const value = useMemo(
    () => studyStatusFromHeader(headerProps),
    [headerProps],
  )
  return (
    <StudyStatusContext.Provider value={value}>
      {children}
    </StudyStatusContext.Provider>
  )
}

export function useStudyStatus() {
  return useContext(StudyStatusContext)
}
