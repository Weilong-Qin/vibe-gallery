import type { ExtractedData, RawRepoInfo } from '../../types/index.js'
import type { Extractor } from './index.js'

const KNOWN_TECH = [
  'React',
  'Vue',
  'Angular',
  'Svelte',
  'Next',
  'Nuxt',
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Rust',
  'Java',
  'Kotlin',
  'Swift',
  'C++',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'MySQL',
  'Redis',
  'MongoDB',
  'GraphQL',
  'REST',
  'AWS',
  'GCP',
  'Azure',
]

const TECH_HEADING_KEYWORDS = ['tech', 'built with', 'stack', 'technologies']
const FEATURE_HEADING_KEYWORDS = [
  'feature',
  'what it does',
  'highlight',
  'capability',
]

const BADGE_PATTERNS = [
  'shields.io',
  'badge',
  'img.shields',
  'github/workflows',
]

function stripBadges(line: string): string {
  // Remove inline images and reference-style badges
  let s = line.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  s = s.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '')
  return s.trim()
}

function extractTitle(readme: string): string | null {
  const lines = readme.split('\n')
  for (const line of lines) {
    const m = /^#\s+(.+)$/.exec(line.trim())
    if (m) {
      const title = stripBadges(m[1]).trim()
      if (title) return title
    }
  }
  return null
}

function extractDescription(readme: string): string | null {
  const lines = readme.split('\n')
  let pastTitle = false
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!pastTitle) {
      if (/^#\s+/.test(line)) {
        pastTitle = true
      }
      continue
    }
    if (!line) continue
    // Skip badge / image / html / heading lines
    if (
      line.startsWith('!') ||
      line.startsWith('[') ||
      line.startsWith('<') ||
      line.startsWith('#')
    ) {
      continue
    }
    return line
  }
  return null
}

interface Section {
  heading: string
  body: string[]
}

function parseSections(readme: string): Section[] {
  const lines = readme.split('\n')
  const sections: Section[] = []
  let current: Section | null = null
  for (const line of lines) {
    const m = /^#{1,6}\s+(.+)$/.exec(line)
    if (m) {
      if (current) sections.push(current)
      current = { heading: m[1].trim(), body: [] }
    } else if (current) {
      current.body.push(line)
    }
  }
  if (current) sections.push(current)
  return sections
}

function extractListItems(body: string[]): string[] {
  const items: string[] = []
  for (const line of body) {
    const m = /^\s*[-*+]\s+(.+)$/.exec(line)
    if (m) {
      const item = stripBadges(m[1]).trim()
      if (item) items.push(item)
    }
  }
  return items
}

function findSection(
  sections: Section[],
  keywords: string[],
): Section | null {
  for (const s of sections) {
    const h = s.heading.toLowerCase()
    if (keywords.some((kw) => h.includes(kw))) return s
  }
  return null
}

function extractTechStack(readme: string): string[] {
  const found = new Set<string>()
  const sections = parseSections(readme)
  const techSection = findSection(sections, TECH_HEADING_KEYWORDS)
  if (techSection) {
    for (const item of extractListItems(techSection.body)) {
      found.add(item)
    }
  }

  // Scan for known tech keywords across the whole README
  for (const tech of KNOWN_TECH) {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`\\b${escaped}\\b`, 'i')
    if (re.test(readme)) {
      // Avoid duplicating items that are already present (case-insensitive match)
      const lower = tech.toLowerCase()
      let already = false
      for (const existing of found) {
        if (existing.toLowerCase() === lower) {
          already = true
          break
        }
      }
      if (!already) found.add(tech)
    }
  }

  return Array.from(found)
}

function extractFeatures(readme: string): string[] {
  const sections = parseSections(readme)
  const featureSection = findSection(sections, FEATURE_HEADING_KEYWORDS)
  if (!featureSection) return []
  return extractListItems(featureSection.body).slice(0, 6)
}

function extractHeroImage(readme: string): string | undefined {
  const re = /!\[[^\]]*\]\(([^)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(readme)) !== null) {
    const url = match[1].trim()
    if (!url) continue
    const lower = url.toLowerCase()
    if (BADGE_PATTERNS.some((p) => lower.includes(p))) continue
    return url
  }
  return undefined
}

export class HeuristicExtractor implements Extractor {
  async extract(
    readme: string,
    repoInfo: RawRepoInfo,
  ): Promise<ExtractedData> {
    const repoInfoAny = repoInfo as RawRepoInfo & {
      name?: string
      description?: string
    }
    return {
      title: extractTitle(readme) ?? repoInfoAny.name ?? '',
      description:
        extractDescription(readme) ?? repoInfoAny.description ?? '',
      techStack: extractTechStack(readme),
      features: extractFeatures(readme),
      heroImage: extractHeroImage(readme),
    }
  }
}
