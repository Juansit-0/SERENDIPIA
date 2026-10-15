import { defineConfig } from 'vitest/config'
import pkg from './package.json' with { type: 'json' }
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { offline } from './scripts/offline.ts'
import { preloadFonts } from './scripts/preloadFonts.ts'

export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the app under /SERENDIPIA/ (`npm run build:pages`); everywhere else it stays at the root.
  base: mode === 'pages' ? '/SERENDIPIA/' : '/',
  // The app knows its own version (for «Novedades»).
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [react(), tailwindcss(), offline(), preloadFonts()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    // The tabs load lazily in the app; tests use the same views imported directly (src/views/eager.ts).
    alias: [{ find: /^\.\/views\/lazy$/, replacement: '/src/views/eager.ts' }],
  },
}))
