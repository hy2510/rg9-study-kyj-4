import iconPlayRed from '@assets/icons/icon_play_red.svg'
import type { IcoBaseProps } from '@interfaces/common/icons/IcoBaseProps'

export function IconPlay({ width = 24, height = 24, isColor }: IcoBaseProps) {
  return (
    <img
      src={iconPlayRed}
      alt=''
      width={width}
      height={height}
      style={
        isColor === false ? { filter: 'grayscale(1)', opacity: 0.7 } : undefined
      }
    />
  )
}
