import { styled } from 'styled-components'

export const ClozeTest2InlineSpellingSlots = styled.span<{
  $isIncorrect?: boolean
  $isPlaceholder?: boolean
}>`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  vertical-align: middle;
  padding: 2px 6px;
  border-radius: 10px;
  border: 1.5px solid
    ${(p) =>
      p.$isPlaceholder ? '#a2b1c4' : p.$isIncorrect ? '#ef3d2e' : '#199261'};
  background: ${(p) =>
    p.$isPlaceholder ? '#f5f6f8' : p.$isIncorrect ? '#fff0ef' : '#f0fdf8'};
  margin: 0 4px;
  transition: all 0.2s ease;
`

export const ClozeTest2InlineCharSlot = styled.span<{
  $isFixed?: boolean
  $isIncorrect?: boolean
  $isPlaceholder?: boolean
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: ${(p) => (p.$isFixed ? '8px' : '13px')};
  height: 28px;
  font-size: 1em;
  font-weight: 700;
  color: ${(p) =>
    p.$isPlaceholder ? '#a2b1c4' : p.$isIncorrect ? '#ef3d2e' : '#199261'};
  /* border-bottom: ${(p) =>
    p.$isFixed
      ? 'none'
      : `2px solid ${p.$isPlaceholder ? '#a2b1c4' : p.$isIncorrect ? '#ef3d2e' : '#199261'}`}; */
`
