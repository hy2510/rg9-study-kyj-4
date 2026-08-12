import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import styled from 'styled-components'

import CenteredLoading from '@components/atoms/common/CenteredLoading'
import MoviePopup from '@components/molecules/story/MoviePopup'
import Header from '@components/organisms/common/Header'
import StoryCompletePopup from '@components/organisms/story/StoryCompletePopup'
import StoryReadingModeBalloon from '@components/organisms/story/StoryReadingModeBalloon'
import StorySpeedBalloon from '@components/organisms/story/StorySpeedBalloon'
import VocaPreviewPopup from '@components/organisms/story/VocaPreviewPopup'
import {
  StoryBodyWrapper,
  StoryViewWrapper,
} from '@components/templates/story/StoryLayout'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { useStoryVocabularyPractice } from '@hooks/story/useStoryVocabularyPractice'
import { ViewType } from '@interfaces/common/ViewType'
import { getSpeakData } from '@services/speakApi'
import {
  getStoryInfo,
  submitPreference,
  submitReadLastPage,
} from '@services/storyApi'
import StoryPC from '@src/components/templates/story/Story'
import { type StoryReadingProfile } from '@src/constants/story/storyReadingProfile'
import {
  getStoredStoryPlaybackRate,
  getStoryAutoNextFromStorage,
  loadStoryReadMode,
  saveStoryReadModePartial,
} from '@src/constants/story/storyReadModeStorage'
import { PageProps } from '@src/interfaces/story/IStory'
import { flattenVocabularyPracticeToRows } from '@src/utils/story/flattenVocabularyPracticeRows'

type StoryContainerProps = {
  changeCurrentView: (view: ViewType) => void
  isVisible: boolean
}

