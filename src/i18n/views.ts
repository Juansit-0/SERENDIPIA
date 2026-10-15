// Texts owned by the Teoría view (Carta celeste). They extend the shared dictionary.
import { useStore } from '../state/store'

export const viewsText = {
  es: {
    'theory.key': 'Tonalidad',
    'theory.major': 'mayor',
    'theory.minor': 'menor',
    'theory.triads': 'Tríadas',
    'theory.sevenths': 'Séptimas',
    'theory.chordType': 'Tipo de acorde',
    'theory.degrees': 'Grados de la tonalidad',
    'theory.keyHint': 'La tonalidad se cambia en la barra superior.',
    'theory.add': 'Añadir {chord} a la progresión',
    'theory.use': 'Usar',
    'theory.useAria': 'Usar la progresión {name}',
    'theory.classics': 'Progresiones clásicas',
    'theory.classicsHint': 'Reemplazan la progresión actual; se puede deshacer.',
    'theory.gloss.tonic': 'reposo',
    'theory.gloss.subdominant': 'se aleja',
    'theory.gloss.dominant': 'tensión',
  },
  en: {
    'theory.key': 'Key',
    'theory.major': 'major',
    'theory.minor': 'minor',
    'theory.triads': 'Triads',
    'theory.sevenths': 'Sevenths',
    'theory.chordType': 'Chord type',
    'theory.degrees': 'Degrees of the key',
    'theory.keyHint': 'Change the key in the top bar.',
    'theory.add': 'Add {chord} to the progression',
    'theory.use': 'Use',
    'theory.useAria': 'Use the {name} progression',
    'theory.classics': 'Classic progressions',
    'theory.classicsHint': 'They replace the current progression; you can undo.',
    'theory.gloss.tonic': 'rest',
    'theory.gloss.subdominant': 'moves away',
    'theory.gloss.dominant': 'tension',
  },
} as const

export type ViewsKey = keyof (typeof viewsText)['es']

export function useViewsText() {
  const { lang } = useStore()
  return (key: ViewsKey, vars?: Record<string, string>) => {
    let text: string = viewsText[lang][key]
    if (vars) for (const [name, value] of Object.entries(vars)) text = text.replace(`{${name}}`, value)
    return text
  }
}
