import arrowRightButtonIcon from '@assets/icons/arrow-right-button.svg'
import type { ImgIconProps } from '@interfaces/common/icons/ImgIconProps'
import { imgProps } from '@utils/common/icons/imgProps'

export function IconArrowRightButton({ width, height, ...rest }: ImgIconProps) {
  return <img src={arrowRightButtonIcon} {...imgProps(width, height, rest)} />
}
