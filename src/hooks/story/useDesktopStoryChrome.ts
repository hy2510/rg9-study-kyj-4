import { useEffect, useState } from 'react'

/**
 * 스토리 “데스크톱 크롬”(헤더 화살표·탭 등): **마우스 등 fine 포인터 + 호버 가능**일 때만 true.
 * 터치 중심 기기(`pointer: coarse`, 터치만 가능한 화면)는 뷰포트 너비와 무관하게 모바일 레이아웃.
 * `useMobileStoryPortrait` 등과 동일 조건을 쓰려면 이 상수를 import 하세요.
 */
export const DESKTOP_STORY_CHROME_MEDIA = '(hover: hover) and (pointer: fine)'

export function useDesktopStoryChrome(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(DESKTOP_STORY_CHROME_MEDIA).matches
      : true,
  )

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_STORY_CHROME_MEDIA)
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return isDesktop
}
