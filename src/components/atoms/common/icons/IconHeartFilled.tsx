import heartIcon from '@assets/icons/heart.svg'
import type { ImgIconProps } from '@interfaces/common/icons/ImgIconProps'
import { imgProps } from '@utils/common/icons/imgProps'

export function IconHeartFilled({ width, height, ...rest }: ImgIconProps) {
  return <img src={heartIcon} {...imgProps(width, height, rest)} />
}
