import {
  mapQuizId,
  mapQuizMetaBase,
  RawQuizId,
  RawQuizMetaBase,
} from '@services/quiz/rawQuizTransform'
import { getQuizData } from '@services/studyApi'
import { GET_QUIZ_DATA_PATH } from '@src/constants/study/studyConstants'
import { IQuizStudyRef } from '@src/interfaces/common/Common'
import {
  IVocabulary1Example,
  IVocabulary1Practice,
  IVocabulary1Quiz,
  IVocabulary1Test,
  IVocabulary2Example,
  IVocabulary2Practice,
  IVocabulary2Quiz,
  IVocabulary2Test,
  IVocabulary3Hint,
  IVocabulary3Practice,
  IVocabulary3Quiz,
  IVocabulary3Test,
  IVocabulary4Example,
  IVocabulary4Practice,
  IVocabulary4Quiz,
  IVocabulary4Test,
  MeanLanguage,
} from '@src/interfaces/study/IVocabulary'

interface RawVocabulary1Quiz extends RawQuizId {
  Question: IVocabulary1Quiz['Question']
  Examples: IVocabulary1Quiz['Examples']
}

interface RawVocabulary1 extends RawQuizMetaBase {
  MainMeanLanguage: MeanLanguage
  SubMeanLanguage: MeanLanguage
  Quiz: RawVocabulary1Quiz[]
}

interface RawVocabulary2Quiz extends RawQuizId {
  Question: IVocabulary2Quiz['Question']
  Examples: IVocabulary2Quiz['Examples']
}

interface RawVocabulary2 extends RawQuizMetaBase {
  MainMeanLanguage: MeanLanguage
  SubMeanLanguage: MeanLanguage
  Quiz: RawVocabulary2Quiz[]
}

interface RawVocabulary3Quiz extends RawQuizId {
  Question: IVocabulary3Quiz['Question']
}

interface RawVocabulary3Practice extends RawQuizMetaBase {
  IsEnabledTyping: IVocabulary3Practice['IsEnabledTyping']
  IsSkipAvailable: IVocabulary3Practice['IsSkipAvailable']
  MainMeanLanguage: MeanLanguage
  SubMeanLanguage: MeanLanguage
  Quiz: RawVocabulary3Quiz[]
}

interface RawVocabulary3Test extends RawQuizMetaBase {
  IsEnablePenaltyReview: boolean
  MainMeanLanguage: MeanLanguage
  SubMeanLanguage: MeanLanguage
  Hint: IVocabulary3Hint
  Quiz: RawVocabulary3Quiz[]
}

interface RawVocabulary4Quiz extends RawQuizId {
  Question: IVocabulary4Quiz['Question']
  Examples: IVocabulary4Quiz['Examples']
}

interface RawVocabulary4 extends RawQuizMetaBase {
  MainMeanLanguage: MeanLanguage
  SubMeanLanguage: MeanLanguage
  Quiz: RawVocabulary4Quiz[]
}

