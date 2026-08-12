import { useRef } from 'react'

/** `StoryPC` BookSwipePane과 동일 기준 — 가로 스와이프는 문장 탭으로 처리하지 않음 */
const STORY_SWIPE_MIN_PX = 44
const STORY_SWIPE_DOMINANCE = 1.05

type SentenceProps = {
  pageNumber: number
  sentence: string
  sequence: number
  marginTop: number
  marginLeft: number
  clickSentence: (page: number, sequence: number) => void
}

export default function Sentence({
  pageNumber,
  sentence,
  sequence,
  marginTop,
  marginLeft,
  clickSentence,
}: SentenceProps) {
  const touchStartRef = useRef<{
    x: number
    y: number
    id: number
  } | null>(null)

  const convertSentence = (sentence: string) => {
    const sentenceIDReg = /id="t/g

    let convertedSentence = sentence.replace(
      sentenceIDReg,
      `id="t_${pageNumber}_`,
    )

    if (sequence !== 999) {
      const clickStr = / id="t/g

      convertedSentence = convertedSentence.replace(
        clickStr,
        ` style='margin-top: ${marginTop}px; margin-left: ${marginLeft}px; cursor:pointer;' id="t`,
      )
    } else {
      const seqStr = / id="t/g

      convertedSentence = convertedSentence.replace(
        seqStr,
        ` style='margin-top: ${marginTop}px; margin-left: ${marginLeft}px;' id="t`,
      )
    }

    return convertedSentence
  }

  const onClickHandler = () => {
    if (sequence !== 999) clickSentence(pageNumber, sequence)
  }

  const onTouchStartHandler = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return
    const t = e.touches[0]
    touchStartRef.current = { x: t.clientX, y: t.clientY, id: t.identifier }
  }

  const onTouchCancelHandler = () => {
    touchStartRef.current = null
  }

  const onTouchEndHandler = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current
    touchStartRef.current = null
    if (!start || e.changedTouches.length === 0) return

    const t = Array.from(e.changedTouches).find(
      (c) => c.identifier === start.id,
    )
    if (!t) return

    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    const isBookSwipe =
      absDx >= STORY_SWIPE_MIN_PX && absDx > absDy * STORY_SWIPE_DOMINANCE

    if (isBookSwipe) {
      return
    }

    if (sequence !== 999) {
      e.preventDefault()
      onClickHandler()
    }
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: convertSentence(sentence) }}
      onClick={onClickHandler}
      onTouchStart={onTouchStartHandler}
      onTouchCancel={onTouchCancelHandler}
      onTouchEnd={onTouchEndHandler}
    />
  )
}
