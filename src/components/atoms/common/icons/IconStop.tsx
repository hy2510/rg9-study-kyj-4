import iconPauseRed from '@assets/icons/icon_pause_red.svg'
import type { IcoBaseProps } from '@interfaces/common/icons/IcoBaseProps'

export function IconStop({ width = 24, height = 24, isColor }: IcoBaseProps) {
  return (
    <img
      src={iconPauseRed}
      alt=''
      width={width}
      height={height}
      style={
        isColor === false ? { filter: 'grayscale(1)', opacity: 0.7 } : undefined
      }
    />
  )
}
