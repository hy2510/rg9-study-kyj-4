import { useEffect, useRef, useState } from 'react'

import { useStudentAnswer } from '@hooks/study/legacy/useStudentAnswer'
import { Summary2FilledEntry } from '@interfaces/study/legacy/legacyTypes'
import { saveUserAnswerPartial } from '@services/studyApi'
import {
  IRecordAnswerType,
  IScoreBoardData,
} from '@src/interfaces/common/Common'
import { Mode } from '@src/interfaces/common/Types'
import { ISummary2Example } from '@src/interfaces/study/ISummary'
import { ILegacyStudyData } from '@src/interfaces/study/legacy/LegacyStudy'

import { Summary2InitialState, Summary2QuizMeta } from './useSummary2View'

export type { Summary2FilledEntry }

type UseSummary2QuizArgs = {
  props: ILegacyStudyData
  isReady: boolean
  totalBlanks: number
  quizAnswerCount: number
  exampleData: ISummary2Example[]
  initial: Summary2InitialState
  getQuizMeta: (quizNo: number) => Summary2QuizMeta | null
  questionNoToQuizNo: number[]
  studyMode: Mode
  heart: {
    setMax: (n: number) => void
    decrease: () => void
  }
  quizFeedback: {
    presentResult: (isCorrect: boolean, callback: () => void) => void
  } | null
}

