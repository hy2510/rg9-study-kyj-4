import { useEffect } from 'react'

import styled, { css, keyframes } from 'styled-components'

import { IconArrowRightWhite } from '@components/atoms/common/icons/IconArrowRightWhite'
import { IconMicWhite } from '@components/atoms/common/icons/IconMicWhite'
import { IconSpeakerWhite } from '@components/atoms/common/icons/IconSpeakerWhite'
import TextBox from '@components/atoms/common/TextBox'
import PopupLayout from '@components/molecules/common/PopupLayout'
import {
  type SpeakRecordingResult,
  useSpeakRecordingAnalysis,
} from '@src/hooks/story/useSpeakRecordingAnalysis'
import { SpeakPageProps } from '@src/interfaces/study/speak/ISpeak'

type SentenceDisplayToken = {
  text: string
  wordIndex?: number
}

function getSentenceDisplayTokens(sentence: string): SentenceDisplayToken[] {
  let wordIndex = -1

  return sentence.split(/(\s+)/).map((text) => {
    if (/^\s+$/.test(text)) return { text }

    wordIndex += 1
    return { text, wordIndex }
  })
}

type NextData = {
  matchedWordCount: number
  totalWordCount: number
  recognizedText: string
  matchedWordIndexes: number[]
}

type SpeakPracticePopupProps = {
  speakData: SpeakPageProps[]
  quizIndex: number
  /** 닫기(Speak 종료 → Story) */
  onClose: () => void
  isPlaying: boolean
  audioDuration: number
  onPlaySentence: () => void
  isSaving: boolean
  onNext: (data: NextData) => Promise<void>
  onSkip: () => Promise<void>
}

export default function SpeakPracticePopup({
  speakData,
  quizIndex,
  onClose,
  isPlaying,
  audioDuration,
  onPlaySentence,
  isSaving,
  onNext,
  onSkip,
}: SpeakPracticePopupProps) {
  const targetSentence = speakData[quizIndex]?.Sentence ?? ''

  const {
    isRecordingMode,
    matchedWordIndexes,
    recognizedText,
    recordingResult,
    startRecordingAnalysis,
    resetRecordingAnalysis,
  } = useSpeakRecordingAnalysis({
    targetSentence,
    maxDurationMs: audioDuration * 1000,
  })

  const totalWordCount = targetSentence
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  useEffect(() => {
    resetRecordingAnalysis()
  }, [quizIndex])
  const isCorrect = recordingResult === 'correct'
  const isIncorrect = recordingResult === 'incorrect'
  const hasFinalResult = isCorrect || isIncorrect
  const matchedWordIndexSet = new Set(matchedWordIndexes)
  const sentenceDisplayTokens = getSentenceDisplayTokens(targetSentence)

  return (
    <PopupLayout onClose={onClose}>
      <MainContainer isCorrect={isCorrect} isIncorrect={isIncorrect}>
        {isRecordingMode ? (
          <StatusDot $status='recording' aria-hidden />
        ) : isCorrect ? (
          <StatusDot $status='learned' aria-hidden />
        ) : null}
        <TextBox
          fontSize={1.75}
          fontWeight={600}
          color={isCorrect ? '#199261' : isIncorrect ? '#EF3D64' : 'primary'}
        >
          {sentenceDisplayTokens.map((token, tokenIndex) => {
            if (token.wordIndex === undefined) return token.text

            return (
              <SentenceWord
                key={`${token.text}-${tokenIndex}`}
                $matched={matchedWordIndexSet.has(token.wordIndex)}
                $dimmed={
                  hasFinalResult && !matchedWordIndexSet.has(token.wordIndex)
                }
              >
                {token.text}
              </SentenceWord>
            )
          })}
        </TextBox>
        <Actions>
          <div className='skip-button'>
            {isIncorrect ? (
              <SkipButton
                type='button'
                disabled={isSaving || isPlaying || isRecordingMode}
                onClick={onSkip}
              >
                <TextBox fontSize={1.1} fontWeight={600} color='secondary'>
                  Skip
                </TextBox>
              </SkipButton>
            ) : null}
          </div>
          <div className='record-button-container'>
            <RecordButton
              type='button'
              $recording={isRecordingMode}
              $disabled={isPlaying || audioDuration === 0}
              disabled={isPlaying || audioDuration === 0}
              onClick={startRecordingAnalysis}
            >
              <IconMicWhite width={24} height={24} />
            </RecordButton>
            <ButtonSoundPlay
              type='button'
              disabled={isRecordingMode}
              $activeVisual={isRecordingMode || isPlaying}
              onClick={onPlaySentence}
            >
              <IconSpeakerWhite width={24} height={24} />
            </ButtonSoundPlay>
            {isCorrect ? (
              <NextButton
                type='button'
                $disabled={isPlaying || isRecordingMode || isSaving}
                disabled={isPlaying || isRecordingMode || isSaving}
                onClick={() =>
                  onNext({
                    matchedWordCount: matchedWordIndexes.length,
                    totalWordCount,
                    recognizedText,
                    matchedWordIndexes,
                  })
                }
              >
                <IconArrowRightWhite width={24} height={24} />
              </NextButton>
            ) : null}
          </div>
        </Actions>
      </MainContainer>
    </PopupLayout>
  )
}

