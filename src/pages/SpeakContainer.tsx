import { useContext, useEffect, useMemo, useRef, useState } from 'react'

import Header from '@components/organisms/common/Header'
import SpeakPracticePopup from '@components/organisms/speak/SpeakPracticePopup'
import SpeakBook from '@components/templates/speak/SpeakBook'
import {
  StoryBodyWrapper,
  StoryViewWrapper,
} from '@components/templates/story/StoryLayout'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { useStoryPageBackgroundReady } from '@hooks/story/useStoryPageBackgroundReady'
import { ViewType } from '@interfaces/common/ViewType'
import {
  getSpeakData,
  loadSpeakRecordData,
  saveSpeakResult,
} from '@services/speakApi'
import useSpeakAudio from '@src/hooks/speak/useSpeakAudio'
import { ISpeakRecord, SpeakPageProps } from '@src/interfaces/study/speak/ISpeak'

type SpeakContainerProps = {
  changeCurrentView: (view: ViewType) => void
  /** Speak 화면에서 나가 Story로 복귀 */
  onExitSpeak: () => void
}

function resolveInitialQuizIndex(
  speakData: SpeakPageProps[],
  recordedData: ISpeakRecord[],
): number {
  let nextIndex = 0

  if (recordedData.length > 0) {
    const lastRecord = recordedData[recordedData.length - 1]
    const lastIndex = speakData.findIndex(
      (d) =>
        d.Page === lastRecord.Page &&
        d.Sequence === lastRecord.Sequence &&
        d.DataPath !== '',
    )
    nextIndex = lastIndex + 1
  }

  while (nextIndex < speakData.length) {
    if (
      speakData[nextIndex].Contents !== '' &&
      speakData[nextIndex].DataPath !== ''
    ) {
      break
    }
    nextIndex++
  }

  return Math.min(nextIndex, speakData.length - 1)
}

/**
 * Speak 학습 — 헤더는 좌상단·진행바 유지, 중앙·우측 Story 버튼만(Speak 전용 variant).
 */
