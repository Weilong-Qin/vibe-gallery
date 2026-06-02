import { describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { injectHtmlMeta } from './shared.js'
import type { GalleryData } from '../types/index.js'

const galleryData: GalleryData = {
  profile: {
    name: 'Alice',
    bio: 'Builder & maintainer <open> "quoted"',
    avatarUrl: 'https://example.com/avatar.png',
    links: [],
  },
  resume: {
    sections: ['skills', 'experience', 'education', 'projects'],
    skills: [],
    experience: [],
    education: [],
  },
  projects: [],
  language: 'zh',
  theme: 'minimal',
  layout: {
    page: 'sidebar',
    projects: 'featured-first',
    columns: 'auto',
    density: 'comfortable',
  },
  builtAt: '2026-01-01T00:00:00.000Z',
}

const templateHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>vibe-gallery</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`

describe('injectHtmlMeta', () => {
  it('injects gallery metadata into an html template string', () => {
    const html = injectHtmlMeta(templateHtml, galleryData)

    expect(html).toContain('<html lang="zh">')
    expect(html).toContain("<title>Alice's Gallery</title>")
    expect(html).toContain(
      '<meta name="description" content="Builder &amp; maintainer &lt;open&gt; &quot;quoted&quot;" data-gallery />',
    )
    expect(html).toContain(
      '<meta property="og:image" content="https://example.com/avatar.png" data-gallery />',
    )
  })

  it('keeps repeated injections idempotent', () => {
    const once = injectHtmlMeta(templateHtml, galleryData)
    const twice = injectHtmlMeta(once, galleryData)

    expect(twice.match(/<meta name="description"/g)).toHaveLength(1)
    expect(twice.match(/data-gallery/g)).toHaveLength(8)
  })

  it('does not mutate the source index.html template', async () => {
    const indexPath = resolve('src/app/index.html')
    const before = await fs.readFile(indexPath, 'utf-8')

    injectHtmlMeta(before, galleryData)

    await expect(fs.readFile(indexPath, 'utf-8')).resolves.toBe(before)
  })
})
