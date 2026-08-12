import vocaIcon from '@assets/icons/icon_voca.png'
import type { ImgIconProps } from '@interfaces/common/icons/ImgIconProps'
import { imgProps } from '@utils/common/icons/imgProps'

export function IconVoca({ width, height, ...rest }: ImgIconProps) {
  return <img src={vocaIcon} {...imgProps(width, height, rest)} />
}
