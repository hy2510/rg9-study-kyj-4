import styled from 'styled-components'

type SoundSeekButtonProps = {
  onClick: () => void
  disabled?: boolean
  'aria-label': string
  children: string
}

export function SoundSeekButton({
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
  children,
}: SoundSeekButtonProps) {
  return (
    <SeekButton
      type='button'
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </SeekButton>
  )
}

const SeekButton = styled.button`
  min-width: 44px;
  height: 44px;
  padding: 0 8px;
  border: 2px solid rgb(162, 177, 196, 0.25);
  border-radius: 50%;
  background: #f5f6f8;
  color: #a2b1c4;
  font-size: 0.9em;
  font-weight: 700;
  font-family: 'Rg-B', 'Fredoka', sans-serif;
  cursor: pointer;
  transition: transform 0.05s ease;

  &:disabled {
    opacity: 0;
    cursor: not-allowed;
  }

  &:active:not(:disabled) {
    transform: scale(0.98) translateY(1px);
  }
`
