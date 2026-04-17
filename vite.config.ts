import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  root: 'src/app',
  resolve: {
    alias: {
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@build': fileURLToPath(new URL('./src/build', import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
  },
})
