export const BREAKPOINT_MOBILE_MAX = 767
export const BREAKPOINT_TABLET_MAX = 1023

export const media = {
  mobile: `@media (max-width: ${BREAKPOINT_MOBILE_MAX}px)`,
  tablet: `@media (max-width: ${BREAKPOINT_TABLET_MAX}px)`,
  desktop: `@media (min-width: ${BREAKPOINT_TABLET_MAX + 1}px)`,
} as const
