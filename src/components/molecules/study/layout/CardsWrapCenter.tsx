import type { ReactNode } from 'react'

import FlexWrapCenter from '@components/atoms/study/layout/FlexWrapCenter'

type CardsWrapCenterProps = {
  children: ReactNode
}

export default function CardsWrapCenter({ children }: CardsWrapCenterProps) {
  return <FlexWrapCenter>{children}</FlexWrapCenter>
}
