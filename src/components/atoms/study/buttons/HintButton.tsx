import { styled } from 'styled-components'

export const HintButtonWrap = styled.div`
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
  flex: 0 0 auto;
`

export const HintButton = styled.button`
  min-width: 120px;
  padding: 10px 20px;
  border-radius: 999px;
  border: 1px solid #d6dde7;
  background-color: #ffffff;
  color: #2563eb;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.1s ease,
    transform 0.05s ease;

  &:hover:not(:disabled) {
    background-color: #f3f7ff;
  }
  &:active:not(:disabled) {
    transform: translateY(1px);
  }
  &:disabled {
    color: #a2b1c4;
    cursor: not-allowed;
    background-color: #f5f7fa;
  }
`
