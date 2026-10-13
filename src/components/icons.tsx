/*
 * Authored line icons for Carta celeste: one 24px grid, 1.6px stroke, round joins.
 * Decorative by default (aria-hidden); the control that holds one carries the label.
 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 18, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export const PlayIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 5.5v13l11-6.5z" fill="currentColor" stroke="none" />
  </Icon>
)

export const StopIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor" stroke="none" />
  </Icon>
)

export const ListenIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Icon>
)

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const MinusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
)

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.5 9.5 12 15l5.5-5.5" />
  </Icon>
)

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Icon>
)

export const UndoIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 7 4.5 11.5 9 16" />
    <path d="M4.5 11.5H14a4.5 4.5 0 0 1 0 9h-3" />
  </Icon>
)

export const RedoIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M15 7l4.5 4.5L15 16" />
    <path d="M19.5 11.5H10a4.5 4.5 0 0 0 0 9h3" />
  </Icon>
)

export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6" />
  </Icon>
)

export const MoreIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="18" cy="12" r="1.2" fill="currentColor" />
  </Icon>
)

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />
  </Icon>
)

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
  </Icon>
)

export const SoundIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M16 9.5a3.5 3.5 0 0 1 0 5" />
  </Icon>
)

export const LoopIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M17 4.5 19.5 7 17 9.5" />
    <path d="M4.5 12V10a3 3 0 0 1 3-3h12" />
    <path d="M7 19.5 4.5 17 7 14.5" />
    <path d="M19.5 12v2a3 3 0 0 1-3 3h-12" />
  </Icon>
)

export const ShareIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </Icon>
)

/** 4-point sparkle star (inlay markers, root marks, brand). */
export const SparkleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 2.5c.6 4.8 2.7 6.9 9.5 9.5-6.8 2.6-8.9 4.7-9.5 9.5-.6-4.8-2.7-6.9-9.5-9.5 6.8-2.6 8.9-4.7 9.5-9.5z" fill="currentColor" stroke="none" />
  </Icon>
)

/** Transition marks between progression steps (replace the old unicode glyphs). */
export const ResolveIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.5 12.5 10 17l8.5-9.5" />
  </Icon>
)

export const TensionIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 17 17 7M9.5 7H17v7.5" />
  </Icon>
)

export const DeceptiveIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 8h9a4 4 0 0 1 0 8H9" />
    <path d="M11.5 13 8.5 16l3 3" />
  </Icon>
)

export const ColorIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="7" />
    <path d="M12 5a7 7 0 0 1 0 14z" fill="currentColor" stroke="none" />
  </Icon>
)

export const SurpriseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13 3.5 6.5 13H12l-1 7.5L17.5 11H12z" />
  </Icon>
)

export const SmoothIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 13c2.5-3 5-3 8 0s5.5 3 8 0" />
  </Icon>
)

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />
  </Icon>
)

export const RepeatIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 9.5h12M6 14.5h12" />
  </Icon>
)

export const TunerIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8.5 3v7a3.5 3.5 0 0 0 7 0V3" />
    <path d="M12 13.5V21" />
    <path d="M10 21h4" />
  </Icon>
)

export const MicIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
    <path d="M12 17.5V21" />
    <path d="M9 21h6" />
  </Icon>
)
