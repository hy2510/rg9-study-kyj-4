import { type ComponentPropsWithoutRef, forwardRef } from 'react'

import styled from 'styled-components'

type InputProps = ComponentPropsWithoutRef<'input'>

const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(props, ref) {
    return <InputStyled ref={ref} {...props} />
  },
)

export default Input

const InputStyled = styled.input`
  box-sizing: border-box;
  font-family: 'Rg-B', 'Fredoka', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #3c4b62;
  border: 1.5px solid #e9edf3;
  border-radius: 12px;
  padding: 10px 14px;
  background: #fff;
  outline: none;

  &::placeholder {
    color: #a2b1c4;
  }

  &:focus {
    border-color: #64748b;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`
