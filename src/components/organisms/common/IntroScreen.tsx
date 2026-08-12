import MovieBookIntroPanel from './intro/MovieBookIntroPanel'
import QuizIntroPanel from './intro/QuizIntroPanel'
import SimpleIntro from './intro/SimpleIntro'
import SpeakIntroPanel from './intro/SpeakIntroPanel'
import StoryIntroPanel from './intro/StoryIntroPanel'
import WordPracticeIntroPanel from './intro/WordPracticeIntroPanel'

type IntroScreenProps = {
  variant: 'story' | 'moviebook' | 'study' | 'review' | 'speak' | 'wordPractice'
  coverSrc?: string
  onStart: () => void
  onClose?: () => void
}

export default function IntroScreen({
  variant,
  coverSrc = '',
  onStart,
  onClose,
}: IntroScreenProps) {
  if (variant === 'story') {
    return <StoryIntroPanel coverSrc={coverSrc} onStart={onStart} />
  }

  if (variant === 'moviebook') {
    return <MovieBookIntroPanel coverSrc={coverSrc} onStart={onStart} />
  }

  if (variant === 'speak') {
    return (
      <SpeakIntroPanel
        coverSrc={coverSrc}
        onStart={onStart}
        onClose={onClose ?? onStart}
      />
    )
  }

  if (variant === 'wordPractice') {
    return <WordPracticeIntroPanel onStart={onStart} />
  }

  if (variant === 'study') {
    return (
      <QuizIntroPanel
        coverSrc={coverSrc}
        onStart={onStart}
        onClose={onClose ?? onStart}
      />
    )
  }

  return <SimpleIntro variant={variant} onStart={onStart} />
}
