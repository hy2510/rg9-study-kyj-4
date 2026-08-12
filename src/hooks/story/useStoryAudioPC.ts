import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getStoredStoryPlaybackRate,
  getStoryAutoNextFromStorage,
  saveStoryReadModePartial,
  setStoryAutoNextInStorage,
} from '@src/constants/story/storyReadModeStorage'
import {
  PageProps,
  PageSequenceProps,
  PlayState,
} from '@src/interfaces/story/IStory'

type UseStoryAudioPCProps = {
  studyId: string
  studentHistoryId: string
  pageData: PageProps[]
  changeReadingComplete: () => Promise<void>
  /** true: 재생은 유지하되 볼륨 0 (NoAudio 프로필) */
  audioMuted: boolean
  /** true: 오른쪽 페이지 음원 종료 후 다음 스프레드로 자동 이동하지 않음(Speak 등) */
  disableSpreadAutoAdvance?: boolean
  /**
   * true: 첫 음원이 준비되면 자동 재생(스토리 인트로 시작 후 등).
   * false: 첫 로드 후 일시정지(Speak — 사용자가 재생 버튼으로 시작).
   */
  autoplayOnFirstLoad?: boolean
  /**
   * 책의 마지막 페이지 음원이 끝까지 재생되어 종료됐을 때 호출.
   * (자동 다음 이동 on/off 무관, Speak 모드 제외)
   */
  onLastPageEnded?: () => void
}

