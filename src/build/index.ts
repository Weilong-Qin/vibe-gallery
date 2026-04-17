import { promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import pLimit from 'p-limit'
import { loadConfig, resolveProjects } from './config.js'
import { createProvider } from './providers/index.js'
import { createExtractor, type Extractor } from './extractor/index.js'
import { fixImagePaths } from './extractor/image.js'
import { generateProfileSummary } from './extractor/profile.js'
import { getCached, setCached } from './cache.js'
import type {
  GalleryConfig,
  GalleryData,
  ProfileData,
  ProjectConfig,
  ProjectData,
  RepoIdentifier,
  SocialLink,
} from '../types/index.js'

const ICON_MAP: Record<string, SocialLink['icon']> = {
  github: 'github',
  x: 'x',
  twitter: 'x',
  email: 'email',
  linkedin: 'linkedin',
  weibo: 'weibo',
}

function inferStatus(pushedAt?: string): 'active' | 'wip' | 'archived' {
  if (!pushedAt) return 'active'
  const monthsSince = (Date.now() - new Date(pushedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
  if (monthsSince > 12) return 'archived'
  if (monthsSince > 3) return 'wip'
  return 'active'
}

function inferIcon(key: string): SocialLink['icon'] {
  return ICON_MAP[key.toLowerCase()] ?? 'website'
}

function projectKey(id: RepoIdentifier): string {
  return `${id.platform}:${id.owner}/${id.repo}`
}

function identifierFromProjectConfig(
  project: ProjectConfig,
): RepoIdentifier | null {
  if (project.github) {
    const [owner, repo] = project.github.split('/')
    if (!owner || !repo) return null
    return { platform: 'github', owner, repo }
  }
  if (project.gitee) {
    const [owner, repo] = project.gitee.split('/')
    if (!owner || !repo) return null
    return { platform: 'gitee', owner, repo }
  }
  if (project.codeup) {
    return {
      platform: 'codeup',
      owner: project.codeup.org,
      repo: project.codeup.repo,
      org: project.codeup.org,
    }
  }
  if (project.gitea) {
    const [owner, repo] = project.gitea.repo.split('/')
    if (!owner || !repo) return null
    return {
      platform: 'gitea',
      owner,
      repo,
      baseUrl: project.gitea.url,
    }
  }
  return null
}

function assembleProfile(
  config: GalleryConfig['profile'],
  bio: string,
  githubUsername?: string,
): ProfileData {
  const avatarUrl =
    config.avatar === 'github'
      ? `https://github.com/${githubUsername ?? config.name}.png`
      : config.avatar

  const links: SocialLink[] = Object.entries(config.links ?? {}).map(
    ([key, url]) => ({
      key,
      url:
        key.toLowerCase() === 'email' && !url.startsWith('mailto:')
          ? `mailto:${url}`
          : url,
      icon: inferIcon(key),
    }),
  )

  return { name: config.name, bio, avatarUrl, links }
}

async function fetchSingleProject(
  id: RepoIdentifier,
  projectConfig: ProjectConfig | undefined,
  extractor: Extractor,
): Promise<ProjectData | null> {
  try {
    const provider = createProvider(id)
    const repoInfo = await provider.fetchRepoInfo(id)
    const cacheKey = `${projectKey(id)}@${repoInfo.sha}`

    const cached = await getCached(cacheKey)
    if (cached) {
      console.log(`  cache hit: ${id.owner}/${id.repo}`)
      return cached
    }

    console.log(`  fetching: ${id.owner}/${id.repo}`)
    const readme = await provider.fetchReadme(id)
    const displayStats = projectConfig?.display?.stats ?? 'stars'

    const releases =
      displayStats === 'milestones' ? await provider.fetchReleases(id) : []

    const extracted = await extractor.extract(readme, repoInfo)
    const fixed = fixImagePaths(extracted, id.owner, id.repo, repoInfo.defaultBranch)

    const override = projectConfig?.override ?? {}
    const finalExtracted = {
      ...fixed,
      ...Object.fromEntries(
        Object.entries(override).filter(([, v]) => v !== undefined),
      ),
    }

    const repoUrl =
      id.platform === 'github'
        ? `https://github.com/${id.owner}/${id.repo}`
        : id.platform === 'gitee'
          ? `https://gitee.com/${id.owner}/${id.repo}`
          : id.platform === 'gitea' && id.baseUrl
            ? `${id.baseUrl.replace(/\/+$/, '')}/${id.owner}/${id.repo}`
            : `${id.platform}:${id.owner}/${id.repo}`

    const project: ProjectData = {
      id: projectKey(id),
      platform: id.platform,
      repoUrl,
      title: finalExtracted.title || id.repo,
      description: finalExtracted.description || '',
      techStack: finalExtracted.techStack ?? [],
      features: finalExtracted.features ?? [],
      heroImage: finalExtracted.heroImage,
      demoUrl: projectConfig?.demo_url,
      screenshots: projectConfig?.screenshots ?? [],
      status: projectConfig?.status ?? inferStatus(repoInfo.pushedAt),
      featured: projectConfig?.featured ?? false,
      display: { stats: displayStats },
    }

    if (displayStats === 'stars') {
      project.stats = {
        type: 'stars',
        stars: repoInfo.stars,
        forks: repoInfo.forks,
        watchers: repoInfo.watchers,
        language: repoInfo.language,
      }
    } else if (displayStats === 'milestones') {
      project.stats = {
        type: 'milestones',
        releases: releases.map((r) => ({
          version: r.version,
          date: r.publishedAt,
          summary: r.body?.split('\n')[0] ?? '',
        })),
      }
    }

    await setCached(cacheKey, project)
    return project
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  ⚠ skipping ${id.owner}/${id.repo}: ${msg}`)
    return null
  }
}

async function main(): Promise<void> {
  console.log('🏗  Building vibe gallery...')
  const config = await loadConfig()

  const identifiers = resolveProjects(config)

  // Build lookup map for project configs (match by key)
  const projectConfigMap = new Map<string, ProjectConfig>()
  for (const p of config.projects ?? []) {
    const id = identifierFromProjectConfig(p)
    if (id) projectConfigMap.set(projectKey(id), p)
  }

  // Import from github account if configured
  if (config.import?.github) {
    const importId: RepoIdentifier = {
      platform: 'github',
      owner: config.import.github,
      repo: '',
    }
    try {
      const provider = createProvider(importId)
      const imported = await provider.listUserRepos(config.import.github, {
        exclude: config.import.exclude ?? [],
        minStars: config.import.min_stars ?? 0,
        excludeForks: config.import.exclude_forks ?? true,
      })
      const existing = new Set(identifiers.map((id) => projectKey(id)))
      for (const id of imported) {
        const key = projectKey(id)
        if (!existing.has(key)) {
          identifiers.push(id)
          existing.add(key)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(
        `⚠ Failed to import repos for ${config.import.github}: ${msg}`,
      )
    }
  }

  console.log(`Found ${identifiers.length} repo(s) to process`)

  const extractor = createExtractor()
  const limit = pLimit(2)

  const results = await Promise.all(
    identifiers.map((id) =>
      limit(() =>
        fetchSingleProject(id, projectConfigMap.get(projectKey(id)), extractor),
      ),
    ),
  )

  const projects = results.filter((p): p is ProjectData => p !== null)

  const bio = await generateProfileSummary(projects, config.profile)
  const profile = assembleProfile(
    config.profile,
    bio,
    config.import?.github,
  )

  const galleryData: GalleryData = {
    profile,
    resume: {
      sections: config.resume?.sections ?? [],
      skills: config.resume?.skills ?? [],
      experience: config.resume?.experience ?? [],
      education: config.resume?.education ?? [],
    },
    projects,
    theme: config.theme,
    accent: config.accent,
    layout: config.layout,
    builtAt: new Date().toISOString(),
  }

  const outPath = resolve(process.cwd(), 'src/app/data/gallery.json')
  await fs.mkdir(dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, JSON.stringify(galleryData, null, 2))
  console.log(`✓ gallery.json written (${projects.length} projects)`)
}

main().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
