import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { IconArrowRightWhite } from '@components/atoms/common/icons/IconArrowRightWhite'
import { IconRec } from '@components/atoms/common/icons/IconRec'
import IntroCoverBook from '@components/molecules/common/intro/IntroCoverBook'
import {
  IntroBackdrop,
  IntroColumn,
  IntroStartButton,
  IntroTitle,
} from '@components/molecules/common/intro/IntroLayout'

type SpeakIntroPanelProps = {
  coverSrc: string
  onStart: () => void
  onClose: () => void
}

export default function SpeakIntroPanel({
  coverSrc,
  onStart,
  onClose,
}: SpeakIntroPanelProps) {
  const { t } = useTranslation()

  return (
    <IntroBackdrop
      role='dialog'
      aria-modal='true'
      aria-labelledby='intro-title'
    >
      <IntroColumn>
        <IntroCoverBook coverSrc={coverSrc} />
        <div>
          <IntroTitle id='intro-title'>{t('intro.readyToSpeak')}</IntroTitle>
          <MicHint>{t('intro.checkMic')}</MicHint>
        </div>
        {/* <SpeakStartButton type='button' onClick={onStart}>
          <SpeakStartLeft>
            <IconRec width={36} height={36} />
            {t('intro.letsSpeak')}
          </SpeakStartLeft>
          <IconArrowRightWhite width={18} height={18} />
        </SpeakStartButton> */}
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

const MicHint = styled.p`
  margin: 0;
  font-family: 'Rg-B', sans-serif;
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.8);
`

const SpeakStartLeft = styled.span`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
`

const SpeakStartButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  max-width: 400px;
  height: 60px;
  border: none;
  border-radius: 15px;
  margin-top: 4px;
  padding: 0 20px;
  background: #354257;
  color: #fff;
  cursor: pointer;
  font-family: 'Rg-B', sans-serif;
  font-size: 1.25em;
  font-weight: 600;
  box-shadow: 0 3px 0 0 #1e2a38;
  transform: translateY(0);
  transition: all 0.05s ease;

  &:active {
    transform: translateY(3px);
    box-shadow: none;
  }
`

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
