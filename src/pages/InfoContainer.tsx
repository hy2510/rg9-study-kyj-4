import {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { styled } from 'styled-components'

import CenteredLoading from '@components/atoms/common/CenteredLoading'
import IntroScreen from '@components/organisms/common/IntroScreen'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { ViewType } from '@interfaces/common/ViewType'
import LegacyStudyContainer from '@pages/LegacyStudyContainer'
import MovieBookContainer from '@pages/MovieBookContainer'
import RemixStudyContainer from '@pages/RemixStudyContainer'
import SpeakContainer from '@pages/SpeakContainer'
import StoryContainer from '@pages/StoryContainer'
import WordPracticeContainer from '@pages/WordPracticeContainer'
import { StudyEntryType } from '@src/interfaces/common/Types'
import ASSETS from '@utils/Assets'

type InfoContainerProps = {
  /** 진입 시에만 결정 — studyInfo와 무관 */
  studyUi: StudyEntryType
}

/** Study 배경: 캐릭터 변경 시 STUDY_CHARACTER 수정 */
const STUDY_CHARACTER = 'gino'

const CHAR_BACKGROUNDS: Record<string, string[]> = {
  baro: [ASSETS.Baro.bg01, ASSETS.Baro.bg02, ASSETS.Baro.bg03],
  chello: [ASSETS.Chello.bg01, ASSETS.Chello.bg02, ASSETS.Chello.bg03],
  millo: [ASSETS.Millo.bg01, ASSETS.Millo.bg02, ASSETS.Millo.bg03],
  jack: [ASSETS.Jack.bg01, ASSETS.Jack.bg02, ASSETS.Jack.bg03],
  blanc: [ASSETS.Blanc.bg01, ASSETS.Blanc.bg02, ASSETS.Blanc.bg03],
  sheila: [ASSETS.Sheila.bg01, ASSETS.Sheila.bg02, ASSETS.Sheila.bg03],
  tori: [ASSETS.Tori.bg01, ASSETS.Tori.bg02, ASSETS.Tori.bg03],
  roro: [ASSETS.Roro.bg01, ASSETS.Roro.bg02, ASSETS.Roro.bg03],
  greenthumb: [
    ASSETS.Greenthumb.bg01,
    ASSETS.Greenthumb.bg02,
    ASSETS.Greenthumb.bg03,
  ],
  leoni: [
    ASSETS.Leoni.bg01,
    ASSETS.Leoni.bg02,
    ASSETS.Leoni.bg03,
    ASSETS.Leoni.bg04,
  ],
  goma: [
    ASSETS.Goma.bg01,
    ASSETS.Goma.bg02,
    ASSETS.Goma.bg03,
    ASSETS.Goma.bg04,
  ],
  gino: [
    ASSETS.Gino.bg01,
    ASSETS.Gino.bg02,
    ASSETS.Gino.bg03,
    ASSETS.Gino.bg04,
  ],
  edmond: [
    ASSETS.Edmond.bg01,
    ASSETS.Edmond.bg02,
    ASSETS.Edmond.bg03,
    ASSETS.Edmond.bg04,
  ],
}

export default function InfoContainer() {
  const { studyInfo, bookInfo } = useContext(AppContext) as AppContextProps
  const [currentView, setCurrentView] = useState<ViewType>('Loading')

  const [studyBackgroundImage] = useState(() => {
    const bgs = CHAR_BACKGROUNDS[STUDY_CHARACTER]
    return bgs[Math.floor(Math.random() * bgs.length)]
  })

  /** 같은 페이지 로드(InfoContainer 마운트) 안에서만 Story/Study 각각 인트로 1회 — 새로고침 시 초기화 */
  const [introConsumed, setIntroConsumed] = useState({
    story: false,
    study: false,
    speak: false,
    wordPractice: false,
  })

  const dismissStoryIntro = useCallback(() => {
    setIntroConsumed((s) => ({ ...s, story: true }))
  }, [])

  const dismissStudyIntro = useCallback(() => {
    setIntroConsumed((s) => ({ ...s, study: true }))
  }, [])

  const dismissSpeakIntro = useCallback(() => {
    setIntroConsumed((s) => ({ ...s, speak: true }))
  }, [])

  const dismissWordPracticeIntro = useCallback(() => {
    setIntroConsumed((s) => ({ ...s, wordPractice: true }))
  }, [])

  // 세션 종료 시 정보 제거
  useEffect(() => {
    const handleBeforeUnload = () => {
      window.sessionStorage.removeItem('finishStudyInfo')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const isInitialDecidedRef = useRef<boolean>(false)

  useEffect(() => {
    if (isInitialDecidedRef.current) return
    if (!studyInfo || !bookInfo) return

    isInitialDecidedRef.current = true

    if (studyInfo.isStartWordPractice) {
      setCurrentView('WordPractice')
      return
    }

    if (studyInfo.isStartSpeak) {
      setCurrentView('Speak')
      return
    }

    if (studyInfo.isSubmitPreference) {
      setCurrentView('Study')
      return
    }

    if (studyInfo.bookType === 'EB') {
      setCurrentView('Story')
      return
    }

    setCurrentView('Study')
  }, [studyInfo, bookInfo])

  const changeCurrentView = (view: ViewType) => {
    setCurrentView(view)
  }

  // EB 유형 학습 중 ESC 더블 프레스 시 Story 화면으로 전환
  const lastEscTimeRef = useRef<number>(0)
  useEffect(() => {
    if (currentView !== 'Study' || studyInfo?.bookType !== 'EB') return

    const ESC_DOUBLE_PRESS_MS = 400
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.repeat) return
      const now = Date.now()
      if (now - lastEscTimeRef.current <= ESC_DOUBLE_PRESS_MS) {
        lastEscTimeRef.current = 0
        changeCurrentView('Story')
      } else {
        lastEscTimeRef.current = now
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentView, studyInfo?.bookType])

  const showStoryIntro =
    currentView === 'Story' && studyInfo && !introConsumed.story
  const showStudyIntro =
    currentView === 'Study' && studyInfo && !introConsumed.study
  const showSpeakIntro =
    currentView === 'Speak' && studyInfo && !introConsumed.speak

  const showWordPracticeIntro =
    currentView === 'WordPractice' && studyInfo && !introConsumed.wordPractice

  const storyContentVisible = currentView === 'Story' && introConsumed.story
  const studyContentVisible = currentView === 'Study' && introConsumed.study

  // Speak: Story·Study를 마운트하지 않아 완전 언마운트. 그 외 Read Again 시 진행 유지를 위해 Story/Study는 display만 전환.
  const renderView = (): ReactElement => {
    if (currentView === 'Loading') {
      return <CenteredLoading fillViewport />
    }

    if (currentView === 'Speak') {
      return (
        <>
          {introConsumed.speak && (
            <SpeakContainer
              changeCurrentView={changeCurrentView}
              onExitSpeak={() => changeCurrentView('Story')}
            />
          )}
        </>
      )
    }

    if (currentView === 'WordPractice') {
      return <>{introConsumed.wordPractice && <WordPracticeContainer />}</>
    }

    return (
      <>
        <ViewWrapper
          $visible={currentView === 'Story'}
          aria-hidden={currentView !== 'Story'}
        >
          {introConsumed.story &&
            (bookInfo?.IsMovieBookYn ? (
              <MovieBookContainer
                changeCurrentView={changeCurrentView}
                isVisible={storyContentVisible}
              />
            ) : (
              <StoryContainer
                changeCurrentView={changeCurrentView}
                isVisible={storyContentVisible}
              />
            ))}
        </ViewWrapper>

        <ViewWrapper
          $visible={currentView === 'Study'}
          aria-hidden={currentView !== 'Study'}
        >
          {introConsumed.study &&
            studyInfo &&
            (studyInfo.studyEntryType === 'remix' ? (
              <RemixStudyContainer
                changeCurrentView={changeCurrentView}
                isVisible={studyContentVisible}
                studyCharacter={STUDY_CHARACTER}
              />
            ) : (
              <LegacyStudyContainer
                changeCurrentView={changeCurrentView}
                isVisible={studyContentVisible}
              />
            ))}
        </ViewWrapper>
      </>
    )
  }

  const coverSrc =
    typeof bookInfo?.SurfaceImage === 'string'
      ? bookInfo.SurfaceImage.trim()
      : ''

  return (
    <SharedAppBackgroundBox $backgroundImage={studyBackgroundImage}>
      <ViewBox>{renderView()}</ViewBox>
      {showStoryIntro && (
        <IntroScreen
          variant={bookInfo?.IsMovieBookYn ? 'moviebook' : 'story'}
          coverSrc={coverSrc}
          onStart={dismissStoryIntro}
        />
      )}
      {showStudyIntro && (
        <IntroScreen
          variant='study'
          coverSrc={coverSrc}
          onStart={dismissStudyIntro}
          onClose={() => changeCurrentView('Story')}
        />
      )}
      {showSpeakIntro && (
        <IntroScreen
          variant='speak'
          coverSrc={coverSrc}
          onStart={dismissSpeakIntro}
          onClose={() => changeCurrentView('Story')}
        />
      )}
      {showWordPracticeIntro && (
        <IntroScreen
          variant='wordPractice'
          coverSrc={coverSrc}
          onStart={dismissWordPracticeIntro}
        />
      )}
    </SharedAppBackgroundBox>
  )
}

const SharedAppBackgroundBox = styled.div<{ $backgroundImage: string }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* 이미지 로드 전 한 프레임이라도 흰 화면이 비치지 않도록 */
  background-color: #1a1f28;
  background-image:
    url(${ASSETS.Common.glassWindow}), url(${(props) => props.$backgroundImage});
  background-size:
    auto 100%,
    auto 100%;
  background-position: right, center;
  background-repeat: no-repeat, repeat-x;
  transform: translateZ(0);
  isolation: isolate;
`

const ViewBox = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`

const ViewWrapper = styled.div<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /*
   * Safari: display none/block 전환 시 합성 레이어가 끊기며 번쩍이는 경우가 많음.
   * 스택만 바꿔 두 뷰의 레이어를 유지합니다.
   */
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  visibility: ${(p) => (p.$visible ? 'visible' : 'hidden')};
  pointer-events: ${(p) => (p.$visible ? 'auto' : 'none')};
  z-index: ${(p) => (p.$visible ? 1 : 0)};
  transform: translateZ(0);
`
