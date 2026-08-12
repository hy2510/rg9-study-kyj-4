import { type ComponentPropsWithoutRef, forwardRef } from 'react'

import styled from 'styled-components'

type LabelProps = ComponentPropsWithoutRef<'label'>

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  function Label(props, ref) {
    return <LabelStyled ref={ref} {...props} />
  },
)

export default Label

const LabelStyled = styled.label`
  font-family: 'Rg-B', 'Fredoka', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #3c4b62;
  display: inline-block;
`
