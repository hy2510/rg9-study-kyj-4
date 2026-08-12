import printerIcon from '@assets/icons/icon_printer.svg'
import type { ImgIconProps } from '@interfaces/common/icons/ImgIconProps'
import { imgProps } from '@utils/common/icons/imgProps'

export function IconPrinter({ width, height, ...rest }: ImgIconProps) {
  return <img src={printerIcon} {...imgProps(width, height, rest)} />
}
