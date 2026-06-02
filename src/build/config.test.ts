import { describe, it, expect } from 'vitest'
import { GalleryConfigSchema } from './config.js'

describe('GalleryConfigSchema', () => {
  const minimalValid = {
    profile: { name: 'Test User' },
  }

  it('accepts minimal valid config with defaults', () => {
    const result = GalleryConfigSchema.parse(minimalValid)
    expect(result.profile.name).toBe('Test User')
    expect(result.language).toBe('en')
    expect(result.theme).toBe('minimal')
    expect(result.layout.page).toBe('sidebar')
    expect(result.layout.projects).toBe('featured-first')
    expect(result.layout.columns).toBe('auto')
    expect(result.layout.density).toBe('comfortable')
  })

  it('applies all layout defaults', () => {
    const result = GalleryConfigSchema.parse(minimalValid)
    expect(result.layout).toEqual({
      page: 'sidebar',
      projects: 'featured-first',
      columns: 'auto',
      density: 'comfortable',
    })
  })

  it('applies resume defaults', () => {
    const result = GalleryConfigSchema.parse(minimalValid)
    expect(result.resume.sections).toEqual(['skills', 'experience', 'education', 'projects'])
  })

  it('applies sync defaults', () => {
    const result = GalleryConfigSchema.parse(minimalValid)
    expect(result.sync.on_push).toBe(true)
  })

  it('validates language enum', () => {
    expect(() => GalleryConfigSchema.parse({ ...minimalValid, language: 'fr' })).toThrow()
    expect(() => GalleryConfigSchema.parse({ ...minimalValid, language: 'en' })).not.toThrow()
    expect(() => GalleryConfigSchema.parse({ ...minimalValid, language: 'zh' })).not.toThrow()
  })

  it('validates theme enum', () => {
    expect(() => GalleryConfigSchema.parse({ ...minimalValid, theme: 'dark' })).toThrow()
    const result = GalleryConfigSchema.parse({ ...minimalValid, theme: 'terminal' })
    expect(result.theme).toBe('terminal')
  })

  it('validates project with exactly one platform', () => {
    const withProject = {
      ...minimalValid,
      projects: [{ github: 'owner/repo' }],
    }
    const result = GalleryConfigSchema.parse(withProject)
    expect(result.projects).toHaveLength(1)
    expect(result.projects![0].github).toBe('owner/repo')
  })

  it('rejects project with no platform', () => {
    const withProject = {
      ...minimalValid,
      projects: [{}],
    }
    expect(() => GalleryConfigSchema.parse(withProject)).toThrow()
  })

  it('rejects project with multiple platforms', () => {
    const withProject = {
      ...minimalValid,
      projects: [{ github: 'owner/repo', gitee: 'owner/repo2' }],
    }
    expect(() => GalleryConfigSchema.parse(withProject)).toThrow()
  })

  it('accepts gitee as platform', () => {
    const withProject = {
      ...minimalValid,
      projects: [{ gitee: 'owner/repo' }],
    }
    const result = GalleryConfigSchema.parse(withProject)
    expect(result.projects![0].gitee).toBe('owner/repo')
  })

  it('accepts codeup as platform', () => {
    const withProject = {
      ...minimalValid,
      projects: [{ codeup: { org: 'myorg', repo: 'myrepo' } }],
    }
    const result = GalleryConfigSchema.parse(withProject)
    expect(result.projects![0].codeup).toEqual({ org: 'myorg', repo: 'myrepo' })
  })

  it('accepts gitea as platform', () => {
    const withProject = {
      ...minimalValid,
      projects: [{ gitea: { url: 'https://git.example.com', repo: 'owner/repo' } }],
    }
    const result = GalleryConfigSchema.parse(withProject)
    expect(result.projects![0].gitea).toEqual({ url: 'https://git.example.com', repo: 'owner/repo' })
  })

  it('applies project defaults', () => {
    const withProject = {
      ...minimalValid,
      projects: [{ github: 'owner/repo' }],
    }
    const result = GalleryConfigSchema.parse(withProject)
    expect(result.projects![0].featured).toBe(false)
    expect(result.projects![0].status).toBe('active')
    expect(result.projects![0].screenshots).toEqual([])
    expect(result.projects![0].sort_weight).toBe(0)
    expect(result.projects![0].display.stats).toBe('stars')
  })

  it('validates project status enum', () => {
    const withProject = {
      ...minimalValid,
      projects: [{ github: 'owner/repo', status: 'invalid' }],
    }
    expect(() => GalleryConfigSchema.parse(withProject)).toThrow()
  })

  it('validates profile.name is required', () => {
    expect(() => GalleryConfigSchema.parse({ profile: {} })).toThrow()
  })

  it('validates profile.name is non-empty', () => {
    expect(() => GalleryConfigSchema.parse({ profile: { name: '' } })).toThrow()
  })

  it('accepts accent as optional string', () => {
    const result = GalleryConfigSchema.parse({ ...minimalValid, accent: '#00ff88' })
    expect(result.accent).toBe('#00ff88')
  })

  it('accepts import config with defaults', () => {
    const withImport = {
      ...minimalValid,
      import: { github: 'someuser' },
    }
    const result = GalleryConfigSchema.parse(withImport)
    expect(result.import?.github).toBe('someuser')
    expect(result.import?.exclude_forks).toBe(true)
  })

  it('validates sort config', () => {
    const withSort = {
      ...minimalValid,
      sort: { by: 'stars' },
    }
    const result = GalleryConfigSchema.parse(withSort)
    expect(result.sort?.by).toBe('stars')
  })

  it('rejects invalid sort mode', () => {
    const withSort = {
      ...minimalValid,
      sort: { by: 'invalid' },
    }
    expect(() => GalleryConfigSchema.parse(withSort)).toThrow()
  })

  it('validates display stats enum', () => {
    const withDisplay = {
      ...minimalValid,
      display: { stats: 'milestones' },
    }
    const result = GalleryConfigSchema.parse(withDisplay)
    expect(result.display?.stats).toBe('milestones')
  })

  it('validates layout page enum', () => {
    expect(() =>
      GalleryConfigSchema.parse({ ...minimalValid, layout: { page: 'invalid' } })
    ).toThrow()
  })

  it('validates layout columns accepts 1, 2, 3, or "auto"', () => {
    for (const cols of [1, 2, 3, 'auto']) {
      const result = GalleryConfigSchema.parse({ ...minimalValid, layout: { columns: cols } })
      expect(result.layout.columns).toBe(cols)
    }
    expect(() =>
      GalleryConfigSchema.parse({ ...minimalValid, layout: { columns: 4 } })
    ).toThrow()
  })

  it('validates demo_url as valid URL when provided', () => {
    const withProject = {
      ...minimalValid,
      projects: [{ github: 'owner/repo', demo_url: 'not-a-url' }],
    }
    expect(() => GalleryConfigSchema.parse(withProject)).toThrow()
  })

  it('accepts valid demo_url', () => {
    const withProject = {
      ...minimalValid,
      projects: [{ github: 'owner/repo', demo_url: 'https://demo.example.com' }],
    }
    const result = GalleryConfigSchema.parse(withProject)
    expect(result.projects![0].demo_url).toBe('https://demo.example.com')
  })

  it('handles profile links as record of strings', () => {
    const withLinks = {
      ...minimalValid,
      profile: {
        name: 'User',
        links: {
          github: 'https://github.com/user',
          website: 'https://user.dev',
        },
      },
    }
    const result = GalleryConfigSchema.parse(withLinks)
    expect(result.profile.links).toEqual({
      github: 'https://github.com/user',
      website: 'https://user.dev',
    })
  })
})
