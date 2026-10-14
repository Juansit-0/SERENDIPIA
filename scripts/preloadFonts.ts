import type { Plugin } from 'vite'

/** The faces the first screen draws with: the chord name (IM Fell English) and the interface (Jost). */
const FIRST_PAINT = [/im-fell-english-latin-400-normal-.*\.woff2$/, /jost-latin-wght-normal-.*\.woff2$/]

/**
 * Fonts are only found once the stylesheet is parsed; preloading the two the first screen needs lets them
 * download alongside the script, so the chord name paints sooner and does not reflow.
 */
export function preloadFonts(): Plugin {
  return {
    name: 'serendipia-preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_, context) {
        const files = Object.keys(context.bundle ?? {}).filter((name) => FIRST_PAINT.some((pattern) => pattern.test(name)))
        // Relative to the page, which is always served from the app's base (/ or /SERENDIPIA/).
        return files.map((file) => ({
          tag: 'link',
          attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: file },
          injectTo: 'head' as const,
        }))
      },
    },
  }
}
