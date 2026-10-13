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
    'theory.gloss.tonic': 'reposo',
    'theory.gloss.subdominant': 'se aleja',
    'theory.gloss.dominant': 'tensión',
    'practice.setup': 'Preparación',
    'practice.round': 'Ronda',
    'practice.mode': 'Modo de práctica',
    'practice.startRound': 'Empezar ronda',
    'practice.endRound': 'Terminar',
    'practice.ownTempo': 'Tempo de práctica',
    'practice.ownTempoHint': 'Parte del tempo de la barra; no lo cambia.',
    'practice.space': 'o Espacio',
    'practice.live': 'En curso',
    'practice.noRecord': 'sin récord',
    'practice.how1': 'Escribe dos acordes: la mano elegirá las posiciones que menos se mueven.',
    'practice.how2': 'Pulsa «Empezar ronda» y toca el primero.',
    'practice.how3.minute': 'Cada cambio limpio, pulsa «¡Cambio!» o Espacio. Una ronda dura un minuto.',
    'practice.how3.metronome': 'Cambia de acorde con el clic; si te cuesta, pulsa «Más lento».',
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
    'theory.gloss.tonic': 'rest',
    'theory.gloss.subdominant': 'moves away',
    'theory.gloss.dominant': 'tension',
    'practice.setup': 'Setup',
    'practice.round': 'Round',
    'practice.mode': 'Practice mode',
    'practice.startRound': 'Start round',
    'practice.endRound': 'End',
    'practice.ownTempo': 'Practice tempo',
    'practice.ownTempoHint': 'Starts from the top bar tempo; never changes it.',
    'practice.space': 'or Space',
    'practice.live': 'Live',
    'practice.noRecord': 'no record',
    'practice.how1': 'Type two chords: the shapes are picked so your hand moves as little as possible.',
    'practice.how2': 'Press “Start round” and play the first one.',
    'practice.how3.minute': 'For every clean change press “Change!” or Space. A round lasts one minute.',
    'practice.how3.metronome': 'Change chord with the click; if it is hard, press “Slower”.',
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
