import arrowLeftIcon from '@assets/icons/arrow-left.svg'
import type { ImgIconProps } from '@interfaces/common/icons/ImgIconProps'
import { imgProps } from '@utils/common/icons/imgProps'

export function IconArrowLeft({ width, height, ...rest }: ImgIconProps) {
  return <img src={arrowLeftIcon} {...imgProps(width, height, rest)} />
}
