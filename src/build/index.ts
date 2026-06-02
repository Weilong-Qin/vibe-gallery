import { promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import pLimit from 'p-limit'
import { loadConfig, resolveProjects } from './config.js'
import { createProvider } from './providers/index.js'
import { createExtractor, type Extractor } from './extractor/index.js'
import { fixImagePaths } from './extractor/image.js'
import { generateProfileSummary } from './extractor/profile.js'
import { getCached, setCachedBatch } from './cache.js'
import {
  projectKey,
  inferStatus,
  assembleProfile,
  buildResumeData,
  buildProjectConfigMap,
  writeThemeEntry,
} from './shared.js'
import type {
  GalleryData,
  ProjectConfig,
  ProjectData,
  RepoIdentifier,
} from '../types/index.js'

interface FetchResult {
  cacheKey: string
  data: ProjectData
}

async function fetchSingleProject(
  id: RepoIdentifier,
  projectConfig: ProjectConfig | undefined,
  extractor: Extractor,
  language: 'en' | 'zh' = 'en',
): Promise<FetchResult | null> {
  try {
    const provider = createProvider(id)
    const repoInfo = await provider.fetchRepoInfo(id)
    const cacheKey = `${projectKey(id)}@${repoInfo.sha}`

    const cached = await getCached(cacheKey)
    if (cached) {
      console.log(`  cache hit: ${id.owner}/${id.repo}`)
      return { cacheKey, data: cached }
    }

    console.log(`  fetching: ${id.owner}/${id.repo}`)
    const readme = await provider.fetchReadme(id)
    const displayStats = projectConfig?.display?.stats ?? 'stars'
    const releases =
      displayStats === 'milestones' ? await provider.fetchReleases(id) : []

    const extracted = await extractor.extract(readme, repoInfo, language)
    const fixed = fixImagePaths(
      extracted,
      id.owner,
      id.repo,
      repoInfo.defaultBranch,
    )
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

    const data: ProjectData = {
      id: projectKey(id),
      platform: id.platform,
      repoUrl,
      title: projectConfig?.override?.title ?? id.repo,
      description: finalExtracted.description || '',
      techStack: finalExtracted.techStack ?? [],
      features: finalExtracted.features ?? [],
      heroImage: finalExtracted.heroImage,
      demoUrl: projectConfig?.demo_url,
      screenshots: projectConfig?.screenshots ?? [],
      status: projectConfig?.status ?? inferStatus(repoInfo.pushedAt),
      featured: projectConfig?.featured ?? false,
      display: { stats: displayStats },
    sortWeight: projectConfig?.sort_weight ?? 0,
    }

    if (displayStats === 'stars') {
      data.stats = {
        type: 'stars',
        stars: repoInfo.stars,
        forks: repoInfo.forks,
        watchers: repoInfo.watchers,
        language: repoInfo.language,
      }
    } else if (displayStats === 'milestones') {
      data.stats = {
        type: 'milestones',
        releases: releases.map((r) => ({
          version: r.version,
          date: r.publishedAt,
          summary: r.body?.split('\n')[0] ?? '',
        })),
      }
    }

    return { cacheKey, data }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  ⚠ skipping ${id.owner}/${id.repo}: ${msg}`)
    return null
  }
}

async function main(): Promise<void> {
  console.log('🏗 Building vibe gallery...')
  const config = await loadConfig()
  const identifiers = await resolveProjects(config)
  const projectConfigMap = buildProjectConfigMap(config)

  console.log(`Found ${identifiers.length} repo(s) to process`)

  const extractor = createExtractor()
  const language = config.language ?? 'en'
  const limit = pLimit(2)
  const results = await Promise.all(
    identifiers.map((id) =>
      limit(() =>
        fetchSingleProject(
          id,
          projectConfigMap.get(projectKey(id)),
          extractor,
          language,
        ),
      ),
    ),
  )

  const fetched = results.filter((r): r is FetchResult => r !== null)
  const projects = fetched.map((r) => r.data)

  await setCachedBatch(fetched.map((r) => [r.cacheKey, r.data]))

  const bio = await generateProfileSummary(projects, config.profile)
  const profile = assembleProfile(config.profile, bio, config.import?.github)

  const galleryData: GalleryData = {
    profile,
    resume: buildResumeData(config),
    projects,
    language,
    theme: config.theme,
    accent: config.accent,
    layout: config.layout,
    sort: config.sort,
    builtAt: new Date().toISOString(),
  }

  const outPath = resolve(process.cwd(), 'src/app/data/gallery.json')
  await fs.mkdir(dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, JSON.stringify(galleryData, null, 2))

  await writeThemeEntry(config.theme)

  console.log(`✓ gallery.json written (${projects.length} projects)`)
}

main().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
