import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useStudentAnswer } from '@hooks/study/legacy/useStudentAnswer'
import useStudyAudio from '@hooks/study/legacy/useStudyAudio'
import { useSpellingPhysicalKeyboard } from '@hooks/study/remix/useSpellingPhysicalKeyboard'
import { deletePenalty, saveUserAnswerPartial } from '@services/studyApi'
import {
  IRecordAnswerType,
  IScoreBoardData,
} from '@src/interfaces/common/Common'
import { Mode } from '@src/interfaces/common/Types'
import { ILegacyStudyData } from '@src/interfaces/study/legacy/LegacyStudy'
import { buildSentenceTokens } from '@src/utils/study/legacy/clozeTestUtils'
import {
  buildDisplayText,
  getLettersOnly,
  isSpellingCorrect,
} from '@utils/spellingUtils'

import {
  ClozeTest3InitialState,
  ClozeTest3InputValue,
  ClozeTest3PenaltyState,
  ClozeTest3QuizMeta,
} from './useClozeTest3View'

type UseClozeTest3QuizArgs = {
  props: ILegacyStudyData
  isReady: boolean
  totalQuiz: number
  quizAnswerCount: number
  isEnabledPenalty: boolean
  initial: ClozeTest3InitialState
  getQuizMeta: (quizNo: number) => ClozeTest3QuizMeta | null
  makeEmptyInputs: (quizNo: number) => ClozeTest3InputValue[]
  recordedData: IRecordAnswerType[]
  studyMode: Mode
  heart: {
    setMax: (n: number) => void
    setCurrent: (n: number) => void
    decrease: () => void
  }
  quizFeedback: {
    presentResult: (isCorrect: boolean, callback: () => void) => void
  } | null
}