export default function StoryContainer({
  changeCurrentView,
  isVisible,
}: StoryContainerProps) {
  const { bookInfo, studyInfo, handler } = useContext(
    AppContext,
  ) as AppContextProps
  const { vocaData1, vocaData2, vocaData3, vocaData4 } =
    useStoryVocabularyPractice()
  const [storyData, setStoryData] = useState<PageProps[]>()
  const [isReadingComplete, setReadingComplete] = useState(
    bookInfo?.ReadingCompletedEB === 'Y' ? true : false,
  )
  const [isMovieShow, setIsMovieShow] = useState(false)
  const [isVocaShow, setIsVocaShow] = useState(false)
  const [isImagesLoaded, setIsImagesLoaded] = useState(false)
  const [isStoryCompletePopupOpen, setIsStoryCompletePopupOpen] =
    useState(false)
  const [storyReplaySeq, setStoryReplaySeq] = useState(0)
  const hasOpenedVocaPreviewRef = useRef(false)
  const pauseBookAudioRef = useRef<() => void>(() => {})
  const stopBookAudioRef = useRef<() => void>(() => {})
  const vocaAnchorRef = useRef<HTMLButtonElement>(null)
  const [storyPageNumber, setStoryPageNumber] = useState(1)
  const [isAutoNext, setIsAutoNext] = useState(getStoryAutoNextFromStorage)
  const changeAutoNextPageRef = useRef<(isAuto: boolean) => void>(() => {})
  const [playbackRate, setPlaybackRate] = useState(getStoredStoryPlaybackRate)
  const changePlaybackRateRef = useRef<(rate: number) => void>(() => {})
  const profileAnchorRef = useRef<HTMLButtonElement>(null)
  const [isProfileBalloonOpen, setIsProfileBalloonOpen] = useState(false)
  const [hasSpeakContent, setHasSpeakContent] = useState(false)
  const [readingProfile, setReadingProfile] = useState<StoryReadingProfile>(
    () => loadStoryReadMode().readingProfile,
  )
  const speedAnchorRef = useRef<HTMLButtonElement>(null)
  const [isSpeedBalloonOpen, setIsSpeedBalloonOpen] = useState(false)
  const isSubmittingPreferenceRef = useRef<boolean>(false)

  useEffect(() => {
    saveStoryReadModePartial({ readingProfile })
  }, [readingProfile])

  useEffect(() => {
    const getStoryData = async () => {
      const data = await getStoryInfo(
        studyInfo.studyId,
        studyInfo.studentHistoryId,
      )

      if (data) {
        setStoryData(data)
      }
    }

    if (!storyData) getStoryData()
  }, [storyData])

  useEffect(() => {
    if (!studyInfo?.studyId || !studyInfo?.studentHistoryId) {
      setHasSpeakContent(false)
      return undefined
    }

    let cancelled = false

    const checkSpeakContent = async () => {
      try {
        const data = await getSpeakData({
          mode: studyInfo.mode,
          studyId: studyInfo.studyId,
          studentHistoryId: studyInfo.studentHistoryId,
        })

        if (!cancelled) setHasSpeakContent(data.length > 0)
      } catch {
        if (!cancelled) setHasSpeakContent(false)
      }
    }

    void checkSpeakContent()

    return () => {
      cancelled = true
    }
  }, [studyInfo?.mode, studyInfo?.studyId, studyInfo?.studentHistoryId])

  const postReadingComplete = async () => {
    const res = await submitReadLastPage(
      studyInfo.studyId,
      studyInfo.studentHistoryId,
    )
    if (res.success) {
      handler.markReadingCompletedEB()
    }
  }

  const storyPageTotal = useMemo(() => {
    if (!storyData?.length) return 1
    const uniquePages = [...new Set(storyData.map((p) => p.Page))]
    return Math.max(1, Math.max(...uniquePages))
  }, [storyData])

  const storyVocaKeywordRows = useMemo(
    () =>
      flattenVocabularyPracticeToRows(
        vocaData1,
        vocaData2,
        vocaData3,
        vocaData4,
      ),
    [vocaData1, vocaData2, vocaData3, vocaData4],
  )

  const hasVocaData = Boolean(vocaData1 || vocaData2 || vocaData3 || vocaData4)

  useEffect(() => {
    if (
      !storyData ||
      !hasVocaData ||
      !isImagesLoaded ||
      hasOpenedVocaPreviewRef.current
    )
      return

    hasOpenedVocaPreviewRef.current = true
    setIsSpeedBalloonOpen(false)
    setIsProfileBalloonOpen(false)
    setIsVocaShow(true)
  }, [hasVocaData, storyData, isImagesLoaded])

  useEffect(() => {
    if (isVocaShow) pauseBookAudioRef.current()
  }, [isVocaShow])

  /**
   * 별점은 항상 5점(=50) 고정 제출.
   * 추후 별점 선택 UI 가 도입되면 이 상수 대신 선택값을 사용한다.
   */
  const FIXED_PREFERENCE_VALUE = 50

  const ensurePreferenceSubmitted = useCallback(async (): Promise<boolean> => {
    if (studyInfo?.isSubmitPreference) return true
    if (isSubmittingPreferenceRef.current) return false
    isSubmittingPreferenceRef.current = true
    try {
      const res = await submitPreference(
        studyInfo.studyId,
        studyInfo.studentHistoryId,
        FIXED_PREFERENCE_VALUE,
      )
      if (res.success) {
        handler.markPreferenceSubmitted()
        return true
      }
      return false
    } finally {
      isSubmittingPreferenceRef.current = false
    }
  }, [
    studyInfo?.isSubmitPreference,
    studyInfo.studyId,
    studyInfo.studentHistoryId,
    handler,
  ])

  const navigateFromHeader = useCallback(
    async (view: ViewType) => {
      if (view !== 'Study') {
        changeCurrentView(view)
        return
      }
      const ok = await ensurePreferenceSubmitted()
      if (!ok) return
      changeCurrentView('Study')
    },
    [changeCurrentView, ensurePreferenceSubmitted],
  )

  // Story 화면에서 ESC 더블 프레스 시 퀴즈 풀기(Study)로 전환.
  // 단, 퀴즈 풀기가 아직 활성화되지 않은 상태(별점 미제출 + EB 미완독)에서는 제외.
  const goQuizRef = useRef<() => void>(() => {})
  useEffect(() => {
    goQuizRef.current = () => {
      const isGoQuizEnabled =
        Boolean(studyInfo?.isSubmitPreference) ||
        bookInfo?.ReadingCompletedEB === 'Y'
      if (!isGoQuizEnabled) return
      void navigateFromHeader('Study')
    }
  }, [
    bookInfo?.ReadingCompletedEB,
    navigateFromHeader,
    studyInfo?.isSubmitPreference,
  ])
  useEffect(() => {
    if (!isVisible) return

    const ESC_DOUBLE_PRESS_MS = 400
    let lastEscTime = 0
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.repeat) return
      const now = Date.now()
      if (now - lastEscTime <= ESC_DOUBLE_PRESS_MS) {
        lastEscTime = 0
        goQuizRef.current()
      } else {
        lastEscTime = now
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  if (!storyData) return <CenteredLoading fillViewport />

  const headerProgress = Math.min(storyPageNumber, storyPageTotal)
  const movieUrl =
    typeof bookInfo.AnimationPath === 'string'
      ? bookInfo.AnimationPath.trim()
      : ''
  const hasMovieContent = movieUrl.length > 0

  const onVocaClick = () => {
    setIsSpeedBalloonOpen(false)
    setIsProfileBalloonOpen(false)
    setIsVocaShow((prev) => !prev)
  }

  const onSpeakClick = () => changeCurrentView('Speak')

  const onMovieClick = () => setIsMovieShow(true)

  const openStoryCompletePopup = () => {
    // Story Complete 팝업은 학습 전환의 분기점이므로 pause 가 아닌 stop 으로 완전 정지.
    // pause 만으로는 이후 `canplaythrough` 등 자동 재생 트리거에서 다시 재생될 수 있어
    // Study 화면에서 잔류 재생이 들리는 사례가 보고됨 → src 까지 비워 차단.
    stopBookAudioRef.current()
    void postReadingComplete()
    setReadingComplete(true)
    setIsStoryCompletePopupOpen(true)
  }

  /**
   * Story Complete 팝업의 "퀴즈 풀기" 버튼 핸들러.
   * 별점 게이트 통과 시 팝업 닫고 Study 로 전환.
   */
  const goStudyFromCompletePopup = async () => {
    const ok = await ensurePreferenceSubmitted()
    if (!ok) return
    setIsStoryCompletePopupOpen(false)
    changeCurrentView('Study')
  }

  const handleReadAgain = () => {
    setIsStoryCompletePopupOpen(false)
    setIsMovieShow(false)
    setIsVocaShow(false)
    setStoryPageNumber(1)
    setStoryReplaySeq((seq) => seq + 1)
  }

  const watchMovieFromCompletePopup = () => {
    setIsStoryCompletePopupOpen(false)
    setIsMovieShow(true)
  }

  const goSpeakFromCompletePopup = () => {
    setIsStoryCompletePopupOpen(false)
    changeCurrentView('Speak')
  }

  const exitStudyFromCompletePopup = () => {
    const exitStudy = (window as Window & { onExitStudy?: () => void })
      .onExitStudy

    if (exitStudy) {
      exitStudy()
      return
    }

    window.location.href = '/'
  }

  const onAutoNextToggle = () => changeAutoNextPageRef.current(!isAutoNext)

  const onProfileBalloonToggle = () => {
    setIsVocaShow(false)
    setIsSpeedBalloonOpen(false)
    setIsProfileBalloonOpen((prev) => !prev)
  }

  const onSpeedBalloonToggle = () => {
    setIsVocaShow(false)
    setIsProfileBalloonOpen(false)
    setIsSpeedBalloonOpen((prev) => !prev)
  }

  const toggleMovieShow = (isShow: boolean) => setIsMovieShow(isShow)

  const registerPauseBookAudio = (fn: () => void) => {
    pauseBookAudioRef.current = fn
    if (isVocaShow) fn()
  }

  const registerStopBookAudio = (fn: () => void) => {
    stopBookAudioRef.current = fn
  }

  const registerChangeAutoNextPage = (fn: (next: boolean) => void) => {
    changeAutoNextPageRef.current = fn
  }

  const registerChangePlaybackRate = (fn: (rate: number) => void) => {
    changePlaybackRateRef.current = fn
  }

  const closeProfileBalloon = () => setIsProfileBalloonOpen(false)
  const closeSpeedBalloon = () => setIsSpeedBalloonOpen(false)
  const closeVocaBalloon = () => setIsVocaShow(false)
  const closeMovie = () => setIsMovieShow(false)

  const pauseBookAudio = () => pauseBookAudioRef.current()

  const handleSelectReadingProfile = (p: StoryReadingProfile) =>
    setReadingProfile(p)

  const handleSelectPlaybackRate = (rate: number) =>
    changePlaybackRateRef.current(rate)

  return (
    <StoryViewWrapper>
      <Header
        variant='story'
        bookCode={bookInfo?.BookCode ?? ''}
        bookTitle={bookInfo?.Title}
        keywords={bookInfo?.Keywords}
        changeCurrentView={navigateFromHeader}
        closeMenuSignal={isVocaShow}
        progress={headerProgress}
        total={storyPageTotal}
        onVocaClick={onVocaClick}
        onSpeakClick={hasSpeakContent ? onSpeakClick : undefined}
        onMovieClick={hasMovieContent ? onMovieClick : undefined}
        onReadAgainClick={handleReadAgain}
        vocaAnchorRef={vocaAnchorRef}
        isAutoNext={isAutoNext}
        onAutoNextToggle={onAutoNextToggle}
        readingProfile={readingProfile}
        profileAnchorRef={profileAnchorRef}
        isProfileBalloonOpen={isProfileBalloonOpen}
        onProfileBalloonToggle={onProfileBalloonToggle}
        playbackRate={playbackRate}
        speedAnchorRef={speedAnchorRef}
        isSpeedBalloonOpen={isSpeedBalloonOpen}
        onSpeedBalloonToggle={onSpeedBalloonToggle}
        storyVocaKeywordRows={storyVocaKeywordRows}
        storyVocabularyPrintUrl={bookInfo?.VocabularyPath}
        pauseBookAudio={pauseBookAudio}
        isGoQuizDisabled={
          !(
            studyInfo?.isSubmitPreference ||
            bookInfo?.ReadingCompletedEB === 'Y'
          )
        }
      />
      <StoryBodyWrapper>
        {isVocaShow && (
          <VocaPreviewPopup
            bookLevel={bookInfo?.BookLevel}
            onClose={closeVocaBalloon}
            pauseBookAudio={pauseBookAudio}
            vocaData1={vocaData1}
            vocaData2={vocaData2}
            vocaData3={vocaData3}
            vocaData4={vocaData4}
          />
        )}
        <StoryContent>
          <StoryPC
            key={storyReplaySeq}
            bookLevel={bookInfo?.BookLevel?.substring(0, 1) ?? 'K'}
            studyId={studyInfo.studyId}
            studentHistoryId={studyInfo.studentHistoryId}
            isEbAnotherSizeYn={studyInfo.isEbAnotherSizeYn}
            isMovieShow={isMovieShow || isVocaShow || isStoryCompletePopupOpen}
            storyData={storyData}
            toggleMovieShow={toggleMovieShow}
            isReadingComplete={isReadingComplete}
            changeReadingComplete={postReadingComplete}
            isVisible={isVisible}
            onRegisterPause={registerPauseBookAudio}
            onRegisterStop={registerStopBookAudio}
            onPageNumberChange={setStoryPageNumber}
            onRegisterChangeAutoNextPage={registerChangeAutoNextPage}
            onAutoNextChange={setIsAutoNext}
            onPlaybackRateChange={setPlaybackRate}
            onRegisterChangePlaybackRate={registerChangePlaybackRate}
            onFinalNext={openStoryCompletePopup}
            onImagesLoaded={() => setIsImagesLoaded(true)}
            readingProfile={readingProfile}
          />
        </StoryContent>
      </StoryBodyWrapper>
      {isProfileBalloonOpen && (
        <StoryReadingModeBalloon
          isOpen={isProfileBalloonOpen}
          onClose={closeProfileBalloon}
          anchorRef={profileAnchorRef}
          layoutTrigger={true}
          readingProfile={readingProfile}
          onSelectProfile={handleSelectReadingProfile}
        />
      )}
      {isSpeedBalloonOpen && (
        <StorySpeedBalloon
          isOpen={isSpeedBalloonOpen}
          onClose={closeSpeedBalloon}
          anchorRef={speedAnchorRef}
          layoutTrigger={true}
          playbackRate={playbackRate}
          onSelectRate={handleSelectPlaybackRate}
        />
      )}
      {isMovieShow && hasMovieContent && (
        <MoviePopup url={movieUrl} onClose={closeMovie} />
      )}
      {isStoryCompletePopupOpen && (
        <StoryCompletePopup
          hasMovie={hasMovieContent}
          hasSpeak={hasSpeakContent}
          onClose={() => setIsStoryCompletePopupOpen(false)}
          onGoQuiz={goStudyFromCompletePopup}
          onReadAgain={handleReadAgain}
          onWatchMovie={watchMovieFromCompletePopup}
          onSpeakPractice={goSpeakFromCompletePopup}
          onExitStudy={exitStudyFromCompletePopup}
        />
      )}
    </StoryViewWrapper>
  )
}

const StoryContent = styled.div`
  width: 100%;
  height: 100%;
`
