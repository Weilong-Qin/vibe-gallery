/**
 * Fast re-assembly: reads project data from local cache + current gallery.config.yaml,
 * skips all GitHub API calls and LLM analysis. Use this when changing config-driven
 * presentation details such as language, theme, layout, profile info, resume content,
 * import settings, display options, or per-project overrides without re-fetching data.
 *
 * Usage: npm run build:assemble
 */

import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { loadConfig } from './config.js'
import {
  assembleProfile,
  buildResumeData,
  buildProjectConfigMap,
  writeThemeEntry,
} from './shared.js'
import type { GalleryData, ProjectData } from '../types/index.js'

const CACHE_FILE = resolve(process.cwd(), '.gallery-cache.json')

async function main() {
  console.log('⚡ Assembling gallery from cache...')

  const config = await loadConfig()

  let cache: Record<string, ProjectData> = {}
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf-8')
    cache = JSON.parse(raw) as Record<string, ProjectData>
  } catch {
    console.warn(
      '⚠ No cache found (.gallery-cache.json). Run npm run build:data first.',
    )
    process.exit(1)
  }

  const seen = new Map<string, ProjectData>()
  for (const project of Object.values(cache)) {
    if (!seen.has(project.id)) seen.set(project.id, project)
  }

  const projects = [...seen.values()]

  const projectConfigMap = buildProjectConfigMap(config)

  const merged = projects.map((p) => {
    const cfg = projectConfigMap.get(p.id)
    if (!cfg) return p
    return {
      ...p,
      featured: cfg.featured ?? p.featured,
      status: cfg.status ?? p.status,
      demoUrl: cfg.demo_url ?? p.demoUrl,
      screenshots: cfg.screenshots ?? p.screenshots,
      display: cfg.display ?? p.display,
      ...(cfg.override?.title ? { title: cfg.override.title } : {}),
      ...(cfg.override?.description ? { description: cfg.override.description } : {}),
    }
  })

  const profile = assembleProfile(
    config.profile,
    config.profile.bio_override ?? config.profile.bio ?? '',
    config.import?.github,
  )

  const galleryData: GalleryData = {
    profile,
    resume: buildResumeData(config),
    projects: merged,
    language: config.language ?? 'en',
    theme: config.theme,
    accent: config.accent,
    layout: config.layout,
    builtAt: new Date().toISOString(),
  }

  const outPath = resolve('src/app/public/gallery.json')
  await fs.mkdir('src/app/public', { recursive: true })
  await fs.writeFile(outPath, JSON.stringify(galleryData, null, 2))

  await writeThemeEntry(config.theme)

  console.log(
    `✓ gallery.json assembled (${merged.length} projects from cache)`,
  )
}

main().catch((err) => {
  console.error('Assemble failed:', err)
  process.exit(1)
})
