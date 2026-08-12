import React, { useEffect, useState } from 'react'

import CenteredLoading from '@components/atoms/common/CenteredLoading'
import { getBookInfo, getStudyInfo } from '@services/studyApi'
import { BookInfo } from '@src/interfaces/common/IBookInfo'
import { BookType, Mode, StudyEntryType } from '@src/interfaces/common/Types'
import { IStudyInfo } from '@src/interfaces/study/IStudyInfo'

interface AppContextDataProps {
  studyInfo: IStudyInfo
  bookInfo: BookInfo
}

export interface AppContextProps extends AppContextDataProps {
  handler: {
    finishStudy: { id: number; cause: string | undefined }
    actionFinishStudy: (
      finishStudyInfo: { id: number; cause: string | undefined },
      character: string,
    ) => void
    clearFinishStudyState: () => void
    markPreferenceSubmitted: () => void
    markReadingCompletedEB: () => void
  }
}

export const AppContext = React.createContext<AppContextProps | undefined>(
  undefined,
)

export default function AppContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | undefined>()
  const [contextInfo, setContextInfo] = useState<AppContextDataProps>()
  const [finishStudy, setFinishStudy] = useState<{
    id: number
    cause: string | undefined
  }>({
    id: 0,
    cause: undefined,
  })

  useEffect(() => {
    initialize()
      .then((response) => {
        setContextInfo(response)
        setLoading(false)
      })
      .catch((error) => {
        setError(error)
      })
  }, [])

  if (error) {
    return <div>Error: {error.message}</div>
  } else if (loading) {
    return <CenteredLoading fillViewport />
  }

  const contextHandler = {
    finishStudy: { ...finishStudy },
    actionFinishStudy: (
      finishStudyInfo: { id: number; cause: string | undefined },
      character: string,
    ) => {
      try {
        window.onFinishStudyResult(
          finishStudyInfo.id,
          finishStudyInfo.cause,
          character,
        )
      } catch (e) {
        location.replace('/')
      }
    },
    clearFinishStudyState: () => {
      setFinishStudy({ id: 0, cause: undefined })
    },
    markPreferenceSubmitted: () => {
      setContextInfo((prev) => {
        if (!prev) return prev
        if (prev.studyInfo.isSubmitPreference) return prev
        return {
          ...prev,
          studyInfo: {
            ...prev.studyInfo,
            isSubmitPreference: true,
          },
        }
      })
    },
    markReadingCompletedEB: () => {
      setContextInfo((prev) => {
        if (!prev) return prev
        if (prev.bookInfo.ReadingCompletedEB === 'Y') return prev
        return {
          ...prev,
          bookInfo: {
            ...prev.bookInfo,
            ReadingCompletedEB: 'Y',
          },
        }
      })
    },
  }

  const contextValue = {
    ...contextInfo!,
    handler: { ...contextHandler },
  }

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  )
}

function initialize(): Promise<AppContextDataProps> {
  return new Promise((resolve, reject) => {
    if (window) {
      const REF = (window as any).REF

      if (REF.isStartWordPractice === true) {
        resolve(buildWordPracticeContext(REF))
        return
      }

      const studyId = REF.StudyId
      const studentHistoryId = REF.StudentHistoryId
      const bookType = REF.BookType as BookType
      const levelRoundId = REF.LevelRoundId
      const token = REF.Token
      const isDev = REF.isDev === undefined ? false : true
      const studyMode = REF.User
      const isStartWordPractice = REF.isStartWordPractice ?? false
      const isStartSpeak = REF.isStartSpeak ?? false

      appContextData(
        studyId,
        studentHistoryId,
        bookType,
        levelRoundId,
        token,
        isDev,
        studyMode,
        isStartWordPractice,
        isStartSpeak,
      )
        .then((response) => resolve(response))
        .catch((error) => {
          reject(new Error(error.message))
        })
    } else {
      reject(new Error('Null Data'))
    }
  })
}

