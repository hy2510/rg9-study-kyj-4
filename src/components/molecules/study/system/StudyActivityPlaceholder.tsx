import { media } from '@styles/tokens/breakpoints'
import styled from 'styled-components'

type StudyActivityPlaceholderProps = {
  label: string
}

export function StudyActivityPlaceholder({
  label,
}: StudyActivityPlaceholderProps) {
  return (
    <Wrap>
      <Panel>
        <Title>{label}</Title>
      </Panel>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0 16px;
  box-sizing: border-box;

  ${media.mobile} {
    padding: 0 8px;
  }
`

const Panel = styled.div`
  min-width: 900px;
  min-height: 600px;
  width: 100%;
  max-width: 900px;
  border-radius: 40px;
  background-color: rgba(255, 255, 255, 0.8);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;

  ${media.tablet} {
    min-width: 0;
    min-height: 400px;
    border-radius: 28px;
  }

  ${media.mobile} {
    min-height: 280px;
    border-radius: 24px;
  }
`

const Title = styled.h2`
  margin: 0;
`
