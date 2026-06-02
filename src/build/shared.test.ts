import { describe, it, expect } from 'vitest'
import {
  inferIcon,
  inferStatus,
  projectKey,
  identifierFromProjectConfig,
  assembleProfile,
  buildResumeData,
  buildProjectConfigMap,
} from './shared.js'
import type { RepoIdentifier, ProfileConfig, GalleryConfig, ProjectConfig } from '../types/index.js'

const baseGalleryConfig: GalleryConfig = {
  profile: {
    name: 'Alice',
    avatar: 'github',
  },
  theme: 'minimal',
  layout: {
    page: 'sidebar',
    projects: 'featured-first',
    columns: 'auto',
    density: 'comfortable',
  },
  sync: {
    on_push: true,
    schedule: '0 6 * * 1',
  },
  resume: {
    sections: ['skills', 'experience', 'education', 'projects'],
    skills: [],
    experience: [],
    education: [],
  },
}

describe('inferIcon', () => {
  it('maps known keys to correct icons', () => {
    expect(inferIcon('github')).toBe('github')
    expect(inferIcon('x')).toBe('x')
    expect(inferIcon('twitter')).toBe('x')
    expect(inferIcon('email')).toBe('email')
    expect(inferIcon('linkedin')).toBe('linkedin')
    expect(inferIcon('weibo')).toBe('weibo')
  })

  it('is case-insensitive', () => {
    expect(inferIcon('GitHub')).toBe('github')
    expect(inferIcon('EMAIL')).toBe('email')
    expect(inferIcon('Twitter')).toBe('x')
  })

  it('returns "website" for unknown keys', () => {
    expect(inferIcon('blog')).toBe('website')
    expect(inferIcon('portfolio')).toBe('website')
    expect(inferIcon('')).toBe('website')
  })
})

describe('inferStatus', () => {
  it('returns "active" when pushedAt is undefined', () => {
    expect(inferStatus(undefined)).toBe('active')
  })

  it('returns "active" for repos pushed within 3 months', () => {
    const recent = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    expect(inferStatus(recent)).toBe('active')
  })

  it('returns "wip" for repos pushed 4-12 months ago', () => {
    const fiveMonthsAgo = new Date(Date.now() - 5 * 30 * 24 * 60 * 60 * 1000).toISOString()
    expect(inferStatus(fiveMonthsAgo)).toBe('wip')
  })

  it('returns "archived" for repos pushed over 12 months ago', () => {
    const twoYearsAgo = new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000).toISOString()
    expect(inferStatus(twoYearsAgo)).toBe('archived')
  })

  it('treats boundary around 3 months as wip', () => {
    const justOver3Months = new Date(Date.now() - 3.5 * 30 * 24 * 60 * 60 * 1000).toISOString()
    expect(inferStatus(justOver3Months)).toBe('wip')
  })

  it('treats boundary around 12 months as archived', () => {
    const justOver12Months = new Date(Date.now() - 12.5 * 30 * 24 * 60 * 60 * 1000).toISOString()
    expect(inferStatus(justOver12Months)).toBe('archived')
  })
})

describe('projectKey', () => {
  it('formats github identifiers correctly', () => {
    const id: RepoIdentifier = { platform: 'github', owner: 'user', repo: 'repo' }
    expect(projectKey(id)).toBe('github:user/repo')
  })

  it('formats gitee identifiers correctly', () => {
    const id: RepoIdentifier = { platform: 'gitee', owner: 'org', repo: 'project' }
    expect(projectKey(id)).toBe('gitee:org/project')
  })

  it('formats gitea identifiers correctly', () => {
    const id: RepoIdentifier = { platform: 'gitea', owner: 'team', repo: 'app', baseUrl: 'https://git.example.com' }
    expect(projectKey(id)).toBe('gitea:team/app')
  })
})

describe('identifierFromProjectConfig', () => {
  it('parses github project', () => {
    const result = identifierFromProjectConfig({ github: 'owner/repo' } as ProjectConfig)
    expect(result).toEqual({ platform: 'github', owner: 'owner', repo: 'repo' })
  })

  it('parses gitee project', () => {
    const result = identifierFromProjectConfig({ gitee: 'org/project' } as ProjectConfig)
    expect(result).toEqual({ platform: 'gitee', owner: 'org', repo: 'project' })
  })

  it('parses codeup project', () => {
    const result = identifierFromProjectConfig({ codeup: { org: 'myorg', repo: 'myrepo' } } as ProjectConfig)
    expect(result).toEqual({ platform: 'codeup', owner: 'myorg', repo: 'myrepo', org: 'myorg' })
  })

  it('parses gitea project', () => {
    const result = identifierFromProjectConfig({ gitea: { url: 'https://git.example.com', repo: 'owner/app' } } as ProjectConfig)
    expect(result).toEqual({ platform: 'gitea', owner: 'owner', repo: 'app', baseUrl: 'https://git.example.com' })
  })

  it('returns null for invalid github format (missing repo)', () => {
    const result = identifierFromProjectConfig({ github: 'owneronly' } as ProjectConfig)
    expect(result).toBeNull()
  })

  it('returns null for invalid gitea format (missing repo)', () => {
    const result = identifierFromProjectConfig({ gitea: { url: 'https://git.example.com', repo: 'owneronly' } } as ProjectConfig)
    expect(result).toBeNull()
  })

  it('returns null when no platform is specified', () => {
    const result = identifierFromProjectConfig({} as ProjectConfig)
    expect(result).toBeNull()
  })
})