export function useClozeTest3Quiz({
  props,
  isReady,
  totalQuiz,
  quizAnswerCount,
  isEnabledPenalty,
  initial,
  getQuizMeta,
  makeEmptyInputs,
  recordedData,
  studyMode,
  heart,
  quizFeedback,
}: UseClozeTest3QuizArgs) {
  const studentAnswer = useStudentAnswer(studyMode)
  const { playState, playAudio, stopAudio, pauseAudio, resumeAudio, seekBy } =
    useStudyAudio()

  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(1)
  const [tryCount, setTryCount] = useState<number>(0)
  const [inputValues, setInputValues] = useState<ClozeTest3InputValue[]>([])
  const [currentBlankIndex, setCurrentBlankIndex] = useState<number>(0)
  const [inputLetters, setInputLetters] = useState<string>('')
  const [penaltyState, setPenaltyState] =
    useState<ClozeTest3PenaltyState>('none')
  const isWorking = useRef<boolean>(true)
  const onEnterOrTabRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!isReady) return
    setCurrentQuizIndex(initial.startQuizNo)
    setTryCount(initial.startTryCount)
    setInputValues(initial.startInputValues)
    setCurrentBlankIndex(initial.startCurrentIndex)
    setPenaltyState(initial.startPenaltyState)
    setInputLetters('')
    studentAnswer.setStudentAnswers(recordedData, quizAnswerCount)
    heart.setMax(quizAnswerCount)
    heart.setCurrent(quizAnswerCount - initial.startTryCount)
    isWorking.current = false
    const meta = getQuizMeta(initial.startQuizNo)
    if (initial.startPenaltyState === 'none' && meta?.sound)
      playAudio(meta.sound)
  }, [isReady])

  useEffect(() => {
    if (!isReady) return
    isWorking.current = false
  }, [currentQuizIndex])

  useEffect(() => {
    if (penaltyState === 'success') {
      // eslint-disable-next-line react-hooks/immutability -- finalizePenalty 는 컴포넌트 함수 내 정의
      finalizePenalty()
    }
  }, [penaltyState])

  const currentMeta = isReady ? getQuizMeta(currentQuizIndex) : null

  const sentenceTokens = useMemo(
    () => (currentMeta ? buildSentenceTokens(currentMeta.sentence) : []),
    [currentMeta],
  )

  const handleKeyPress = useCallback(
    (key: string) => {
      if (!currentMeta) return
      if (isWorking.current) return
      const maxLen = getLettersOnly(
        currentMeta.correctAnswers[currentBlankIndex] ?? '',
      ).length
      if (key === 'backspace') {
        setInputLetters((prev) => prev.slice(0, -1))
      } else if (key === 'enter' || key === 'tab') {
        onEnterOrTabRef.current()
      } else if (/^[a-zA-Z]$/.test(key)) {
        setInputLetters((prev) => (prev + key.toLowerCase()).slice(0, maxLen))
      }
    },
    [currentBlankIndex, currentMeta],
  )

  useSpellingPhysicalKeyboard({ onKeyPress: handleKeyPress })

  // eslint-disable-next-line react-hooks/immutability -- checkAnswer 는 컴포넌트 함수 내 정의
  useEffect(() => {
    if (!isReady || !currentMeta) return
    if (isWorking.current) return
    if (inputLetters === '') return

    const correctText = currentMeta.correctAnswers[currentBlankIndex] ?? ''
    const maxLen = getLettersOnly(correctText).length
    if (inputLetters.length < maxLen) return

    const filledText = buildDisplayText(correctText, inputLetters)

    if (penaltyState === 'penalty') {
      if (isSpellingCorrect(filledText, correctText)) {
        const updatedValues = inputValues.map((v, i) =>
          i === currentBlankIndex
            ? { text: filledText, isCorrected: true }
            : v,
        )
        setInputValues(updatedValues)
        const nextIndex = updatedValues.findIndex((v) => !v.isCorrected)
        if (nextIndex === -1) {
          setPenaltyState('success')
        } else {
          setCurrentBlankIndex(nextIndex)
          setInputLetters('')
        }
      }
      return
    }

    if (penaltyState !== 'none') return
    if (!isSpellingCorrect(filledText, correctText)) return

    const updatedValues = inputValues.map((v, i) =>
      i === currentBlankIndex ? { text: filledText, isCorrected: true } : v,
    )

    const nextEmpty = updatedValues.findIndex(
      (v, i) => !v.isCorrected && !v.text && i !== currentBlankIndex,
    )
    if (nextEmpty !== -1) {
      setInputValues(updatedValues)
      setCurrentBlankIndex(nextEmpty)
      setInputLetters('')
    } else {
      setInputValues(updatedValues)
      // eslint-disable-next-line react-hooks/immutability -- checkAnswer 는 컴포넌트 함수 내 정의
      checkAnswer(updatedValues)
    }
  }, [inputLetters, currentBlankIndex, penaltyState, isReady])

  const currentCorrectText =
    currentMeta?.correctAnswers[currentBlankIndex] ?? ''
  const correctLetterLen = getLettersOnly(currentCorrectText).length
  const isCurrentAllFilled = inputLetters.length === correctLetterLen
  const isCurrentIncorrect =
    isCurrentAllFilled && !isSpellingCorrect(inputLetters, currentCorrectText)

  const onClickBlank = (blankIndex: number) => {
    if (blankIndex === currentBlankIndex) return
    if (penaltyState !== 'none') return
    const val = inputValues[blankIndex]
    if (!val || val.isCorrected) return

    const currentVal = inputValues[currentBlankIndex]
    let nextValues = inputValues
    if (currentVal && !currentVal.isCorrected && inputLetters !== '') {
      const displayText = buildDisplayText(currentCorrectText, inputLetters)
      nextValues = inputValues.map((v, i) =>
        i === currentBlankIndex
          ? { text: displayText, isCorrected: false }
          : v,
      )
      setInputValues(nextValues)
    }

    const savedLetters = getLettersOnly(nextValues[blankIndex]?.text ?? '')
    setCurrentBlankIndex(blankIndex)
    setInputLetters(savedLetters)
  }

  const handleNextInput = () => {
    if (penaltyState !== 'none') return
    const uncorrected = inputValues
      .map((_, i) => i)
      .filter((i) => !inputValues[i].isCorrected && i !== currentBlankIndex)
    if (uncorrected.length === 0) return
    const next =
      uncorrected.find((i) => i > currentBlankIndex) ?? uncorrected[0]

    const currentVal = inputValues[currentBlankIndex]
    let nextValues = inputValues
    if (currentVal && !currentVal.isCorrected && inputLetters !== '') {
      const displayText = buildDisplayText(currentCorrectText, inputLetters)
      nextValues = inputValues.map((v, i) =>
        i === currentBlankIndex
          ? { text: displayText, isCorrected: false }
          : v,
      )
      setInputValues(nextValues)
    }

    const savedLetters = getLettersOnly(nextValues[next]?.text ?? '')
    setCurrentBlankIndex(next)
    setInputLetters(savedLetters)
  }

  const handleSubmit = () => {
    if (isWorking.current) return
    const meta = currentMeta
    if (!meta) return
    const currentText = buildDisplayText(
      meta.correctAnswers[currentBlankIndex] ?? '',
      inputLetters,
    )
    const valuesToSubmit = inputValues.map((v, i) => {
      if (i !== currentBlankIndex) return v
      const isCorrect =
        meta.correctAnswers[i] === currentText.trimStart().trimEnd()
      return { text: currentText, isCorrected: isCorrect }
    })
    setInputValues(valuesToSubmit)
    checkAnswer(valuesToSubmit)
  }

  onEnterOrTabRef.current = () => {
    if (penaltyState !== 'none') return
    const isLastBlank = currentBlankIndex === inputValues.length - 1
    const hasOtherUncorrected = inputValues.some(
      (v, i) => !v.isCorrected && i !== currentBlankIndex,
    )
    if (isLastBlank || !hasOtherUncorrected) {
      handleSubmit()
    } else {
      handleNextInput()
    }
  }

  const advanceToNext = () => {
    const nextQuizNo = currentQuizIndex + 1
    if (nextQuizNo <= totalQuiz) {
      setInputValues(makeEmptyInputs(nextQuizNo))
      setCurrentBlankIndex(0)
      setPenaltyState('none')
      setInputLetters('')
      setTryCount(0)
      heart.setCurrent(quizAnswerCount)
      isWorking.current = false
      setCurrentQuizIndex(nextQuizNo)
      const meta = getQuizMeta(nextQuizNo)
      if (meta?.sound) playAudio(meta.sound)
    } else {
      props.onFinishActivity()
    }
  }

  const evaluateInputs = (
    values: ClozeTest3InputValue[],
    meta: ClozeTest3QuizMeta,
  ) => {
    const nextInputs: ClozeTest3InputValue[] = []
    const userTokens: string[] = []
    const recordTokens: string[] = []
    let firstWrongIndex = -1

    for (let i = 0; i < meta.correctAnswers.length; i++) {
      const userText = (values[i]?.text ?? '').trimStart().trimEnd()
      const isEqual = meta.correctAnswers[i] === userText
      nextInputs.push({ text: userText, isCorrected: isEqual })
      userTokens.push(userText)
      recordTokens.push(isEqual ? '1' : '2')
      if (!isEqual && firstWrongIndex === -1) firstWrongIndex = i
    }

    return {
      isAllCorrect: nextInputs.every((v) => v.isCorrected),
      nextInputs,
      firstWrongIndex,
      correctJoined: meta.correctAnswers.join('┒'),
      userJoined: userTokens.join('┒'),
      recordJoined: recordTokens.join('/'),
    }
  }

  const enterPostAnswerFlow = (isCorrect: boolean) => {
    stopAudio()
    if (isCorrect) {
      advanceToNext()
      return
    }
    if (isEnabledPenalty) {
      setInputValues(makeEmptyInputs(currentQuizIndex))
      setPenaltyState('penalty')
      setCurrentBlankIndex(0)
      setInputLetters('')
      isWorking.current = false
    } else {
      advanceToNext()
    }
  }

  const enterRetryFlow = (
    nextInputs: ClozeTest3InputValue[],
    firstWrongIndex: number,
    newTryCount: number,
  ) => {
    const clearedInputs = nextInputs.map((v) =>
      v.isCorrected ? v : { text: '', isCorrected: false },
    )
    setInputValues(clearedInputs)
    setTryCount(newTryCount)
    setCurrentBlankIndex(firstWrongIndex)
    setInputLetters('')
    isWorking.current = false
  }

  const checkAnswer = async (localValues?: ClozeTest3InputValue[]) => {
    if (isWorking.current) return
    const meta = currentMeta
    if (!meta) return
    const {
      isAllCorrect,
      nextInputs,
      firstWrongIndex,
      correctJoined,
      userJoined,
      recordJoined,
    } = evaluateInputs(localValues ?? inputValues, meta)

    isWorking.current = true
    stopAudio()

    const newTryCount = tryCount + 1

    const answerData: IScoreBoardData = {
      quizNo: currentQuizIndex,
      maxCount: quizAnswerCount,
      answerCount: newTryCount,
      ox: isAllCorrect,
    }

    const userAnswer = studentAnswer.makeUserPartialAnswerData({
      mobile: '',
      studyId: props.studyId,
      studentHistoryId: props.studentHistoryId,
      bookType: props.bookType,
      step: props.currentStep,
      quizId: meta.quizId,
      quizNo: meta.quizNo,
      currentQuizNo: currentQuizIndex,
      correct: correctJoined,
      selectedAnswer: userJoined,
      partialRecord: recordJoined,
      tryCount: newTryCount,
      maxQuizCount: quizAnswerCount,
      quizLength: totalQuiz,
      isCorrect: isAllCorrect,
      answerData,
      isEnabledPenalty,
      isFinishStudy: props.lastStep === props.currentStep,
    })

    try {
      const res = await saveUserAnswerPartial(studyMode, userAnswer)
      if (Number(res.result) !== 0) {
        isWorking.current = false
        return
      }
    } catch {
      isWorking.current = false
      return
    }

    studentAnswer.addStudentAnswer(answerData)

    const tempRecord: IRecordAnswerType = {
      QuizId: `${meta.quizId}`,
      QuizNo: meta.quizNo,
      CurrentQuizNo: meta.quizNo,
      OX: isAllCorrect ? '1' : '2',
      TempText: '',
      PenaltyWord: '',
      Correct: correctJoined,
      StudentAnswer: recordJoined,
      AnswerCount: newTryCount,
    }
    props.onUpdateRecord?.(tempRecord)

    if (!isAllCorrect) {
      heart.decrease()
    }

    const proceed = () => {
      if (isAllCorrect || newTryCount >= quizAnswerCount) {
        enterPostAnswerFlow(isAllCorrect)
      } else {
        enterRetryFlow(nextInputs, firstWrongIndex, newTryCount)
      }
    }

    if (quizFeedback) {
      quizFeedback.presentResult(isAllCorrect, proceed)
    } else {
      proceed()
    }
  }

  const finalizePenalty = async () => {
    const meta = currentMeta
    if (!meta) return
    const isLastQuiz = currentQuizIndex + 1 > totalQuiz
    try {
      const res = await deletePenalty({
        mobile: '',
        bookType: props.bookType,
        studyId: props.studyId,
        studentHistoryId: props.studentHistoryId,
        step: String(props.currentStep),
        quizId: meta.quizId,
        isLastQuiz,
        isFinishStudy: isLastQuiz && props.lastStep === props.currentStep,
      })
      if (Number(res.result) !== 0) return
    } catch {
      return
    }
    stopAudio()
    advanceToNext()
  }

  const onPlaySoundToggle = () => {
    const sound = currentMeta?.sound
    if (!sound) return
    if (playState === 'playing') {
      pauseAudio()
    } else if (playState === 'paused') {
      resumeAudio()
    } else {
      playAudio(sound)
    }
  }

  const onSeekSound = (deltaSec: number) => {
    if (!currentMeta?.sound) return
    seekBy(deltaSec)
  }

  const isSoundControlDisabled = penaltyState !== 'none' || !currentMeta?.sound
  const canSeekSound =
    !isSoundControlDisabled && (playState === 'playing' || playState === 'paused')

  return {
    currentMeta,
    sentenceTokens,
    penaltyState,
    inputValues,
    currentBlankIndex,
    inputLetters,
    currentCorrectText,
    isCurrentIncorrect,
    handleKeyPress,
    onPlaySoundToggle,
    onSeekSound,
    isSoundControlDisabled,
    canSeekSound,
    playState,
    onClickBlank,
  }
}
