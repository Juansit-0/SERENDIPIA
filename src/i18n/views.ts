// Texts owned by the Teoría and Práctica views (Carta celeste). They extend the shared dictionary.
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
    'theory.gloss.tonic': 'Tónica — reposo',
    'theory.gloss.subdominant': 'Subdominante — se aleja',
    'theory.gloss.dominant': 'Dominante — tensión',
    'practice.setup': 'Preparación',
    'practice.round': 'Ronda',
    'practice.mode': 'Modo de práctica',
    'practice.startRound': 'Empezar ronda',
    'practice.endRound': 'Terminar',
    'practice.ownTempo': 'Tempo de práctica',
    'practice.ownTempoHint': 'Parte del tempo de la barra; no lo cambia.',
    'practice.space': 'o Espacio',
    'practice.live': 'En curso',
    'practice.playing': 'Suena',
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
    'theory.gloss.tonic': 'Tonic — rest',
    'theory.gloss.subdominant': 'Subdominant — moves away',
    'theory.gloss.dominant': 'Dominant — tension',
    'practice.setup': 'Setup',
    'practice.round': 'Round',
    'practice.mode': 'Practice mode',
    'practice.startRound': 'Start round',
    'practice.endRound': 'End',
    'practice.ownTempo': 'Practice tempo',
    'practice.ownTempoHint': 'Starts from the top bar tempo; never changes it.',
    'practice.space': 'or Space',
    'practice.live': 'Live',
    'practice.playing': 'Playing',
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
