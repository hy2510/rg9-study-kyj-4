import { useEffect, useState } from 'react'

import { BREAKPOINT_MOBILE_MAX } from '@styles/tokens/breakpoints'

export const QUIZ_CONTAINER_BASE_WIDTH = 1920
export const QUIZ_CONTAINER_DESIGN_WIDTH = 900

export const QUIZ_CONTAINER_MIN_SCALE = 0.92
export const QUIZ_CONTAINER_MAX_SCALE = 1.05

function getViewportWidth(fallback = QUIZ_CONTAINER_BASE_WIDTH): number {
  if (typeof window === 'undefined') return fallback
  return window.visualViewport?.width ?? window.innerWidth
}

export function calcQuizContainerWidthScale(
  viewportWidth: number,
  baseWidth = QUIZ_CONTAINER_BASE_WIDTH,
  designWidth = QUIZ_CONTAINER_DESIGN_WIDTH,
  minScale = QUIZ_CONTAINER_MIN_SCALE,
  maxScale = QUIZ_CONTAINER_MAX_SCALE,
): number {
  if (viewportWidth <= BREAKPOINT_MOBILE_MAX) {
    return 1
  }

  if (viewportWidth >= baseWidth) {
    return Math.max(minScale, Math.min(viewportWidth / baseWidth, maxScale))
  }

  if (viewportWidth >= designWidth) {
    return 1
  }

  return Math.max(minScale, viewportWidth / designWidth)
}

/**
 * 퀴즈 컨테이너 가로 scale.
 * - 모바일(≤767px): 1 (유동 레이아웃)
 * - 768~900px: design width 기준 축소
 * - 900~1920px: 1
 * - 1920px 초과: 확대 (최대 1.05)
 */
export function useQuizContainerWidthScale() {
  const [viewportWidth, setViewportWidth] = useState(getViewportWidth)

  useEffect(() => {
    const update = () => setViewportWidth(getViewportWidth())

    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)

    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [])

  return calcQuizContainerWidthScale(viewportWidth)
}