export default function SpeakContainer({
  changeCurrentView,
  onExitSpeak,
}: SpeakContainerProps) {
  const { bookInfo, studyInfo } = useContext(AppContext) as AppContextProps
  const [speakData, setSpeakData] = useState<SpeakPageProps[]>()
  const [quizIndex, setQuizIndex] = useState(0)
  const [speakPracticeOpen, setSpeakPracticeOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    const fetchAll = async () => {
      const params = {
        mode: studyInfo.mode,
        studyId: studyInfo.studyId,
        studentHistoryId: studyInfo.studentHistoryId,
      }

      const [speakResult, recordResult] = await Promise.allSettled([
        getSpeakData(params),
        loadSpeakRecordData(params),
      ])

      if (cancelled) return

      const data = speakResult.status === 'fulfilled' ? speakResult.value : []
      const recorded =
        recordResult.status === 'fulfilled' && Array.isArray(recordResult.value)
          ? recordResult.value
          : []

      setSpeakData(data)
      if (data.length > 0) {
        setQuizIndex(resolveInitialQuizIndex(data, recorded))
      }
    }

    void fetchAll()

    return () => {
      cancelled = true
    }
  }, [])

  const speakPageTotal = useMemo(() => {
    if (!speakData?.length) return 1
    const uniquePages = [...new Set(speakData.map((p) => p.Page))]
    return Math.max(1, Math.max(...uniquePages))
  }, [speakData])

  const soundPath = speakData?.[quizIndex]?.SoundPath ?? ''
  const currentImageSrc = speakData?.[quizIndex]?.ImagePath ?? ''
  const isImageReady = useStoryPageBackgroundReady(currentImageSrc)

  const {
    isPlaying,
    isAudioReady,
    audioDuration,
    play: onPlaySentence,
    reset: resetAudio,
  } = useSpeakAudio({
    soundPath,
    onEnded: () => setSpeakPracticeOpen(true),
  })

  const autoPlayedRef = useRef(false)
  const onPlaySentenceRef = useRef(onPlaySentence)
  onPlaySentenceRef.current = onPlaySentence

  useEffect(() => {
    autoPlayedRef.current = false
  }, [quizIndex])

  useEffect(() => {
    if (isAudioReady && isImageReady && !autoPlayedRef.current) {
      autoPlayedRef.current = true
      onPlaySentenceRef.current()
    }
  }, [isAudioReady, isImageReady])

  useEffect(() => {
    setSpeakPracticeOpen(false)
  }, [quizIndex])

  if (!speakData) return <>Loading...</>

  const advanceQuizIndex = (index: number) => {
    let next = index
    while (next < speakData.length && speakData[next]?.Sequence === 999) {
      next++
    }
    setQuizIndex(Math.min(next, speakData.length - 1))
  }

  const handleSkip = async () => {
    setIsSaving(true)
    try {
      const totalWordCount =
        speakData[quizIndex]?.Sentence?.trim().split(/\s+/).filter(Boolean)
          .length ?? 0
      const isLastQuiz =
        speakData.filter(
          (d, i) => i > quizIndex && !!d.Sentence && d.Sequence !== 999,
        ).length === 0

      const res = await saveSpeakResult({
        studyId: studyInfo.studyId,
        studentHistoryId: studyInfo.studentHistoryId,
        challengeNumber: speakData[quizIndex].ChallengeNumber,
        page: speakData[quizIndex].Page,
        sequence: speakData[quizIndex].Sequence,
        quizNo: speakData[quizIndex].QuizNo,
        sentence: speakData[quizIndex].Sentence,
        scoreOverall: 0,
        wordsJson: JSON.stringify({
          transcript: '',
          matchedWordIndexes: [],
          matchedCount: 0,
          totalCount: totalWordCount,
        }),
        isLastQuiz,
      })

      if (Number(res.result) !== 0) {
        alert('API Load Failed 2')
        return
      }

      advanceQuizIndex(quizIndex + 1)
    } catch (e) {
      alert('API Load Failed 2')
    } finally {
      setIsSaving(false)
    }
  }

  const handleNext = async (data: {
    matchedWordCount: number
    totalWordCount: number
    recognizedText: string
    matchedWordIndexes: number[]
  }) => {
    setIsSaving(true)
    try {
      const scoreOverall =
        data.totalWordCount > 0
          ? (data.matchedWordCount / data.totalWordCount) * 100
          : 0

      const isLastQuiz =
        speakData.filter(
          (d, i) => i > quizIndex && !!d.Sentence && d.Sequence !== 999,
        ).length === 0

      const res = await saveSpeakResult({
        studyId: studyInfo.studyId,
        studentHistoryId: studyInfo.studentHistoryId,
        challengeNumber: speakData[quizIndex].ChallengeNumber,
        page: speakData[quizIndex].Page,
        sequence: speakData[quizIndex].Sequence,
        quizNo: speakData[quizIndex].QuizNo,
        sentence: speakData[quizIndex].Sentence,
        scoreOverall,
        wordsJson: JSON.stringify({
          transcript: data.recognizedText,
          matchedWordIndexes: data.matchedWordIndexes,
          matchedCount: data.matchedWordCount,
          totalCount: data.totalWordCount,
        }),
        isLastQuiz,
      })

      if (Number(res.result) !== 0) {
        alert('API Load Failed 2')
        return
      }

      advanceQuizIndex(quizIndex + 1)
    } catch (e) {
      alert('API Load Failed 2')
    } finally {
      setIsSaving(false)
    }
  }

  const currentPage = speakData[quizIndex]?.Page ?? 1

  return (
    <StoryViewWrapper>
      <Header
        variant='speak'
        bookCode={bookInfo?.BookCode ?? ''}
        bookTitle={bookInfo?.Title}
        keywords={bookInfo?.Keywords}
        changeCurrentView={changeCurrentView}
        progress={currentPage}
        total={speakPageTotal}
        onBackToStory={onExitSpeak}
        onOpenSpeakPractice={() => setSpeakPracticeOpen(true)}
      />
      <StoryBodyWrapper>
        <SpeakBook
          speakData={speakData}
          quizIndex={quizIndex}
          bookLevel={bookInfo?.BookLevel?.substring(0, 1) ?? 'K'}
          isEbAnotherSizeYn={studyInfo.isEbAnotherSizeYn}
        />
        {speakPracticeOpen && (
          <SpeakPracticePopup
            speakData={speakData}
            quizIndex={quizIndex}
            onClose={() => {
              setSpeakPracticeOpen(false)
              resetAudio()
            }}
            isPlaying={isPlaying}
            audioDuration={audioDuration}
            onPlaySentence={onPlaySentence}
            isSaving={isSaving}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        )}
      </StoryBodyWrapper>
    </StoryViewWrapper>
  )
}
