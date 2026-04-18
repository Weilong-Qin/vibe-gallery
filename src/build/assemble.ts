/**
 * Fast re-assembly: reads project data from local cache + current gallery.config.yaml,
 * skips all GitHub API calls and LLM analysis. Use this when changing theme, layout,
 * profile info, or resume sections without wanting to re-fetch project data.
 *
 * Usage: npm run build:assemble
 */
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { loadConfig } from './config.js'
import type { GalleryData, ProjectData, ProfileData, SocialLink } from '../types/index.js'

const CACHE_FILE = resolve(process.cwd(), '.gallery-cache.json')

const ICON_MAP: Record<string, SocialLink['icon']> = {
  github: 'github', x: 'x', twitter: 'x', email: 'email',
  linkedin: 'linkedin', weibo: 'weibo',
}

function inferIcon(key: string): SocialLink['icon'] {
  return ICON_MAP[key.toLowerCase()] ?? 'website'
}

function assembleProfile(
  config: Awaited<ReturnType<typeof loadConfig>>['profile'],
  githubUsername?: string,
): ProfileData {
  const avatarUrl = config.avatar === 'github'
    ? `https://github.com/${githubUsername ?? config.name}.png`
    : config.avatar

  const links: SocialLink[] = Object.entries(config.links ?? {}).map(([key, url]) => ({
    key,
    url: key.toLowerCase() === 'email' && !url.startsWith('mailto:') ? `mailto:${url}` : url,
    icon: inferIcon(key),
  }))

  return { name: config.name, bio: config.bio_override ?? config.bio ?? '', avatarUrl, links }
}

async function main() {
  console.log('⚡ Assembling gallery from cache...')
  const config = await loadConfig()

  // Read all cached projects
  let cache: Record<string, ProjectData> = {}
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf-8')
    cache = JSON.parse(raw) as Record<string, ProjectData>
  } catch {
    console.warn('⚠ No cache found (.gallery-cache.json). Run npm run build:data first.')
    process.exit(1)
  }

  // Collect unique projects from cache (latest entry per repo key)
  const seen = new Map<string, ProjectData>()
  for (const project of Object.values(cache)) {
    const existing = seen.get(project.id)
    if (!existing) seen.set(project.id, project)
  }

  const projects = [...seen.values()]

  // Apply any config-level overrides (featured, status, demo_url, etc.)
  const projectConfigMap = new Map<string, NonNullable<typeof config.projects>[number]>()
  for (const p of config.projects ?? []) {
    if (p.github) {
      const [owner, repo] = p.github.split('/')
      if (owner && repo) projectConfigMap.set(`github:${owner}/${repo}`, p)
    }
  }

  const merged = projects.map(p => {
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

  const profile = assembleProfile(config.profile, config.import?.github)

  const galleryData: GalleryData = {
    profile,
    resume: {
      sections: config.resume?.sections ?? [],
      skills: config.resume?.skills ?? [],
      experience: config.resume?.experience ?? [],
      education: config.resume?.education ?? [],
    },
    projects: merged,
    language: config.language ?? 'en',
    theme: config.theme,
    accent: config.accent,
    layout: config.layout,
    builtAt: new Date().toISOString(),
  }

  const outPath = resolve('src/app/data/gallery.json')
  await fs.writeFile(outPath, JSON.stringify(galleryData, null, 2))
  console.log(`✓ gallery.json assembled (${merged.length} projects from cache)`)
}

main().catch(err => {
  console.error('Assemble failed:', err)
  process.exit(1)
})
