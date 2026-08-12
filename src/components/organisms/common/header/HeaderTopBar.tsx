import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { IconMenu } from '@components/atoms/common/icons/IconMenu'
import HeaderMenuButton from '@components/atoms/common/sideMenu/HeaderMenuButton'
import QuizStatusPill, {
  type QuizStatusPillProps,
} from '@components/molecules/common/header/QuizStatusPill'
import StoryQuizSegmentToggle from '@components/molecules/common/header/StoryQuizSegmentToggle'
import type { HeaderVariant } from '@interfaces/common/header/HeaderVariant'

type SegmentToggleProps = {
  show: boolean
  onSelect: (target: 'story' | 'quiz') => void
}

type HeaderTopBarProps = {
  variant: HeaderVariant
  onToggleMenu: () => void
  quizStatus: QuizStatusPillProps
  segmentToggle: SegmentToggleProps
}

export default function HeaderTopBar({
  variant,
  onToggleMenu,
  quizStatus,
  segmentToggle,
}: HeaderTopBarProps) {
  const { t } = useTranslation()
  const storySideActive = variant === 'story' || variant === 'speak'
  const quizSideActive = variant === 'study'

  return (
    <>
      <QuizStatusPill {...quizStatus} />

      <TopBarMenuCluster>
        <HeaderMenuButton
          type='button'
          aria-label={t('header.menu')}
          onClick={onToggleMenu}
        >
          <IconMenu width={20} height={20} alt='' />
        </HeaderMenuButton>

        {segmentToggle.show && (
          <StoryQuizSegmentToggle
            storySideActive={storySideActive}
            quizSideActive={quizSideActive}
            onSelect={segmentToggle.onSelect}
          />
        )}
      </TopBarMenuCluster>
    </>
  )
}

const TopBarMenuCluster = styled.div`
  position: fixed;
  top: 15px;
  right: 15px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
`
