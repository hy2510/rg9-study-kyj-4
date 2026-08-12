import { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { media } from '@styles/tokens/breakpoints'
import styled from 'styled-components'

import CenteredLoading from '@components/atoms/common/CenteredLoading'
import WordPracticeHeader from '@components/organisms/common/WordPracticeHeader'
import WordPracticeActivityStage from '@components/organisms/study/common/WordPracticeActivityStage'
import {
  StoryBodyWrapper,
  StoryViewWrapper,
} from '@components/templates/story/StoryLayout'
import WordPracticeTrackA from '@components/templates/study/word-practice/WordPracticeTrackA'
import WordPracticeTrackB from '@components/templates/study/word-practice/WordPracticeTrackB'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import type { WordMeaningPracticeItem } from '@interfaces/study/word-practice/wordMeaningPractice'
import type {
  WordPracticeContentItem,
  WordPracticeQuizItem,
} from '@interfaces/study/word-practice/wordPractice'
import { getWordPracticeQuiz } from '@services/wordApi'
import {
  resolveActiveWordPracticeLevel,
  type WordPracticeStepItemCounts,
} from '@src/constants/study/word-practice/wordPracticeDevEntry'
import {
  getWordPracticeTrack,
  resolveWordPracticeLevel,
  type WordPracticeLevelCode,
} from '@src/constants/study/word-practice/wordPracticeLevels'
import {
  WORD_PRACTICE_B_QUESTIONS_PER_STEP,
  WORD_PRACTICE_B_SESSION_TOTAL,
} from '@src/constants/study/word-practice/wordPracticeTrackBConfig'

type WordPracticeLanguage = 'ko' | 'zh' | 'ja' | 'vi' | 'id' | 'en'

const LANGUAGE_FIELD_MAP: Record<WordPracticeLanguage, keyof WordPracticeQuizItem> = {
  ko: 'Korean',
  zh: 'Chinese',
  ja: 'Japanese',
  vi: 'Vietnamese',
  id: 'Indonesian',
  en: 'English',
}

function getMeaning(item: WordPracticeQuizItem, language: string): string {
  const field = LANGUAGE_FIELD_MAP[language as WordPracticeLanguage]
  return field ? String(item[field] ?? '') : item.Korean
}

export default function WordPracticeContainer() {
  const { bookInfo, studyInfo } = useContext(AppContext) as AppContextProps
  const language: string = (window as Window & { REF?: { language?: string } }).REF?.language ?? 'ko'

  const [quizItems, setQuizItems] = useState<WordPracticeQuizItem[]>([])
  const [quizLoading, setQuizLoading] = useState(true)
  const [quizError, setQuizError] = useState<Error | undefined>()

  useEffect(() => {
    getWordPracticeQuiz(studyInfo.bookType, bookInfo.BookLevel)
      .then((items) => {
        setQuizItems(items)
        setQuizLoading(false)
      })
      .catch((err) => {
        setQuizError(err instanceof Error ? err : new Error(String(err)))
        setQuizLoading(false)
      })
  }, [bookInfo.BookLevel, studyInfo.bookType])

  const activeLevel: WordPracticeLevelCode = useMemo(() => {
    const bookLevel = bookInfo.BookLevel?.toLowerCase()
    if (bookLevel) return resolveWordPracticeLevel(bookLevel)
    return resolveActiveWordPracticeLevel()
  }, [bookInfo.BookLevel])

  const track = getWordPracticeTrack(activeLevel)

  const { trackAItems, trackBItems } = useMemo(() => {
    if (track === 'a') {
      return {
        trackAItems: quizItems.map((item) => ({
          wordId: item.WordId,
          image: item.ImagePath,
          word: item.Word,
          sound: item.SoundPath,
        })),
        trackBItems: [] as WordMeaningPracticeItem[],
      }
    }
    return {
      trackAItems: [] as WordPracticeContentItem[],
        trackBItems: quizItems.map((item) => ({
          wordId: item.WordId,
          word: item.Word,
          meaning: getMeaning(item, language),
          sound: item.SoundPath,
        })),
    }
  }, [quizItems, track, language])

  const stepItemCounts: WordPracticeStepItemCounts = useMemo(
    () => ({
      practice1: trackAItems.length,
      practice2: trackAItems.length,
      practice3: trackAItems.length,
      practice4: trackAItems.length,
      practice5: trackAItems.length,
      practice6: trackAItems.length,
      practiceB1: WORD_PRACTICE_B_QUESTIONS_PER_STEP,
      practiceB2: WORD_PRACTICE_B_QUESTIONS_PER_STEP,
      practiceB3: WORD_PRACTICE_B_QUESTIONS_PER_STEP,
      practiceB4: WORD_PRACTICE_B_QUESTIONS_PER_STEP,
    }),
    [trackAItems.length],
  )

  const defaultProgress = useMemo(
    () => ({
      current: 1,
      total:
        track === 'a' ? trackAItems.length * 6 : WORD_PRACTICE_B_SESSION_TOTAL,
    }),
    [track, trackAItems.length],
  )

  const [sessionProgress, setSessionProgress] = useState(defaultProgress)

  useEffect(() => {
    setSessionProgress(defaultProgress)
  }, [activeLevel, defaultProgress])

  const handleSessionProgressChange = useCallback(
    (progress: { current: number; total: number }) => {
      setSessionProgress(progress)
    },
    [],
  )

  if (quizLoading) return <CenteredLoading fillViewport />
  if (quizError) return <div>Error: {quizError.message}</div>

  return (
    <StoryViewWrapper>
      <WordPracticeHeader
        progress={sessionProgress.current}
        total={sessionProgress.total}
      />
      <StoryBodyWrapper>
        <PracticeContent>
          <WordPracticeActivityStage>
            {track === 'a' ? (
              <WordPracticeTrackA
                key={activeLevel}
                level={activeLevel}
                items={trackAItems}
                stepItemCounts={stepItemCounts}
                onSessionProgressChange={handleSessionProgressChange}
              />
            ) : (
              <WordPracticeTrackB
                key={activeLevel}
                level={activeLevel}
                items={trackBItems}
                stepItemCounts={stepItemCounts}
                onSessionProgressChange={handleSessionProgressChange}
              />
            )}
          </WordPracticeActivityStage>
        </PracticeContent>
      </StoryBodyWrapper>
    </StoryViewWrapper>
  )
}

const PracticeContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 100%;

  ${media.mobile} {
    box-sizing: border-box;
  }
`