describe('assembleProfile', () => {
  const baseConfig: ProfileConfig = {
    name: 'Alice',
    avatar: 'github',
    links: {
      github: 'https://github.com/alice',
      email: 'alice@example.com',
    },
  }

  it('uses GitHub avatar URL with github username', () => {
    const result = assembleProfile(baseConfig, 'A developer', 'alice')
    expect(result.avatarUrl).toBe('https://github.com/alice.png')
  })

  it('falls back to name for avatar when no github username', () => {
    const result = assembleProfile(baseConfig, 'A developer')
    expect(result.avatarUrl).toBe('https://github.com/Alice.png')
  })

  it('uses custom avatar URL when not "github"', () => {
    const config = { ...baseConfig, avatar: 'https://cdn.example.com/avatar.png' }
    const result = assembleProfile(config, 'A developer')
    expect(result.avatarUrl).toBe('https://cdn.example.com/avatar.png')
  })

  it('adds mailto: prefix for email links', () => {
    const result = assembleProfile(baseConfig, 'A developer')
    const emailLink = result.links.find((l) => l.key === 'email')
    expect(emailLink?.url).toBe('mailto:alice@example.com')
  })

  it('does not double mailto: prefix', () => {
    const config = { ...baseConfig, links: { email: 'mailto:alice@example.com' } }
    const result = assembleProfile(config, 'A developer')
    const emailLink = result.links.find((l) => l.key === 'email')
    expect(emailLink?.url).toBe('mailto:alice@example.com')
  })

  it('maps icon types correctly for social links', () => {
    const result = assembleProfile(baseConfig, 'A developer')
    const githubLink = result.links.find((l) => l.key === 'github')
    expect(githubLink?.icon).toBe('github')
  })

  it('uses provided bio', () => {
    const result = assembleProfile(baseConfig, 'Full-stack developer')
    expect(result.bio).toBe('Full-stack developer')
  })

  it('handles empty links', () => {
    const config = { ...baseConfig, links: undefined }
    const result = assembleProfile(config, 'Bio text')
    expect(result.links).toEqual([])
  })
})

describe('buildResumeData', () => {
  it('builds resume data with defaults', () => {
    const config = baseGalleryConfig

    const result = buildResumeData(config)
    expect(result.sections).toEqual(['skills', 'experience', 'education', 'projects'])
    expect(result.skills).toEqual([])
    expect(result.experience).toEqual([])
    expect(result.education).toEqual([])
  })

  it('includes skills when provided', () => {
    const skills = [{ category: 'Languages', items: ['TypeScript', 'Go'] }]
    const config: GalleryConfig = {
      ...baseGalleryConfig,
      resume: {
        ...baseGalleryConfig.resume,
        sections: ['skills'],
        skills,
      },
    }

    const result = buildResumeData(config)
    expect(result.skills).toEqual(skills)
  })

  it('includes experience when provided', () => {
    const experience = [{
      company: 'TechCo',
      title: 'Engineer',
      period: '2020-2024',
      highlights: ['Built things'],
    }]
    const config: GalleryConfig = {
      ...baseGalleryConfig,
      resume: {
        ...baseGalleryConfig.resume,
        sections: ['experience'],
        experience,
      },
    }

    const result = buildResumeData(config)
    expect(result.experience).toEqual(experience)
  })
})

describe('buildProjectConfigMap', () => {
  it('maps projects by their key', () => {
    const config: GalleryConfig = {
      ...baseGalleryConfig,
      projects: [
        { github: 'owner/repo1', featured: true },
        { github: 'owner/repo2', featured: false },
      ],
    }

    const map = buildProjectConfigMap(config)
    expect(map.get('github:owner/repo1')?.featured).toBe(true)
    expect(map.get('github:owner/repo2')?.featured).toBe(false)
    expect(map.size).toBe(2)
  })

  it('skips invalid project configs', () => {
    const config: GalleryConfig = {
      ...baseGalleryConfig,
      projects: [
        { github: 'invalid-no-slash' },
        { github: 'owner/valid' },
      ],
    }

    const map = buildProjectConfigMap(config)
    expect(map.size).toBe(1)
    expect(map.has('github:owner/valid')).toBe(true)
  })

  it('returns empty map when projects is undefined', () => {
    const config = {} as GalleryConfig
    const map = buildProjectConfigMap(config)
    expect(map.size).toBe(0)
  })
})
