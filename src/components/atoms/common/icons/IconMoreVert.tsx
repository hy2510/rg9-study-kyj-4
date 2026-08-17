import moreVertIcon from '@assets/icons/more-vert.svg'
import type { ImgIconProps } from '@interfaces/common/icons/ImgIconProps'
import { imgProps } from '@utils/common/icons/imgProps'

export function IconMoreVert({ width, height, ...rest }: ImgIconProps) {
  return <img src={moreVertIcon} {...imgProps(width, height, rest)} />
}
