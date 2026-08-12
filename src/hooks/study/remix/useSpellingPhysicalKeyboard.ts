import { useEffect } from 'react'

type UseSpellingPhysicalKeyboardOptions = {
  enabled?: boolean
  nonEnglishAlertMessage?: string
  onKeyPress: (key: string) => void
}

/**
 * 물리 키보드 입력 감지 훅
 * - 알파벳: onKeyPress(letter) 호출
 * - Backspace: onKeyPress('backspace') 호출
 * - 영어 외 입력 시 alert 표시
 */
export function useSpellingPhysicalKeyboard({
  enabled = true,
  onKeyPress,
  nonEnglishAlertMessage = '영어로만 입력해 주세요.',
}: UseSpellingPhysicalKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return undefined

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        e.preventDefault()
        onKeyPress('backspace')
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onKeyPress('enter')
      } else if (e.key === 'Tab') {
        e.preventDefault()
        onKeyPress('tab')
      } else if (
        e.key.length === 1 &&
        /^[a-zA-Z]$/.test(e.key) &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault()
        onKeyPress(e.key.toLowerCase())
      } else if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !['Backspace', 'Enter', 'Tab', 'Escape', 'Shift', 'CapsLock'].includes(
          e.key,
        ) &&
        (e.key === 'Process' ||
          e.key === 'Unidentified' ||
          (e.key.length === 1 && !/^[a-zA-Z]$/.test(e.key)))
      ) {
        e.preventDefault()
        alert(nonEnglishAlertMessage)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onKeyPress, nonEnglishAlertMessage])
}
