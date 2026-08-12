import { type ComponentPropsWithoutRef, forwardRef } from 'react'

import styled from 'styled-components'

type TextareaProps = ComponentPropsWithoutRef<'textarea'>

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(props, ref) {
    return <TextareaStyled ref={ref} {...props} />
  },
)

export default Textarea

const TextareaStyled = styled.textarea`
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
  resize: vertical;
  min-height: 88px;

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
