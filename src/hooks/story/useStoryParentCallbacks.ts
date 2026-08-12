import { useEffect, useRef } from 'react'

import { getProgressPageForParent } from '@utils/story/storyPCHelpers'

type UseStoryParentCallbacksArgs = {
  /** 외부에서 책 오디오를 일시정지할 수 있도록 등록 */
  onRegisterPause?: (pause: () => void) => void
  pause: () => void

  /** 외부에서 책 오디오를 완전 정지(src 비우기 포함) 할 수 있도록 등록 */
  onRegisterStop?: (stop: () => void) => void
  stop: () => void

  /** 뷰가 숨겨지거나 무비 팝업이 열릴 때 자동 일시정지 */
  isVisible: boolean
  isMovieShow: boolean

  /** 진행률 변경 콜백 */
  onPageNumberChange?: (page: number) => void
  uniquePages: { Page: number }[]
  pageNumber: number
  singlePagePortrait: boolean
  spreadHalf: 0 | 1

  /** Auto-next 토글 상태 변경 콜백 + 토글 함수 등록 */
  onAutoNextChange?: (autoNext: boolean) => void
  isAutoNext: boolean
  onRegisterChangeAutoNextPage?: (toggle: (next: boolean) => void) => void
  changeAutoNextPage: (next: boolean) => void

  /** 재생 속도 변경 콜백 + 변경 함수 등록 */
  onPlaybackRateChange?: (rate: number) => void
  playbackRate: number
  onRegisterChangePlaybackRate?: (changeSpeed: (rate: number) => void) => void
  changePlaySpeed: (rate: number) => void
}

/**
 * `StoryPC` ↔ 부모 컨테이너 사이의 콜백/등록 효과를 한 곳에 모아 관리.
 * - pause 함수 등록
 * - 페이지 변경 시 부모 진행률 콜백 호출
 * - autoNext / playbackRate 상태 변화 콜백 + 토글/변경 함수 등록
 * - 뷰 숨김 / 무비 팝업 열림 시 자동 일시정지
 */
export default function useStoryParentCallbacks({
  onRegisterPause,
  pause,
  onRegisterStop,
  stop,
  isVisible,
  isMovieShow,
  onPageNumberChange,
  uniquePages,
  pageNumber,
  singlePagePortrait,
  spreadHalf,
  onAutoNextChange,
  isAutoNext,
  onRegisterChangeAutoNextPage,
  changeAutoNextPage,
  onPlaybackRateChange,
  playbackRate,
  onRegisterChangePlaybackRate,
  changePlaySpeed,
}: UseStoryParentCallbacksArgs) {
  // 뷰가 숨겨지거나 무비 팝업이 열릴 때 자동 일시정지
  useEffect(() => {
    if (!isVisible || isMovieShow) pause()
  }, [isVisible, isMovieShow])

  // 부모에게 pause 함수 등록
  useEffect(() => {
    onRegisterPause?.(pause)
  }, [onRegisterPause])

  // 부모에게 stop 함수 등록
  useEffect(() => {
    onRegisterStop?.(stop)
  }, [onRegisterStop])

  // 페이지 변경 → 부모 진행률 콜백 (최신 콜백을 ref로 보존)
  const onPageNumberChangeRef = useRef(onPageNumberChange)
  useEffect(() => {
    onPageNumberChangeRef.current = onPageNumberChange
  }, [onPageNumberChange])

  useEffect(() => {
    onPageNumberChangeRef.current?.(
      getProgressPageForParent(
        uniquePages,
        pageNumber,
        singlePagePortrait,
        spreadHalf,
      ),
    )
  }, [pageNumber, spreadHalf, singlePagePortrait, uniquePages])

  // autoNext 상태 변화 콜백 + 토글 함수 등록
  const onAutoNextChangeRef = useRef(onAutoNextChange)
  useEffect(() => {
    onAutoNextChangeRef.current = onAutoNextChange
  }, [onAutoNextChange])

  useEffect(() => {
    onAutoNextChangeRef.current?.(isAutoNext)
  }, [isAutoNext])

  useEffect(() => {
    onRegisterChangeAutoNextPage?.(changeAutoNextPage)
  }, [onRegisterChangeAutoNextPage, changeAutoNextPage])

  // playbackRate 상태 변화 콜백 + 변경 함수 등록
  const onPlaybackRateChangeRef = useRef(onPlaybackRateChange)
  useEffect(() => {
    onPlaybackRateChangeRef.current = onPlaybackRateChange
  }, [onPlaybackRateChange])

  useEffect(() => {
    onPlaybackRateChangeRef.current?.(playbackRate)
  }, [playbackRate])

  useEffect(() => {
    onRegisterChangePlaybackRate?.(changePlaySpeed)
  }, [onRegisterChangePlaybackRate, changePlaySpeed])
}
