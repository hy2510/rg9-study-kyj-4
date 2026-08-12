import { type ComponentPropsWithoutRef, forwardRef } from 'react'

type ImagesProps = ComponentPropsWithoutRef<'img'> & {
  src: string
}

const Images = forwardRef<HTMLImageElement, ImagesProps>(function Images(
  { src, alt = '', decoding = 'async', loading = 'lazy', ...rest },
  ref,
) {
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      decoding={decoding}
      loading={loading}
      {...rest}
    />
  )
})

export default Images