export function useSummary2Quiz({
  props,
  isReady,
  totalBlanks,
  quizAnswerCount,
  exampleData,
  initial,
  getQuizMeta,
  questionNoToQuizNo,
  studyMode,
  heart,
  quizFeedback,
}: UseSummary2QuizArgs) {
  const studentAnswer = useStudentAnswer(studyMode)

  const [questionNo, setQuestionNo] = useState<number>(1)
  const [quizNo, setQuizNo] = useState<number>(1)
  const [tryCount, setTryCount] = useState<number>(0)
  const [partialRecord, setPartialRecord] = useState<string>('')
  const [bottomExamples, setBottomExamples] = useState<ISummary2Example[]>([])
  const [filledTexts, setFilledTexts] = useState<
    Record<number, Summary2FilledEntry>
  >({})
  const [pressedOptionText, setPressedOptionText] = useState<string | null>(
    null,
  )
  const [incorrectAnswer, setIncorrectAnswer] = useState<string | null>(null)
  const [isCheckingAnswer, setIsCheckingAnswer] = useState<boolean>(false)
  const [isComplete, setIsComplete] = useState<boolean>(false)
  const isWorking = useRef<boolean>(true)

  const currentExample =
    questionNo >= 1 && questionNo <= exampleData.length
      ? exampleData[questionNo - 1]
      : null

  useEffect(() => {
    if (!isReady) return
    setQuestionNo(initial.startQuestionNo)
    setQuizNo(initial.startQuizNo)
    setTryCount(initial.startTryCount)
    setPartialRecord(initial.startPartialRecord)
    setBottomExamples(initial.startBottomExamples)
    setFilledTexts(initial.startFilledTexts)

    studentAnswer.addStudentAnswers(
      studentAnswer.convertPartialRecordToScoreBoard(
        props.recordedData ?? [],
        quizAnswerCount,
      ),
    )
    heart.setMax(quizAnswerCount)

    if (initial.startQuestionNo > totalBlanks) {
      setIsComplete(true)
    }

    isWorking.current = false
  }, [isReady])

  useEffect(() => {
    if (!isReady) return
    if (questionNo === initial.startQuestionNo) return
    setTryCount(0)
  }, [questionNo])

  const advanceAfterAnswer = (currentPartial: string) => {
    if (questionNo + 1 > totalBlanks) {
      setIsComplete(true)
      return
    }
    const nextQuizNoExpected = questionNoToQuizNo[questionNo]
    if (nextQuizNoExpected !== quizNo) {
      setQuizNo(nextQuizNoExpected)
      setPartialRecord('')
    } else {
      setPartialRecord(currentPartial + ',')
    }
    setQuestionNo(questionNo + 1)
  }

  const persistPartial = async (
    nextPartialRecord: string,
    isCorrect: boolean,
    selectedText: string,
    nextTry: number,
    currentExample: ISummary2Example,
  ): Promise<boolean> => {
    const quizMeta = getQuizMeta(quizNo)
    if (!quizMeta) return false

    const answerData: IScoreBoardData = {
      quizNo: questionNo,
      maxCount: quizAnswerCount,
      answerCount: nextTry,
      ox: isCorrect,
    }

    const userAnswer = studentAnswer.makeUserPartialAnswerData({
      mobile: '',
      studyId: props.studyId,
      studentHistoryId: props.studentHistoryId,
      bookType: props.bookType,
      step: props.currentStep,
      quizId: quizMeta.quizId,
      quizNo: quizMeta.quizNo,
      currentQuizNo: questionNo,
      correct: currentExample.Text,
      selectedAnswer: selectedText,
      partialRecord: nextPartialRecord,
      tryCount: nextTry,
      maxQuizCount: quizAnswerCount,
      quizLength: totalBlanks,
      isCorrect,
      answerData,
      isFinishStudy: props.lastStep === props.currentStep,
    })

    try {
      const res = await saveUserAnswerPartial(studyMode, userAnswer)
      if (Number(res.result) !== 0) return false
    } catch {
      return false
    }

    studentAnswer.addStudentAnswer(answerData)

    const tempRecord: IRecordAnswerType = {
      QuizId: `${quizMeta.quizId}`,
      QuizNo: quizMeta.quizNo,
      CurrentQuizNo: quizMeta.quizNo,
      OX: isCorrect ? '1' : '2',
      TempText: '',
      PenaltyWord: '',
      Correct: currentExample.Text,
      StudentAnswer: nextPartialRecord,
      AnswerCount: nextTry,
    }
    props.onUpdateRecord?.(tempRecord)
    return true
  }

  const handleOptionClick = async (selectedText: string) => {
    if (isCheckingAnswer || isWorking.current) return
    if (!currentExample) return

    isWorking.current = true
    setIsCheckingAnswer(true)
    setPressedOptionText(selectedText)

    const isCorrect = currentExample.Text === selectedText
    const correctMark = isCorrect ? '1' : '2'
    const nextPartialRecord = partialRecord + correctMark
    const nextTry = tryCount + 1

    const persisted = await persistPartial(
      nextPartialRecord,
      isCorrect,
      selectedText,
      nextTry,
      currentExample,
    )
    if (!persisted) {
      setPressedOptionText(null)
      setIsCheckingAnswer(false)
      isWorking.current = false
      return
    }

    setPartialRecord(nextPartialRecord)
    setTryCount(nextTry)
    if (!isCorrect) heart.decrease()

    if (isCorrect) {
      const applyCorrect = () => {
        setFilledTexts((prev) => ({
          ...prev,
          [questionNo]: { text: currentExample.Text, isCorrect: true },
        }))
        setBottomExamples((prev) =>
          prev.filter((ex) => ex.Text !== currentExample.Text),
        )
        setIncorrectAnswer(null)
        setPressedOptionText(null)
        setIsCheckingAnswer(false)
        isWorking.current = false
        advanceAfterAnswer(nextPartialRecord)
      }
      if (quizFeedback) {
        quizFeedback.presentResult(true, applyCorrect)
      } else {
        applyCorrect()
      }
      return
    }

    if (nextTry < quizAnswerCount) {
      const clearWrong = () => {
        setIncorrectAnswer(null)
        setPressedOptionText(null)
        setIsCheckingAnswer(false)
        isWorking.current = false
      }
      setIncorrectAnswer(selectedText)
      if (quizFeedback) {
        quizFeedback.presentResult(false, clearWrong)
      } else {
        clearWrong()
      }
    } else {
      const advance = () => {
        setFilledTexts((prev) => ({
          ...prev,
          [questionNo]: { text: currentExample.Text, isCorrect: false },
        }))
        setBottomExamples((prev) =>
          prev.filter((ex) => ex.Text !== currentExample.Text),
        )
        setIncorrectAnswer(null)
        setPressedOptionText(null)
        setIsCheckingAnswer(false)
        isWorking.current = false
        advanceAfterAnswer(nextPartialRecord)
      }
      setIncorrectAnswer(selectedText)
      if (quizFeedback) {
        quizFeedback.presentResult(false, advance)
      } else {
        advance()
      }
    }
  }

  return {
    questionNo,
    currentExample,
    filledTexts,
    bottomExamples,
    pressedOptionText,
    incorrectAnswer,
    isCheckingAnswer,
    isComplete,
    handleOptionClick,
  }
}