//////////////////////////////////////////////////////////////
// vocabulary 1
//////////////////////////////////////////////////////////////
async function getVocabularyPractice1(
  study: IQuizStudyRef,
): Promise<IVocabulary1Practice> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `${GET_QUIZ_DATA_PATH}/vocabulary-1-practice?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (
    raw: RawVocabulary1,
  ): Promise<IVocabulary1Practice> => {
    return {
      ...mapQuizMetaBase(raw),
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      Quiz: raw.Quiz.map((q): IVocabulary1Quiz => {
        return {
          ...mapQuizId(q),
          Question: {
            Text: q.Question.Text,
            Image: q.Question.Image,
            Sound: q.Question.Sound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
          Examples: q.Examples.map((e): IVocabulary1Example => {
            return {
              Text: e.Text,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IVocabulary1Practice>(path, transformObject)
}

async function getVocabularyTest1(
  study: IQuizStudyRef,
): Promise<IVocabulary1Test> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `${GET_QUIZ_DATA_PATH}/vocabulary-1?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (
    raw: RawVocabulary1,
  ): Promise<IVocabulary1Test> => {
    return {
      ...mapQuizMetaBase(raw),
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      Quiz: raw.Quiz.map((q): IVocabulary1Quiz => {
        return {
          ...mapQuizId(q),
          Question: {
            Text: q.Question.Text,
            Image: q.Question.Image,
            Sound: q.Question.Sound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
          Examples: q.Examples.map((e): IVocabulary1Example => {
            return {
              Text: e.Text,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IVocabulary1Test>(path, transformObject)
}
// vocabulary 1 end

//////////////////////////////////////////////////////////////
// vocabulary 2
//////////////////////////////////////////////////////////////
async function getVocabularyPractice2(
  study: IQuizStudyRef,
): Promise<IVocabulary2Practice> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `${GET_QUIZ_DATA_PATH}/vocabulary-2-practice?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (
    raw: RawVocabulary2,
  ): Promise<IVocabulary2Practice> => {
    return {
      ...mapQuizMetaBase(raw),
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      Quiz: raw.Quiz.map((q): IVocabulary2Quiz => {
        return {
          ...mapQuizId(q),
          Question: {
            Text: q.Question.Text,
            Image: q.Question.Image,
            Sound: q.Question.Sound,
            Word: q.Question.Word,
            WordSound: q.Question.WordSound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
          Examples: q.Examples.map((e): IVocabulary2Example => {
            return {
              Text: e.Text,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IVocabulary2Test>(path, transformObject)
}

async function getVocabularyTest2(
  study: IQuizStudyRef,
): Promise<IVocabulary2Test> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `${GET_QUIZ_DATA_PATH}/vocabulary-2?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (
    raw: RawVocabulary2,
  ): Promise<IVocabulary2Test> => {
    return {
      ...mapQuizMetaBase(raw),
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      Quiz: raw.Quiz.map((q): IVocabulary2Quiz => {
        return {
          ...mapQuizId(q),
          Question: {
            Text: q.Question.Text,
            Image: q.Question.Image,
            Sound: q.Question.Sound,
            Word: q.Question.Word,
            WordSound: q.Question.WordSound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
          Examples: q.Examples.map((e): IVocabulary2Example => {
            return {
              Text: e.Text,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IVocabulary2Test>(path, transformObject)
}
// vocabulary 2 end

//////////////////////////////////////////////////////////////
// vocabulary 3
//////////////////////////////////////////////////////////////
async function getVocabularyPractice3(
  study: IQuizStudyRef,
): Promise<IVocabulary3Practice> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `${GET_QUIZ_DATA_PATH}/vocabulary-3-practice?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (
    raw: RawVocabulary3Practice,
  ): Promise<IVocabulary3Practice> => {
    return {
      ...mapQuizMetaBase(raw),
      IsEnabledTyping: raw.IsEnabledTyping,
      IsSkipAvailable: raw.IsSkipAvailable,
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      Quiz: raw.Quiz.map((q): IVocabulary3Quiz => {
        return {
          ...mapQuizId(q),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
        }
      }),
    }
  }
  return getQuizData<IVocabulary3Practice>(path, transformObject)
}

async function getVocabularyTest3(
  study: IQuizStudyRef,
): Promise<IVocabulary3Test> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `${GET_QUIZ_DATA_PATH}/vocabulary-3?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (
    raw: RawVocabulary3Test,
  ): Promise<IVocabulary3Test> => {
    return {
      ...mapQuizMetaBase(raw),
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      IsEnablePenaltyReview: Boolean(raw.IsEnablePenaltyReview),
      Hint: {
        IsEnabled: raw.Hint.IsEnabled,
        Max: raw.Hint.Max,
        Try: raw.Hint.Try,
      },
      Quiz: raw.Quiz.map((q): IVocabulary3Quiz => {
        return {
          ...mapQuizId(q),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
        }
      }),
    }
  }
  return getQuizData<IVocabulary3Test>(path, transformObject)
}

// vocabulary 3 end

//////////////////////////////////////////////////////////////
// vocabulary 4
//////////////////////////////////////////////////////////////
async function getVocabularyPractice4(
  study: IQuizStudyRef,
): Promise<IVocabulary4Practice> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `${GET_QUIZ_DATA_PATH}/vocabulary-4-practice?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (
    raw: RawVocabulary4,
  ): Promise<IVocabulary4Practice> => {
    return {
      ...mapQuizMetaBase(raw),
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      Quiz: raw.Quiz.map((q): IVocabulary4Quiz => {
        return {
          ...mapQuizId(q),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
          Examples: q.Examples.map((e): IVocabulary4Example => {
            return {
              Text: e.Text,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IVocabulary4Practice>(path, transformObject)
}

async function getVocabularyTest4(
  study: IQuizStudyRef,
): Promise<IVocabulary4Test> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `${GET_QUIZ_DATA_PATH}/vocabulary-4?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (
    raw: RawVocabulary4,
  ): Promise<IVocabulary4Test> => {
    return {
      ...mapQuizMetaBase(raw),
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      Quiz: raw.Quiz.map((q): IVocabulary4Quiz => {
        return {
          ...mapQuizId(q),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
          Examples: q.Examples.map((e): IVocabulary4Example => {
            return {
              Text: e.Text,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IVocabulary4Test>(path, transformObject)
}

export {
  getVocabularyPractice1,
  getVocabularyPractice2,
  getVocabularyPractice3,
  getVocabularyPractice4,
  getVocabularyTest1,
  getVocabularyTest2,
  getVocabularyTest3,
  getVocabularyTest4,
}
