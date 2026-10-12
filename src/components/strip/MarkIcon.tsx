import type { TransitionAnalysis } from '../../music/analysis'
import {
  ArrowRightIcon,
  ColorIcon,
  DeceptiveIcon,
  RepeatIcon,
  ResolveIcon,
  SmoothIcon,
  SurpriseIcon,
  TensionIcon,
} from '../icons'

/** Transition icon from the analysis (replaces the unicode mark glyphs). */
export function MarkIcon({ transition, size = 14 }: { transition: TransitionAnalysis; size?: number }) {
  if (transition.mark === '↪') return <DeceptiveIcon size={size} />
  switch (transition.tone) {
    case 'resolve':
      return <ResolveIcon size={size} />
    case 'tension':
      return <TensionIcon size={size} />
    case 'surprise':
      return <SurpriseIcon size={size} />
    case 'color':
      return <ColorIcon size={size} />
    case 'smooth':
      return <SmoothIcon size={size} />
    case 'repeat':
      return <RepeatIcon size={size} />
    default:
      return <ArrowRightIcon size={size} />
  }
}
