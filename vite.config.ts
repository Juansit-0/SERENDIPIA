import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { offline } from './scripts/offline'

export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the app under /SERENDIPIA/ (`npm run build:pages`); everywhere else it stays at the root.
  base: mode === 'pages' ? '/SERENDIPIA/' : '/',
  plugins: [react(), tailwindcss(), offline()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
}))
