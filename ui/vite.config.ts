/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@game': new URL('../ts/', import.meta.url).pathname,
      '@game-types': new URL('../ts/types.ts', import.meta.url).pathname,
      '@game-engine': new URL('../ts/engine/game.ts', import.meta.url).pathname,
      '@game-ui': new URL('../ts/ui/ui-fields.ts', import.meta.url).pathname,
      '@game-state': new URL('../ts/state.ts', import.meta.url).pathname,
      '@game-data': new URL('../ts/data/', import.meta.url).pathname,
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
