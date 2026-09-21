import { es } from './es'
import type { Dictionary } from './es'
import { en } from './en'

export type Lang = 'es' | 'en'
export type TKey = keyof Dictionary

const dictionaries: Record<Lang, Dictionary> = { es, en }

export function translate(lang: Lang, key: TKey): string {
  return dictionaries[lang][key]
}

export function createT(lang: Lang): (key: TKey) => string {
  return (key) => translate(lang, key)
}
