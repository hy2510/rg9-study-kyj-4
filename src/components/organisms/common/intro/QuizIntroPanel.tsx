import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import IntroCoverBook from '@components/molecules/common/intro/IntroCoverBook'
import {
  IntroBackdrop,
  IntroColumn,
  IntroStartButton,
  IntroTitle,
} from '@components/molecules/common/intro/IntroLayout'

type QuizIntroPanelProps = {
  coverSrc: string
  onStart: () => void
  onClose: () => void
}

export default function QuizIntroPanel({
  coverSrc,
  onStart,
  onClose,
}: QuizIntroPanelProps) {
  const { t } = useTranslation()

  return (
    <IntroBackdrop
      role='dialog'
      aria-modal='true'
      aria-labelledby='intro-title'
    >
      <IntroColumn>
        <IntroCoverBook coverSrc={coverSrc} />
        <IntroTitle id='intro-title'>{t('intro.readyToQuiz')}</IntroTitle>
        <IntroStartButton type='button' onClick={onStart}>
          Start
        </IntroStartButton>
        <CloseLink type='button' onClick={onClose}>
          Not Now
        </CloseLink>
      </IntroColumn>
    </IntroBackdrop>
  )
}

const CloseLink = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  font-family: 'Rg-B', sans-serif;
  font-size: 1.1em;
  color: rgba(255, 255, 255, 0.7);
  padding: 4px 8px;

  &:hover {
    color: #fff;
  }
`
