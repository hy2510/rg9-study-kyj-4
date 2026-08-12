import type { IcoBaseProps } from '@interfaces/common/icons/IcoBaseProps'

export function IconReturn({ width = 15, height = 15 }: IcoBaseProps) {
  return (
    <svg width={width} height={height} viewBox='0 0 24 24' aria-hidden>
      <path
        fill='currentColor'
        d='M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z'
      />
    </svg>
  )
}
