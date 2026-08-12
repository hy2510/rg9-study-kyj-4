import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { IconChevronDown } from '@components/atoms/common/icons/IconChevronDown'
import IntroCoverBook from '@components/molecules/common/intro/IntroCoverBook'
import {
  IntroBackdrop,
  IntroColumn,
  IntroStartButton,
  IntroTitle,
} from '@components/molecules/common/intro/IntroLayout'
import StoryReadingModeBalloon from '@components/organisms/story/StoryReadingModeBalloon'
import StorySpeedBalloon from '@components/organisms/story/StorySpeedBalloon'
import { formatStoryPlaybackRateLabel } from '@src/constants/story/storyPlayback'
import {
  getStoryReadingProfileLabel,
  type StoryReadingProfile,
} from '@src/constants/story/storyReadingProfile'
import {
  loadStoryReadMode,
  saveStoryReadModePartial,
  setStoryAutoNextInStorage,
} from '@src/constants/story/storyReadModeStorage'

type StoryIntroPanelProps = {
  coverSrc: string
  onStart: () => void
}

export default function StoryIntroPanel({ coverSrc, onStart }: StoryIntroPanelProps) {
  const { t } = useTranslation()

  const initialReadMode = useMemo(() => loadStoryReadMode(), [])
  const [readingProfile, setReadingProfile] = useState<StoryReadingProfile>(
    initialReadMode.readingProfile,
  )
  const [isAutoNext, setIsAutoNext] = useState(initialReadMode.isAutoNext)
  const [playbackRate, setPlaybackRate] = useState(initialReadMode.playbackRate)
  const profileAnchorRef = useRef<HTMLButtonElement>(null)
  const speedAnchorRef = useRef<HTMLButtonElement>(null)
  const [isProfileBalloonOpen, setIsProfileBalloonOpen] = useState(false)
  const [isSpeedBalloonOpen, setIsSpeedBalloonOpen] = useState(false)

  useEffect(() => {
    saveStoryReadModePartial({ readingProfile })
  }, [readingProfile])

  const onProfileToggle = () => {
    setIsSpeedBalloonOpen(false)
    setIsProfileBalloonOpen((o) => !o)
  }

  const onSpeedToggle = () => {
    setIsProfileBalloonOpen(false)
    setIsSpeedBalloonOpen((o) => !o)
  }

  const onAutoNextToggle = () => {
    const next = !isAutoNext
    setIsAutoNext(next)
    setStoryAutoNextInStorage(next)
  }

  const pageTurnShortLabel = isAutoNext ? 'Auto Play · On' : 'Auto Play · Off'

  const handleSelectReadingProfile = (p: StoryReadingProfile) => {
    setReadingProfile(p)
  }

  const handleSelectPlaybackRate = (rate: number) => {
    setPlaybackRate(rate)
    saveStoryReadModePartial({ playbackRate: rate })
  }

  const closeProfileBalloon = () => setIsProfileBalloonOpen(false)
  const closeSpeedBalloon = () => setIsSpeedBalloonOpen(false)

  return (
    <>
      <IntroBackdrop
        role='dialog'
        aria-modal='true'
        aria-labelledby='intro-title'
      >
        <IntroColumn>
          <IntroCoverBook coverSrc={coverSrc} />

          <IntroTitle id='intro-title'>{t('intro.readyToRead')}</IntroTitle>

          <ReadModeBlock>
            <ChipRow>
              <Chip
                ref={profileAnchorRef}
                type='button'
                onClick={onProfileToggle}
              >
                {getStoryReadingProfileLabel(readingProfile)}
                <IconChevronDown width={14} height={14} alt='' />
              </Chip>
              <Chip type='button' onClick={onAutoNextToggle}>
                {pageTurnShortLabel}
              </Chip>
              <Chip ref={speedAnchorRef} type='button' onClick={onSpeedToggle}>
                Speed {formatStoryPlaybackRateLabel(playbackRate)}
                <IconChevronDown width={14} height={14} alt='' />
              </Chip>
            </ChipRow>
          </ReadModeBlock>

          <IntroStartButton type='button' onClick={onStart}>
            Start
          </IntroStartButton>
        </IntroColumn>
      </IntroBackdrop>

      {isProfileBalloonOpen && (
        <StoryReadingModeBalloon
          isOpen={isProfileBalloonOpen}
          onClose={closeProfileBalloon}
          anchorRef={profileAnchorRef}
          layoutTrigger
          readingProfile={readingProfile}
          onSelectProfile={handleSelectReadingProfile}
        />
      )}
      {isSpeedBalloonOpen && (
        <StorySpeedBalloon
          isOpen={isSpeedBalloonOpen}
          onClose={closeSpeedBalloon}
          anchorRef={speedAnchorRef}
          layoutTrigger
          playbackRate={playbackRate}
          onSelectRate={handleSelectPlaybackRate}
        />
      )}
    </>
  )
}




const ReadModeBlock = styled.div`
  width: 100%;
  max-width: 380px;
`

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: center;
  gap: 8px;
`

const Chip = styled.button`
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  font-family: 'Rg-B', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: #3c4b62;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);

  &:active {
    transform: scale(0.98);
  }
`

