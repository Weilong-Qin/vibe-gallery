import { promises as fs } from 'node:fs'
import { join, resolve } from 'node:path'
import type {
  GalleryConfig,
  GalleryData,
  ProfileConfig,
  ProfileData,
  ProjectConfig,
  RepoIdentifier,
  SocialLink,
} from '../types/index.js'

export const ICON_MAP: Record<string, SocialLink['icon']> = {
  github: 'github',
  x: 'x',
  twitter: 'x',
  email: 'email',
  linkedin: 'linkedin',
  weibo: 'weibo',
}

export function inferIcon(key: string): SocialLink['icon'] {
  return ICON_MAP[key.toLowerCase()] ?? 'website'
}

export function inferStatus(pushedAt?: string): 'active' | 'wip' | 'archived' {
  if (!pushedAt) return 'active'
  const monthsSince = (Date.now() - new Date(pushedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
  if (monthsSince > 12) return 'archived'
  if (monthsSince > 3) return 'wip'
  return 'active'
}

export function projectKey(id: RepoIdentifier): string {
  return `${id.platform}:${id.owner}/${id.repo}`
}

export function identifierFromProjectConfig(
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
    return { platform: 'gitea', owner, repo, baseUrl: project.gitea.url }
  }
  return null
}

export function assembleProfile(
  config: ProfileConfig,
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

export function buildResumeData(config: GalleryConfig) {
  return {
    sections: config.resume.sections,
    skills: config.resume.skills ?? [],
    experience: config.resume.experience ?? [],
    education: config.resume.education ?? [],
  }
}

export function buildProjectConfigMap(config: GalleryConfig): Map<string, ProjectConfig> {
  const map = new Map<string, ProjectConfig>()
  for (const p of config.projects ?? []) {
    const id = identifierFromProjectConfig(p)
    if (id) map.set(projectKey(id), p)
  }
  return map
}

export async function writeThemeEntry(theme: string): Promise<void> {
  const themesDir = resolve('src/app/themes')
  await fs.mkdir(themesDir, { recursive: true })
  const cssPath = join(themesDir, 'theme-entry.css')
  await fs.writeFile(cssPath, `@import './${theme}.css';\n`)
}

export function injectHtmlMeta(html: string, galleryData: GalleryData): string {
  const title = `${galleryData.profile.name}'s Gallery`
  const description = galleryData.profile.bio
    ? galleryData.profile.bio.slice(0, 160)
    : `${galleryData.profile.name}'s project gallery`
  const ogImage = galleryData.profile.avatarUrl ?? ''
  const lang = galleryData.language ?? 'en'

  // Strip previously injected meta tags (marked with data-gallery attribute)
  html = html.replace(/\s*<meta[^>]*data-gallery[^>]*\/>/g, '')

  // Update <title>
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${escapeHtml(title)}</title>`,
  )

  // Update <html lang>
  html = html.replace(
    /<html lang="[^"]*">/,
    `<html lang="${lang}">`,
  )

  // Insert meta tags before </head>, each marked with data-gallery for idempotent re-runs
  const metaLines = [
    `<meta name="description" content="${escapeHtml(description)}" data-gallery />`,
    `<meta property="og:title" content="${escapeHtml(title)}" data-gallery />`,
    `<meta property="og:description" content="${escapeHtml(description)}" data-gallery />`,
    ogImage
      ? `<meta property="og:image" content="${escapeHtml(ogImage)}" data-gallery />`
      : '',
    `<meta property="og:type" content="website" data-gallery />`,
    `<meta name="twitter:card" content="summary_large_image" data-gallery />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" data-gallery />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" data-gallery />`,
  ]
    .filter(Boolean)
    .join('\n    ')

  html = html.replace(
    '</head>',
    `    ${metaLines}\n  </head>`,
  )

  return html
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
