import type { chordText } from '../../i18n/chord'
import type { Voicing } from '../../music/voicings'

type Texts = (typeof chordText)['es'] | (typeof chordText)['en']

/** «Marcada», «Común» or «Posición 5»: one name per voicing, shared by the list and the context line. */
export function voicingTitle(voicing: Voicing, c: Texts): string {
  if (voicing.source === 'marked') return c.marked
  if (voicing.source === 'common') return c.common
  return `${c.position} ${voicing.baseFret}`
}
