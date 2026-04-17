// ── Config types (user-edited YAML structure) ────────────────────────

export interface GalleryConfig {
  profile: ProfileConfig
  theme: 'minimal' | 'grid' | 'magazine' | 'terminal'
  accent?: string
  layout: LayoutConfig
  display?: { stats: 'stars' | 'milestones' | 'none' }
  resume?: ResumeConfig
  sync?: SyncConfig
  import?: ImportConfig
  projects?: ProjectConfig[]
}

export interface LayoutConfig {
  page: 'single-column' | 'sidebar' | 'hero'
  projects: 'grid' | 'masonry' | 'list' | 'featured-first'
  columns: 1 | 2 | 3 | 'auto'
  density: 'compact' | 'comfortable' | 'spacious'
}

export interface ProfileConfig {
  name: string
  bio?: string
  bio_override?: string
  avatar: 'github' | string
  links?: Record<string, string>
}

export interface ProjectConfig {
  // platform entry (one of)
  github?: string
  gitee?: string
  codeup?: { org: string; repo: string }
  gitea?: { url: string; repo: string }
  // enhancements
  featured?: boolean
  status?: 'active' | 'wip' | 'archived'
  demo_url?: string
  screenshots?: string[]
  display?: { stats: 'stars' | 'milestones' | 'none' }
  override?: Partial<ExtractedData>
}

export interface ResumeConfig {
  sections: ('skills' | 'experience' | 'education' | 'projects')[]
  skills?: SkillCategory[]
  experience?: ExperienceItem[]
  education?: EducationItem[]
}

export interface SyncConfig {
  schedule?: string
  on_push?: boolean
}

export interface ImportConfig {
  github?: string
  exclude?: string[]
  min_stars?: number
  exclude_forks?: boolean  // default: true — skip forked repos
}

// ── Built data types (build output, consumed by frontend) ────────────

export interface GalleryData {
  profile: ProfileData
  resume: ResumeData
  projects: ProjectData[]
  theme: GalleryConfig['theme']
  accent?: string
  layout: LayoutConfig
  builtAt: string
}

export interface ProfileData {
  name: string
  bio: string
  avatarUrl: string
  links: SocialLink[]
}

export interface SocialLink {
  key: string
  url: string
  icon: 'github' | 'x' | 'email' | 'linkedin' | 'website' | 'weibo' | 'generic'
}

export interface ProjectData {
  id: string
  platform: 'github' | 'gitee' | 'codeup' | 'gitea'
  repoUrl: string
  title: string
  description: string
  techStack: string[]
  features: string[]
  heroImage?: string
  demoUrl?: string
  screenshots: string[]
  status: 'active' | 'wip' | 'archived'
  featured: boolean
  display: { stats: 'stars' | 'milestones' | 'none' }
  stats?: StarsData | MilestonesData
}

export interface StarsData {
  type: 'stars'
  stars: number
  forks: number
  watchers: number
  language?: string
}

export interface MilestonesData {
  type: 'milestones'
  releases: { version: string; date: string; summary: string }[]
}

export interface ExtractedData {
  title: string
  description: string
  techStack: string[]
  features: string[]
  heroImage?: string
}

export interface ResumeData {
  sections: ResumeConfig['sections']
  skills: SkillCategory[]
  experience: ExperienceItem[]
  education: EducationItem[]
}

export interface SkillCategory {
  category: string
  items: string[]
}

export interface ExperienceItem {
  company: string
  title: string
  period: string
  location?: string
  highlights?: string[]
}

export interface EducationItem {
  school: string
  degree: string
  period: string
}

// ── Provider types (build-time, raw data from platforms) ─────────────

export interface RepoIdentifier {
  platform: 'github' | 'gitee' | 'codeup' | 'gitea'
  owner: string
  repo: string
  baseUrl?: string
  org?: string
}

export interface RawRepoInfo {
  stars: number
  forks: number
  watchers: number
  language?: string
  defaultBranch: string
  sha: string
  pushedAt?: string  // ISO date, for activity-based status inference
}

export interface RawRelease {
  version: string
  publishedAt: string
  body: string
}

export interface ListReposOptions {
  exclude?: string[]
  minStars?: number
  excludeForks?: boolean  // default: true
}