function buildWordPracticeContext(REF: any): AppContextDataProps {
  const studyInfo: IStudyInfo = {
    studyId: '',
    studentHistoryId: '',
    bookType: (REF.BookType as BookType) ?? 'PB',
    mode: REF.User ?? 'student',
    token: '',
    isDev: false,
    isStartWordPractice: true,
    isStartSpeak: false,
    allSteps: [],
    openSteps: [],
    mappedStepActivity: [],
    startStep: 0,
    availableQuizStatus: 0,
    isSubmitPreference: false,
    isSuper: false,
    isQuizLearning: false,
    isEbAnotherSizeYn: false,
    bookmarkPage: 0,
    pbookStorySoundPath: undefined,
    studyEntryType: 'legacy',
    isReview: false,
  }

  const bookInfo = {
    BookLevel: (REF.level as string) ?? '',
  } as BookInfo

  return { studyInfo, bookInfo }
}

async function appContextData(
  studyId: string,
  studentHistoryId: string,
  bookType: BookType,
  levelRoundId: string,
  token: string,
  isDev: boolean,
  mode: 'student' | 'staff' | 'preview',
  isStartWordPractice: boolean,
  isStartSpeak: boolean,
): Promise<AppContextDataProps> {
  try {
    const responseStudyInfo = await requestStudyInfo(
      studyId,
      studentHistoryId,
      bookType as string,
    )

    if (responseStudyInfo) {
      const isSuper = responseStudyInfo.isSuper
      const isSubmitPreference = responseStudyInfo.isSubmitPreference
      const allSteps = responseStudyInfo.allSteps
      const openSteps = responseStudyInfo.openSteps
      const mappedStepActivity = responseStudyInfo.mappedStepActivity
      const isQuizLearning = responseStudyInfo.isQuizLearning
      const startStep = responseStudyInfo.startStep
      const availableQuizStatus = responseStudyInfo.availableQuizStatus
      const studyMode: Mode = mode
      const bookmarkPage = responseStudyInfo.bookmarkPage
      const pbookStorySoundPath = responseStudyInfo.pbookStorySoundPath
      const isEbAnotherSizeYn = responseStudyInfo.isEbAnotherSizeYn ?? false
      const studyEntryType: StudyEntryType = 'legacy'
      const isReview = responseStudyInfo.isReview ?? false

      const studyInfo = {
        studyId,
        studentHistoryId,
        bookType,
        mode: studyMode,
        isSuper,
        isSubmitPreference,
        allSteps: [...allSteps],
        openSteps: [...openSteps],
        mappedStepActivity: [...mappedStepActivity],
        isQuizLearning,
        startStep,
        availableQuizStatus,
        token,
        isDev,
        isEbAnotherSizeYn,
        bookmarkPage,
        pbookStorySoundPath,
        studyEntryType,
        isReview,
        isStartWordPractice,
        isStartSpeak,
      }

      const responseBookInfo = await requestBookInfo(
        studyId,
        studentHistoryId,
        levelRoundId,
      )
      const bookInfo = { ...responseBookInfo }

      return {
        studyInfo,
        bookInfo,
      }
    } else {
      throw new Error('Get Study Info Failed')
    }
  } catch (error: any) {
    throw new Error(error.message)
  }
}

/**
 * Study Info 받아오기
 * @param studyId
 * @param studentHistoryId
 * @param bookType
 * @returns
 */
async function requestStudyInfo(
  studyId: string,
  studentHistoryId: string,
  bookType: string,
) {
  const studyInfo = await getStudyInfo(studyId, studentHistoryId, bookType)

  return studyInfo
}

/**
 * Book Info 받아오기
 * @param studyId
 * @param studentHistoryId
 * @param levelRoundId
 * @returns
 */
async function requestBookInfo(
  studyId: string,
  studentHistoryId: string,
  levelRoundId: string,
) {
  const bookInfo = await getBookInfo(studyId, studentHistoryId, levelRoundId)

  return bookInfo
}