export default function useStoryAudioPC({
  pageData,
  changeReadingComplete,
  audioMuted,
  disableSpreadAutoAdvance = false,
  autoplayOnFirstLoad = true,
  onLastPageEnded,
}: UseStoryAudioPCProps) {
  const playerRef = useRef<HTMLAudioElement>(new Audio())
  const player = playerRef.current

  const [playState, setPlayState] = useState<PlayState>('')
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(() =>
    getStoredStoryPlaybackRate(),
  )
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSeq, setPageSeq] = useState<PageSequenceProps>({
    playPage: 1,
    sequence: 0,
  })

  // 이벤트 핸들러 내부에서 최신 상태를 참조하기 위한 ref
  const pageSeqRef = useRef(pageSeq)
  const pageNumberRef = useRef(pageNumber)
  const playbackRateRef = useRef(playbackRate)
  const isFirstRef = useRef(true)
  /** 자동 다음 스프레드 이동 — UI는 state, `ended` 콜백(빈 deps)에서는 ref로 최신값 참조 */
  const initialAutoNext = disableSpreadAutoAdvance
    ? false
    : getStoryAutoNextFromStorage()
  const [isAutoNext, setIsAutoNext] = useState(initialAutoNext)
  const isAutoNextRef = useRef(initialAutoNext)
  const audioMutedRef = useRef(audioMuted)
  const disableSpreadAutoAdvanceRef = useRef(disableSpreadAutoAdvance)
  const autoplayOnFirstLoadRef = useRef(autoplayOnFirstLoad)
  const onLastPageEndedRef = useRef(onLastPageEnded)

  useEffect(() => {
    onLastPageEndedRef.current = onLastPageEnded
  }, [onLastPageEnded])

  useEffect(() => {
    disableSpreadAutoAdvanceRef.current = disableSpreadAutoAdvance
  }, [disableSpreadAutoAdvance])

  useEffect(() => {
    autoplayOnFirstLoadRef.current = autoplayOnFirstLoad
  }, [autoplayOnFirstLoad])

  useEffect(() => {
    audioMutedRef.current = audioMuted
    player.volume = audioMuted ? 0 : 1
  }, [audioMuted])

  useEffect(() => {
    pageSeqRef.current = pageSeq
  }, [pageSeq])
  useEffect(() => {
    pageNumberRef.current = pageNumber
  }, [pageNumber])
  useEffect(() => {
    playbackRateRef.current = playbackRate
    player.playbackRate = playbackRate
  }, [playbackRate])

  // 음원 로드 (pageSeq 변경 시 호출)
  const loadAudio = (page: number, seq: number) => {
    const sentences = pageData.filter(
      (data) => data.Page === page && data.SoundPath !== '',
    )

    if (sentences.length === 0) {
      player.src = ''
      return
    }

    player.src = sentences[0].SoundPath
    player.playbackRate = playbackRateRef.current
    player.volume = audioMutedRef.current ? 0 : 1

    if (seq > 0 && sentences[seq - 1]) {
      player.currentTime = sentences[seq - 1].StartTime / 1000
    }
  }

  // 페이지 변경 시 재생 시작 페이지 결정
  useEffect(() => {
    const hasSound = pageData.some(
      (data) => data.Page === pageNumber && data.SoundPath,
    )
    setPageSeq({
      playPage: hasSound ? pageNumber : pageNumber + 1,
      sequence: 0,
    })
  }, [pageNumber])

  // pageSeq 변경 시 음원 로드
  useEffect(() => {
    loadAudio(pageSeq.playPage, pageSeq.sequence)
  }, [pageSeq])

  // 이벤트 리스너 등록 (마운트 시 한 번만)
  useEffect(() => {
    const handleCanPlayThrough = () => {
      if (isFirstRef.current) {
        isFirstRef.current = false
        if (autoplayOnFirstLoadRef.current) {
          void player.play().then(
            () => setPlayState('play'),
            () => setPlayState('pause'),
          )
        } else {
          player.pause()
          setPlayState('pause')
        }
      } else {
        player.play()
        setPlayState('play')
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(player.currentTime)
    }

    const handleEnded = () => {
      const { playPage } = pageSeqRef.current
      const currentPageNumber = pageNumberRef.current

      if (playPage % 2 === 1) {
        // 왼쪽 페이지 종료 → 오른쪽 페이지로
        setPageSeq({ playPage: playPage + 1, sequence: 0 })
      } else {
        // 오른쪽 페이지 종료
        if (disableSpreadAutoAdvanceRef.current) {
          setPlayState('')
          return
        }

        const nextPageNumber = currentPageNumber + 2
        const hasNextPage = pageData.some(
          (data) => data.Page === nextPageNumber,
        )

        if (!hasNextPage) {
          // 마지막 페이지 음원 종료 → 완료 처리 (자동 이동 on/off 무관)
          setPlayState('')
          if (onLastPageEndedRef.current) {
            onLastPageEndedRef.current()
          } else {
            changeReadingComplete()
          }
          return
        }

        if (!isAutoNextRef.current) {
          setPlayState('')
          return
        }

        setPageNumber(nextPageNumber)
      }
    }

    player.addEventListener('canplaythrough', handleCanPlayThrough)
    player.addEventListener('timeupdate', handleTimeUpdate)
    player.addEventListener('ended', handleEnded)

    return () => {
      player.removeEventListener('canplaythrough', handleCanPlayThrough)
      player.removeEventListener('timeupdate', handleTimeUpdate)
      player.removeEventListener('ended', handleEnded)
      player.pause()
      player.src = ''
    }
  }, [])

  const play = () => {
    player.play()
    setPlayState('play')
  }

  const pause = () => {
    player.pause()
    setPlayState('pause')
  }

  const stop = () => {
    player.pause()
    player.src = ''
    player.currentTime = 0
    setPlayState('')
  }

  const changePageNumber = useCallback((page: number) => {
    if (page === 1) setPlayState('')
    setPageNumber(page)
  }, [])

  const changeDuration = useCallback((page: number, seq: number) => {
    setPageSeq({ playPage: page, sequence: seq })
  }, [])

  const changePlaySpeed = (speed: number) => {
    setPlaybackRate(speed)
    saveStoryReadModePartial({ playbackRate: speed })
  }

  const changeVolume = (volume: number) => {
    player.muted = volume === 0
    player.volume = volume
  }

  const changeAutoNextPage = (next: boolean) => {
    if (disableSpreadAutoAdvanceRef.current) return
    isAutoNextRef.current = next
    setIsAutoNext(next)
    setStoryAutoNextInStorage(next)
  }

  return {
    pageNumber,
    playState,
    pageSeq,
    currentTime,
    isAutoNext,
    playbackRate,
    play,
    pause,
    stop,
    changePageNumber,
    changeDuration,
    changePlaySpeed,
    changeVolume,
    changeAutoNextPage,
  }
}
