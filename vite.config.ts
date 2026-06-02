import { promises as fs } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { injectHtmlMeta } from './src/build/shared.js'
import type { GalleryData } from './src/types/index.js'

function galleryHtmlMetaPlugin(): Plugin {
  return {
    name: 'vibe-gallery-html-meta',
    async transformIndexHtml(html) {
      const dataPath = fileURLToPath(
        new URL('./src/app/public/gallery.json', import.meta.url),
      )

      try {
        const raw = await fs.readFile(dataPath, 'utf-8')
        return injectHtmlMeta(html, JSON.parse(raw) as GalleryData)
      } catch (err) {
        if (
          err instanceof Error &&
          'code' in err &&
          err.code === 'ENOENT'
        ) {
          return html
        }
        throw err
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), galleryHtmlMetaPlugin()],
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
