import { type ReactNode, useCallback, useMemo, useState } from 'react'

import { quizContainerShake } from '@styles/tokens/animations'
import { media } from '@styles/tokens/breakpoints'
import styled, { css } from 'styled-components'

import {
  ActivityStageFooterProvider,
  useActivityStageFooterOptional,
} from '@contexts/ActivityStageFooterContext'
import { QuizContainerShakeContext } from '@hooks/study/useQuizContainerShake'
import { useQuizContainerWidthScale } from '@hooks/study/useQuizContainerWidthScale'

type WordPracticeActivityStageProps = {
  children: ReactNode
  extras?: ReactNode
}

export default function WordPracticeActivityStage({
  children,
  extras,
}: WordPracticeActivityStageProps) {
  const contentScale = useQuizContainerWidthScale()
  return (
    <ActivityStageFooterProvider>
      <WordPracticeActivityStageInner
        contentScale={contentScale}
        extras={extras}
      >
        {children}
      </WordPracticeActivityStageInner>
    </ActivityStageFooterProvider>
  )
}

function WordPracticeActivityStageInner({
  children,
  extras,
  contentScale,
}: {
  children: ReactNode
  extras?: ReactNode
  contentScale: number
}) {
  const footerContext = useActivityStageFooterOptional()
  const footer = footerContext?.footer ?? null
  const [isShaking, setIsShaking] = useState(false)

  const triggerShake = useCallback(() => {
    setIsShaking(false)
    window.requestAnimationFrame(() => {
      setIsShaking(true)
    })
  }, [])

  const handleShakeEnd = useCallback(() => {
    setIsShaking(false)
  }, [])

  const shakeContextValue = useMemo(() => ({ triggerShake }), [triggerShake])

  return (
    <StageWrapper $mobileFooter={!!footer}>
      <StageContent $scale={contentScale} $mobileFooter={!!footer}>
        <StagePanel
          $mobileFooter={!!footer}
          $isShaking={isShaking}
          onAnimationEnd={isShaking ? handleShakeEnd : undefined}
        >
          <QuizContainerShakeContext.Provider value={shakeContextValue}>
            <StageBody>{children}</StageBody>
          </QuizContainerShakeContext.Provider>
        </StagePanel>
      </StageContent>
      {footer ? <StageFooter>{footer}</StageFooter> : null}
      {extras}
    </StageWrapper>
  )
}

const StageWrapper = styled.div<{ $mobileFooter?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: 0 16px;
  box-sizing: border-box;

  ${media.mobile} {
    padding: 0 8px;
  }

  ${({ $mobileFooter }) =>
    $mobileFooter &&
    css`
      ${media.mobile} {
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        min-height: 0;
      }
    `}
`

const StageFooter = styled.div`
  display: none;
  width: 100%;
  flex: 0 0 auto;
  box-sizing: border-box;

  ${media.mobile} {
    display: block;
    margin-bottom: calc(50px + env(safe-area-inset-bottom, 0px));
  }
`

const StageContent = styled.div<{
  $scale: number
  $mobileFooter?: boolean
}>`
  transform: scale(${(p) => p.$scale});
  transform-origin: center center;
  width: 100%;
  max-width: 900px;

  ${media.mobile} {
    transform: none;
    max-width: none;
  }

  ${({ $mobileFooter }) =>
    $mobileFooter &&
    css`
      ${media.mobile} {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
      }
    `}
`

const StagePanel = styled.div<{
  $isShaking?: boolean
  $mobileFooter?: boolean
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 0 0 auto;
  min-width: 900px;
  min-height: 100px;
  background-color: rgba(255, 255, 255, 0.9);
  -webkit-backdrop-filter: blur(3px);
  backdrop-filter: blur(3px);
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 30px;
  box-sizing: border-box;

  ${media.tablet} {
    min-width: 0;
    border-radius: 20px;
    border-width: 2px;
  }

  ${media.mobile} {
    border-radius: 16px;
  }

  ${({ $mobileFooter }) =>
    $mobileFooter &&
    css`
      ${media.mobile} {
        margin-top: 80px;
      }
    `}

  ${({ $isShaking }) =>
    $isShaking &&
    css`
      animation: ${quizContainerShake} 0.35s ease-out;
    `}
`

const StageBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;

  ${media.mobile} {
    gap: 16px;
  }
`
