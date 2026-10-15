import type { Plugin } from 'vite'

/** Files from public/ that the app needs offline (they are copied as-is, outside the bundle). */
const PUBLIC_FILES = ['favicon.ico', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'site.webmanifest']

/** Only what a visit can use: no source maps, no legacy .woff, no font subsets for scripts the app never shows. */
function needed(name: string): boolean {
  if (name.endsWith('.map') || name.endsWith('.woff')) return false
  if (name.endsWith('.woff2')) return /-latin(-ext)?-/.test(name)
  return true
}

/**
 * Offline support without a dependency: after the bundle is generated, emit `sw.js` with the list of every
 * built file (hashed, so the list itself versions the cache). The worker precaches them all on install.
 */
export function offline(): Plugin {
  let base = '/'
  return {
    name: 'serendipia-offline',
    apply: 'build',
    configResolved(config) {
      base = config.base
    },
    generateBundle(_, bundle) {
      const files = [...Object.keys(bundle).filter(needed), ...PUBLIC_FILES].sort()
      let hash = 0
      for (const char of files.join('|')) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: worker(base, files, hash.toString(36)),
      })
    },
  }
}

function worker(base: string, files: string[], version: string): string {
  return `// Generated at build time (scripts/offline.ts): SERENDIPIA works without a connection once visited.
const CACHE = 'serendipia-${version}'
const BASE = ${JSON.stringify(base)}
const FILES = ${JSON.stringify(files.map((file) => base + file))}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([BASE, ...FILES])).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('serendipia-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  // Pages: the network first (to get updates), the saved copy when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(BASE, copy))
          return response
        })
        .catch(() => caches.match(BASE, { ignoreVary: true })),
    )
    return
  }
  // Built files never change under the same name: the saved copy first.
  event.respondWith(caches.match(request, { ignoreSearch: true, ignoreVary: true }).then((hit) => hit || fetch(request)))
})
`
}
