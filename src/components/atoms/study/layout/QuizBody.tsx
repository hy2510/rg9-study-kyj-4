import { forwardRef, useEffect, useState } from 'react'

import { BREAKPOINT_MOBILE_MAX, media } from '@styles/tokens/breakpoints'
import styled, { css } from 'styled-components'

export const QUIZ_BODY_MAX_HEIGHT_OFFSET_PX = 120
export const QUIZ_BODY_MAX_HEIGHT_OFFSET_MOBILE_PX = 112

function getViewportHeight(fallback = 800): number {
  if (typeof window === 'undefined') return fallback
  return window.visualViewport?.height ?? window.innerHeight
}

function getViewportWidth(fallback = 800): number {
  if (typeof window === 'undefined') return fallback
  return window.visualViewport?.width ?? window.innerWidth
}

export function calcQuizBodyMaxHeightPx(
  viewportHeight: number,
  offsetPx = QUIZ_BODY_MAX_HEIGHT_OFFSET_PX,
): number {
  return Math.max(0, viewportHeight - offsetPx)
}

function useQuizBodyMaxHeightPx() {
  const [viewportHeight, setViewportHeight] = useState(getViewportHeight)
  const [viewportWidth, setViewportWidth] = useState(getViewportWidth)

  useEffect(() => {
    const update = () => {
      setViewportHeight(getViewportHeight())
      setViewportWidth(getViewportWidth())
    }

    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)

    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [])

  const offsetPx =
    viewportWidth <= BREAKPOINT_MOBILE_MAX
      ? QUIZ_BODY_MAX_HEIGHT_OFFSET_MOBILE_PX
      : QUIZ_BODY_MAX_HEIGHT_OFFSET_PX

  return calcQuizBodyMaxHeightPx(viewportHeight, offsetPx)
}

type QuizBodyProps = React.ComponentPropsWithoutRef<'div'> & {
  $maxHeightPx?: number | null
  $flexWrap?: boolean
  $fillToMaxHeight?: boolean
}

const StyledQuizBody = styled.div<{
  $maxHeightPx?: number | null
  $flexWrap?: boolean
  $fillToMaxHeight?: boolean
}>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 50px;
  padding-top: 25px;
  box-sizing: border-box;

  ${media.tablet} {
    padding: 28px 24px;
  }

  ${media.mobile} {
    padding: 16px 12px;
    gap: 12px;
  }

  ${({ $flexWrap }) =>
    $flexWrap &&
    css`
      flex-wrap: wrap;
    `}

  ${({ $maxHeightPx, $fillToMaxHeight }) =>
    $maxHeightPx != null &&
    css`
      max-height: ${$maxHeightPx}px;
      overflow-y: auto;

      ${$fillToMaxHeight &&
      css`
        ${media.mobile} {
          height: ${$maxHeightPx}px;
          overflow: hidden;
        }
      `}
    `}
`

export const QuizBody = forwardRef<HTMLDivElement, QuizBodyProps>(
  function QuizBody({ $maxHeightPx, $flexWrap, $fillToMaxHeight, ...rest }, ref) {
    const viewportMaxHeightPx = useQuizBodyMaxHeightPx()
    const cap =
      $maxHeightPx === null
        ? null
        : $maxHeightPx !== undefined
          ? $maxHeightPx
          : viewportMaxHeightPx

    return (
      <StyledQuizBody
        ref={ref}
        $flexWrap={$flexWrap}
        $maxHeightPx={cap}
        $fillToMaxHeight={$fillToMaxHeight}
        {...rest}
      />
    )
  },
)
