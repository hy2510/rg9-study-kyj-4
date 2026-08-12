import { spin } from '@styles/tokens/animations'
import styled from 'styled-components'

type CenteredLoadingProps = {
  fillViewport?: boolean
}

export default function CenteredLoading({ fillViewport = false }: CenteredLoadingProps) {
  return (
    <Root $fillViewport={fillViewport} role='status' aria-live='polite' aria-label='Loading'>
      <Spinner />
    </Root>
  )
}

const Root = styled.div<{ $fillViewport: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: ${(p) => (p.$fillViewport ? '100vh' : '280px')};
  flex: 1;
`

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(128, 128, 128, 0.35);
  border-top-color: #20ad75;
  border-radius: 50%;
  animation: ${spin} 0.75s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.85;
  }
`
