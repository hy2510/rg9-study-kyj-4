import type { IcoBaseProps } from '@interfaces/common/icons/IcoBaseProps'

export function IconArrowRight({ width = 14, height = 14 }: IcoBaseProps) {
  return (
    <svg width={width} height={height} viewBox='0 0 24 24' aria-hidden>
      <path
        fill='currentColor'
        d='M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z'
      />
    </svg>
  )
}