const MainContainer = styled.div<{ isCorrect: boolean; isIncorrect: boolean }>`
  flex: 1;
  width: calc(100% - 40px);
  min-height: 0;
  height: calc(100% - 40px);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ isCorrect, isIncorrect }) =>
    isCorrect ? '#d3ffbc' : isIncorrect ? '#FDEDEF' : '#fff'};
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;

  > * {
    position: relative;
    z-index: 1;
  }

  &::before {
    content: '';
    position: absolute;
    top: -20px;
    left: -20px;
    width: calc(100% + 40px);
    height: calc(100% + 40px);
    background-color: ${({ isCorrect, isIncorrect }) =>
      isCorrect ? '#d3ffbc' : isIncorrect ? '#FDEDEF' : '#fff'};
    border-radius: 30px;
    pointer-events: none;
    z-index: 0;
  }
`

const SentenceWord = styled.span<{ $matched: boolean; $dimmed: boolean }>`
  display: inline-block;
  padding: 0 3px;
  border-radius: 8px;
  color: ${(p) => (p.$matched ? '#199261' : 'inherit')};
  background: ${(p) =>
    p.$matched ? 'rgba(211, 255, 188, 0.9)' : 'transparent'};
  opacity: ${(p) => (p.$dimmed ? 0.35 : 1)};
  transition:
    background 0.15s ease,
    color 0.15s ease,
    opacity 0.15s ease;
`

const SkipButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  opacity: 1;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`

const Actions = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  .skip-button {
    cursor: pointer;
    margin: 0 15px;
  }

  .record-button-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
`

const recordingDotBlink = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.35;
    transform: scale(0.72);
  }
`

const recordingBorderWave = keyframes`
  0% {
    box-shadow:
      0 0 0 0 rgba(239, 61, 100, 0.38),
      0 0 0 0 rgba(239, 61, 100, 0.22);
  }
  70% {
    box-shadow:
      0 0 0 8px rgba(239, 61, 100, 0),
      0 0 0 18px rgba(239, 61, 100, 0);
  }
  100% {
    box-shadow:
      0 0 0 0 rgba(239, 61, 100, 0),
      0 0 0 0 rgba(239, 61, 100, 0);
  }
`

const StatusDot = styled.span<{ $status: 'recording' | 'learned' }>`
  position: absolute;
  top: 16px;
  left: 16px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${(p) => (p.$status === 'learned' ? '#12966b' : '#ef3d64')};
  ${(p) =>
    p.$status === 'recording'
      ? css`
          animation: ${recordingDotBlink} 0.9s ease-in-out infinite;
        `
      : ''}
`

const ButtonSoundPlay = styled.button<{ $activeVisual: boolean }>`
  position: relative;
  cursor: ${(p) => (p.$activeVisual ? 'not-allowed' : 'pointer')};
  width: 50px;
  height: 50px;
  border-radius: 15px;
  border: 2px solid rgb(0, 0, 0, 0.2);
  border-bottom: ${(p) =>
    p.$activeVisual ? 'none' : '3px solid rgb(0, 0, 0, 0.2)'};
  padding: 0;
  background: #354257;
  transform: ${(p) => (p.$activeVisual ? 'translateY(2px)' : 'translateY(0)')};
  opacity: ${(p) => (p.$activeVisual ? 0.45 : 1)};

  &:active:not(:disabled) {
    transform: translateY(2px);
    border-bottom: none;
  }
`

const NextButton = styled.button<{ $disabled: boolean }>`
  position: relative;
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(p) => (p.$disabled ? 0.45 : 1)};
  width: 50px;
  height: 50px;
  border-radius: 15px;
  border: 2px solid rgb(0, 0, 0, 0.2);
  padding: 0;
  background: #354257;

  &:active {
    transform: translateY(2px);
    border-bottom: none;
  }
`

const RecordButton = styled.button<{ $recording: boolean; $disabled: boolean }>`
  position: relative;
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(p) => (p.$disabled ? 0.45 : 1)};
  width: 50px;
  height: 50px;
  border-radius: 15px;
  border: 2px solid ${(p) => (p.$recording ? '#ef3d64' : 'transparent')};
  padding: 0;
  background: #e82031;
  border-bottom: ${(p) =>
    p.$recording ? 'none' : '3px solid rgb(0, 0, 0, 0.2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  transform: ${(p) => (p.$recording ? 'translateY(2px)' : 'translateY(0)')};
  overflow: ${(p) => (p.$recording ? 'visible' : 'hidden')};
  ${(p) =>
    p.$recording
      ? css`
          animation: ${recordingBorderWave} 1.35s ease-out infinite;

          &::after {
            content: '';
            position: absolute;
            inset: -2px;
            border: 2px solid rgba(239, 61, 100, 0.28);
            border-radius: inherit;
            pointer-events: none;
            animation: ${recordingBorderWave} 1.35s ease-out infinite;
          }
        `
      : ''}

  img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  &:active {
    transform: translateY(2px);
    border-bottom: none;
  }
`
