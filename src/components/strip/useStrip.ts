import { stripText, type StripKey } from '../../i18n/strip'
import { useStore } from '../../state/store'

/** Strip-only strings (src/i18n/strip.ts), in the current language. */
export function useStrip(): (key: StripKey) => string {
  const { lang } = useStore()
  return (key) => stripText[lang][key]
}
