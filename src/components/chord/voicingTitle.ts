import type { chordText } from '../../i18n/chord'
import type { Voicing } from '../../music/voicings'

type Texts = (typeof chordText)['es'] | (typeof chordText)['en']

/** One name per voicing, shared by the list and the context line: «Común», «Trastes 0–3», «Cejilla traste 5», «Forma 2». */
export function voicingTitle(voicing: Voicing, c: Texts, index = 0): string {
  if (voicing.source === 'marked') return c.marked
  if (voicing.source === 'common') return c.common
  if (voicing.barre && voicing.baseFret > 1) return `${c.barre} ${voicing.baseFret}`
  const played = voicing.frets.filter((fret): fret is number => fret !== null)
  const lo = Math.min(...played)
  const hi = Math.max(...played)
  return lo === hi ? `${c.shape} ${index + 1}` : `${c.fretsRange} ${lo}–${hi}`
}

/** Titles for a whole list; repeated titles get an ordinal («Trastes 0–1 (2)») so no two read the same. */
export function voicingTitles(voicings: Voicing[], c: Texts): string[] {
  const base = voicings.map((voicing, index) => voicingTitle(voicing, c, index))
  const totals = new Map<string, number>()
  for (const title of base) totals.set(title, (totals.get(title) ?? 0) + 1)
  const seen = new Map<string, number>()
  return base.map((title) => {
    if ((totals.get(title) ?? 0) < 2) return title
    const n = (seen.get(title) ?? 0) + 1
    seen.set(title, n)
    return `${title} (${n})`
  })
}
