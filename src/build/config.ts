import { readFile } from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path'
import yaml from 'js-yaml'
import { z } from 'zod'
import type { GalleryConfig, RepoIdentifier } from '../types/index.js'

// ── Layout ───────────────────────────────────────────────────────────

const LayoutConfigSchema = z.object({
  page: z.enum(['single-column', 'sidebar', 'hero']).default('single-column'),
  projects: z.enum(['grid', 'masonry', 'list', 'featured-first']).default('grid'),
  columns: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal('auto')])
    .default(2),
  density: z.enum(['compact', 'comfortable', 'spacious']).default('comfortable'),
})

// ── Profile ──────────────────────────────────────────────────────────

const ProfileConfigSchema = z.object({
  name: z.string().min(1, 'profile.name is required'),
  bio: z.string().optional(),
  bio_override: z.string().optional(),
  avatar: z.string().default('github'),
  links: z.record(z.string()).optional(),
})

// ── Project ──────────────────────────────────────────────────────────

const OverrideSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  heroImage: z.string().optional(),
})

const ProjectConfigSchema = z
  .object({
    github: z.string().optional(),
    gitee: z.string().optional(),
    codeup: z.object({ org: z.string(), repo: z.string() }).optional(),
    gitea: z.object({ url: z.string(), repo: z.string() }).optional(),
    featured: z.boolean().default(false),
    status: z.enum(['active', 'wip', 'archived']).default('active'),
    demo_url: z.string().url().optional(),
    screenshots: z.array(z.string()).default([]),
    display: z
      .object({ stats: z.enum(['stars', 'milestones', 'none']) })
      .default({ stats: 'stars' }),
    override: OverrideSchema.optional(),
  })
  .refine(
    (p) => [p.github, p.gitee, p.codeup, p.gitea].filter(Boolean).length === 1,
    {
      message:
        'Each project must specify exactly one platform (github, gitee, codeup, or gitea)',
    },
  )

// ── Resume ───────────────────────────────────────────────────────────

const SkillCategorySchema = z.object({
  category: z.string().min(1),
  items: z.array(z.string()),
})

const ExperienceItemSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  period: z.string().min(1),
  location: z.string().optional(),
  highlights: z.array(z.string()).optional(),
})

const EducationItemSchema = z.object({
  school: z.string().min(1),
  degree: z.string().min(1),
  period: z.string().min(1),
})

const ResumeConfigSchema = z.object({
  sections: z.array(z.enum(['skills', 'experience', 'education', 'projects'])),
  skills: z.array(SkillCategorySchema).optional(),
  experience: z.array(ExperienceItemSchema).optional(),
  education: z.array(EducationItemSchema).optional(),
})

// ── Sync ─────────────────────────────────────────────────────────────

const SyncConfigSchema = z.object({
  schedule: z.string().optional(),
  on_push: z.boolean().optional(),
})

// ── Import ───────────────────────────────────────────────────────────

const ImportConfigSchema = z.object({
  github: z.string().optional(),
  exclude: z.array(z.string()).optional(),
  min_stars: z.number().int().nonnegative().optional(),
  exclude_forks: z.boolean().default(true),
})

// ── Root ─────────────────────────────────────────────────────────────

export const GalleryConfigSchema = z.object({
  profile: ProfileConfigSchema,
  language: z.enum(['en', 'zh']).default('en'),
  theme: z.enum(['minimal', 'grid', 'magazine', 'terminal']).default('minimal'),
  accent: z.string().optional(),
  layout: LayoutConfigSchema.default({
    page: 'single-column',
    projects: 'grid',
    columns: 2,
    density: 'comfortable',
  }),
  display: z
    .object({ stats: z.enum(['stars', 'milestones', 'none']) })
    .optional(),
  resume: ResumeConfigSchema.optional(),
  sync: SyncConfigSchema.optional(),
  import: ImportConfigSchema.optional(),
  projects: z.array(ProjectConfigSchema).optional(),
})

function normalizeGitHubUser(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return trimmed

  // Accept both plain username and full profile URL.
  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^@/, '')
  }

  try {
    const url = new URL(trimmed)
    if (url.hostname.toLowerCase() !== 'github.com') return trimmed
    const firstPath = url.pathname.split('/').filter(Boolean)[0]
    return firstPath ? firstPath.replace(/^@/, '') : trimmed
  } catch {
    return trimmed
  }
}

// Type sanity check — schema-inferred shape should be assignable to GalleryConfig
export type GalleryConfigInferred = z.infer<typeof GalleryConfigSchema>

// ── loadConfig ───────────────────────────────────────────────────────

function formatZodError(err: z.ZodError): string {
  const lines: string[] = ['Invalid gallery config:']
  for (const issue of err.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
    lines.push(`  - ${path}: ${issue.message}`)
  }
  // Also include flattened summary for tooling that wants it
  const flat = err.flatten()
  if (flat.formErrors.length > 0) {
    for (const msg of flat.formErrors) {
      lines.push(`  - (root): ${msg}`)
    }
  }
  return lines.join('\n')
}

export async function loadConfig(
  configPath: string = 'gallery.config.yaml',
): Promise<GalleryConfig> {
  const absPath = resolvePath(process.cwd(), configPath)
  const raw = await readFile(absPath, 'utf8')
  const parsed = yaml.load(raw)

  try {
    const validated = GalleryConfigSchema.parse(parsed)

    if (validated.import?.github) {
      validated.import.github = normalizeGitHubUser(validated.import.github)
    }

    return validated as GalleryConfig
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error(formatZodError(err))
    }
    throw err
  }
}

// ── resolveProjects ──────────────────────────────────────────────────

function projectToRepoIdentifier(
  project: z.infer<typeof ProjectConfigSchema>,
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

export function resolveProjects(config: GalleryConfig): RepoIdentifier[] {
  const identifiers: RepoIdentifier[] = []

  // import.github → placeholder; actual listing happens at runtime in the build pipeline
  if (config.import?.github) {
    // intentional no-op placeholder
  }

  for (const project of config.projects ?? []) {
    const id = projectToRepoIdentifier(
      project as z.infer<typeof ProjectConfigSchema>,
    )
    if (id) identifiers.push(id)
  }

  // Deduplicate by `${platform}:${owner}/${repo}`
  const seen = new Set<string>()
  const unique: RepoIdentifier[] = []
  for (const id of identifiers) {
    const key = `${id.platform}:${id.owner}/${id.repo}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(id)
  }
  return unique
}
