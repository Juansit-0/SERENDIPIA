import type { QualityId } from '../../music/chords'

export type NoteRole = 'root' | 'third' | 'seventh' | 'extension' | 'other'

/** Role of a chord tone from its interval (semitones above the root) and the chord quality. */
export function roleOfInterval(interval: number, qualityId: QualityId): NoteRole {
  if (interval === 0) return 'root'
  if (interval === 3 || interval === 4) return 'third'
  if (interval === 10 || interval === 11) return 'seventh'
  if (interval === 9 && qualityId === 'dim7') return 'seventh'
  if (interval >= 12) return 'extension'
  if (interval === 2 || interval === 5 || interval === 9 || interval === 1) return 'extension'
  return 'other'
}

const TONE_WORDS: Record<'es' | 'en', Record<number, string>> = {
  es: {
    0: 'Raíz',
    1: '9ª menor',
    2: '9ª',
    3: '3ª menor',
    4: '3ª mayor',
    5: '4ª',
    6: '5ª disminuida',
    7: '5ª justa',
    8: '5ª aumentada',
    9: '6ª',
    10: '7ª menor',
    11: '7ª mayor',
    13: '9ª menor',
    14: '9ª',
    15: '9ª aumentada',
    17: '11ª',
    18: '11ª aumentada',
    21: '13ª',
  },
  en: {
    0: 'Root',
    1: 'flat 9th',
    2: '9th',
    3: 'minor 3rd',
    4: 'major 3rd',
    5: '4th',
    6: 'flat 5th',
    7: 'perfect 5th',
    8: 'sharp 5th',
    9: '6th',
    10: 'minor 7th',
    11: 'major 7th',
    13: 'flat 9th',
    14: '9th',
    15: 'sharp 9th',
    17: '11th',
    18: 'sharp 11th',
    21: '13th',
  },
}

/** What a chord tone is, in words a newcomer can read: «Raíz», «3ª menor», «5ª justa»… */
export function toneWord(interval: number, qualityId: QualityId, lang: 'es' | 'en'): string {
  if (interval === 9 && qualityId === 'dim7') return lang === 'es' ? '7ª disminuida' : 'diminished 7th'
  if (interval === 5 && (qualityId === 'sus4' || qualityId === '7sus4'))
    return lang === 'es' ? '4ª (en lugar de la 3ª)' : '4th (instead of the 3rd)'
  if (interval === 2 && qualityId === 'sus2') return lang === 'es' ? '2ª (en lugar de la 3ª)' : '2nd (instead of the 3rd)'
  return TONE_WORDS[lang][interval] ?? `${interval}`
}
