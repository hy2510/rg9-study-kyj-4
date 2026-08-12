import { useMemo } from 'react'

import styled from 'styled-components'

import HighlightSentence from '@components/molecules/story/HighlightSentence'
import Sentence from '@components/molecules/story/Sentence'
import { useStoryPageBackgroundReady } from '@hooks/story/useStoryPageBackgroundReady'
import { STORY_PAGE_REF_HEIGHT_PX } from '@src/constants/story/storyLayout'
import { PageProps, PageSequenceProps } from '@src/interfaces/story/IStory'

export type StoryPageViewProps = {
  pageNumber: number
  imageSrc: string
  /** 7th: K → 480px, 그 외 525px — text_wrapper width */
  pageDesignWidth: number
  storyData: PageProps[]
  isTextShow: boolean
  pageSeq: PageSequenceProps
  currentTime: number
  isHighlight: boolean
  clickSentence: (page: number, sequence: number) => void
}

/**
 * 7th common/StoryPage + e-book.module.scss `.ebook_page .text_wrapper`:
 * - 높이 750px, 폭 bookLevel에 따라 480/525
 * - background-size: auto 750px (이미지는 높이 750 기준)
 * - `.t { transform: scale(0.25) }` — 문장 데이터 좌표계는 7th 설계와 동일
 */
export default function StoryPage({
  pageNumber,
  imageSrc,
  pageDesignWidth,
  storyData,
  isTextShow,
  pageSeq,
  currentTime,
  isHighlight,
  clickSentence,
}: StoryPageViewProps) {
  const css = useMemo(() => {
    const pageMeta = storyData.find(
      (data) => data.Page === pageNumber && data.Sequence === 999,
    )
    if (!pageMeta?.Css) return ''
    return pageMeta.Css.replace(/#t/g, `#t_${pageNumber}_`)
  }, [pageNumber, storyData])

  const imageReady = useStoryPageBackgroundReady(imageSrc)

  const sentencesData = useMemo(
    () => storyData.filter((data) => data.Page === pageNumber),
    [pageNumber, storyData],
  )

  return (
    <EbookPage>
      <TextWrapper
        $width={pageDesignWidth}
        $height={STORY_PAGE_REF_HEIGHT_PX}
        $imageUrl={imageSrc}
        $imageReady={imageReady}
      >
        {css && <div dangerouslySetInnerHTML={{ __html: css }} />}

        {isTextShow &&
          sentencesData.map((data) => {
            const isCurrentHighlight =
              pageSeq.playPage === pageNumber &&
              data.Sequence !== 999 &&
              currentTime >= data.StartTime / 1000 &&
              currentTime <= data.EndTime / 1000 &&
              isHighlight

            if (isCurrentHighlight) {
              return (
                <HighlightSentence
                  key={`${pageNumber}-${data.Sequence}`}
                  pageNumber={pageNumber}
                  sequence={data.Sequence}
                  sentence={data.Contents}
                  marginTop={data.MarginTop}
                  marginLeft={data.MarginLeft}
                  color={data.FontColor}
                  clickSentence={clickSentence}
                />
              )
            }

            return (
              <Sentence
                key={`${pageNumber}-${data.Sequence}`}
                pageNumber={pageNumber}
                sequence={data.Sequence}
                sentence={data.Contents}
                marginTop={data.MarginTop}
                marginLeft={data.MarginLeft}
                clickSentence={clickSentence}
              />
            )
          })}
      </TextWrapper>
    </EbookPage>
  )
}

const EbookPage = styled.div`
  position: relative;
  letter-spacing: 0;
  flex-shrink: 0;
`

const TextWrapper = styled.div<{
  $width: number
  $height: number
  $imageUrl: string
  $imageReady: boolean
}>`
  position: relative;
  width: ${({ $width }) => $width}px;
  height: ${({ $height }) => $height}px;
  background-image: ${({ $imageReady, $imageUrl }) =>
    $imageReady ? `url(${$imageUrl})` : 'none'};
  background-color: #fff;
  background-repeat: no-repeat;
  background-position: center;
  background-size: auto ${({ $height }) => $height}px;
  flex-shrink: 0;
  overflow: hidden;

  /* 7th .ebook_page .ebook_page .text_wrapper 내 .t — 고정 0.25 (설계 750px 기준) */
  & .t {
    position: absolute;
    transform-origin: top left;
    line-height: 1;
    transform: scale(0.25);
    z-index: 2;
    white-space: nowrap;
  }
`
