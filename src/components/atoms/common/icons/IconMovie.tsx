import movieIcon from '@assets/icons/story/icon_movie.png'
import type { ImgIconProps } from '@interfaces/common/icons/ImgIconProps'
import { imgProps } from '@utils/common/icons/imgProps'

export function IconMovie({ width, height, ...rest }: ImgIconProps) {
  return <img src={movieIcon} {...imgProps(width, height, rest)} />
}
