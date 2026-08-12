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
`

const Panel = styled.div`
  min-width: 900px;
  min-height: 600px;
  border-radius: 30px;
  background-color: rgba(255, 255, 255, 0.8);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
`

const Title = styled.h2`
  margin: 0;
`
