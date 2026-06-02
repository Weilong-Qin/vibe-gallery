import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@build': fileURLToPath(new URL('./src/build', import.meta.url)),
    },
  },
  test: {
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'dist', 'packages'],
    environmentMatchGlobs: [
      ['src/app/**/*.test.tsx', 'jsdom'],
      ['src/app/**/*.test.ts', 'jsdom'],
    ],
    setupFiles: ['./src/test-setup.ts'],
  },
})
