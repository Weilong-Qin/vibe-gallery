import { describe, it, expect } from 'vitest'
import { HeuristicExtractor } from './heuristic.js'
import type { RawRepoInfo } from '../../types/index.js'

const baseRepoInfo: RawRepoInfo = {
  stars: 100,
  forks: 20,
  watchers: 50,
  language: 'TypeScript',
  defaultBranch: 'main',
  sha: 'abc123',
}

describe('HeuristicExtractor', () => {
  const extractor = new HeuristicExtractor()

  it('extracts title from first h1', async () => {
    const readme = '# My Project\n\nSome description here.'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.title).toBe('My Project')
  })

  it('extracts description as first non-empty paragraph after title', async () => {
    const readme = '# My Project\n\nThis is a cool project that does things.'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.description).toBe('This is a cool project that does things.')
  })

  it('skips badge lines for description', async () => {
    const readme = '# My Project\n\n[![Build](https://img.shields.io/build)](https://example.com)\n\nActual description here.'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.description).toBe('Actual description here.')
  })

  it('skips image lines for description', async () => {
    const readme = '# My Project\n\n![Screenshot](screenshot.png)\n\nDescription after image.'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.description).toBe('Description after image.')
  })

  it('skips HTML lines for description', async () => {
    const readme = '# My Project\n\n<div>Some HTML</div>\n\nReal description.'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.description).toBe('Real description.')
  })

  it('extracts tech stack from known keywords in README', async () => {
    const readme = '# My Project\n\nBuilt with React and TypeScript.'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.techStack).toContain('React')
    expect(result.techStack).toContain('TypeScript')
  })

  it('extracts tech stack from dedicated section', async () => {
    const readme = '# My Project\n\n## Tech Stack\n\n- React\n- Go\n- PostgreSQL'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.techStack).toContain('React')
    expect(result.techStack).toContain('Go')
    expect(result.techStack).toContain('PostgreSQL')
  })

  it('does not duplicate tech stack entries (case-insensitive)', async () => {
    const readme = '# My Project\n\n## Tech Stack\n\n- React\n\nUses React for the frontend.'
    const result = await extractor.extract(readme, baseRepoInfo)
    const reactCount = result.techStack.filter((t) => t.toLowerCase() === 'react').length
    expect(reactCount).toBe(1)
  })

  it('extracts features from features section', async () => {
    const readme = '# My Project\n\n## Features\n\n- Fast rendering\n- Dark mode\n- Responsive design'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.features).toEqual(['Fast rendering', 'Dark mode', 'Responsive design'])
  })

  it('limits features to 6 items', async () => {
    const features = Array.from({ length: 10 }, (_, i) => `- Feature ${i + 1}`).join('\n')
    const readme = `# My Project\n\n## Features\n\n${features}`
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.features.length).toBeLessThanOrEqual(6)
  })

  it('strips badges from list items', async () => {
    const readme = '# My Project\n\n## Features\n\n- ![badge](https://img.shields.io/npm/v/foo) Real feature'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.features.length).toBeGreaterThanOrEqual(1)
    // The badge should be stripped, leaving just the text
    expect(result.features[0]).not.toContain('img.shields')
  })

  it('extracts hero image from first non-badge image', async () => {
    const readme = '# My Project\n\n[![Build](https://img.shields.io/build)](url)\n\n![Hero Image](https://example.com/hero.png)'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.heroImage).toBe('https://example.com/hero.png')
  })

  it('skips badge images for hero image', async () => {
    const readme = '# My Project\n\n[![Build Status](https://img.shields.io/travis/user/repo)](https://travis-ci.org/user/repo)'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.heroImage).toBeUndefined()
  })

  it('skips GitHub workflow badge images for hero image', async () => {
    const readme = '# My Project\n\n![CI](https://github.com/workflows/badge.svg)'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.heroImage).toBeUndefined()
  })

  it('returns empty arrays when no tech stack or features found', async () => {
    const readme = '# My Project\n\nJust a simple project.'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.techStack).toEqual([])
    expect(result.features).toEqual([])
  })

  it('handles empty README gracefully', async () => {
    const result = await extractor.extract('', baseRepoInfo)
    expect(result.title).toBe('')
    expect(result.description).toBe('')
    expect(result.techStack).toEqual([])
    expect(result.features).toEqual([])
  })

  it('falls back to repoInfo.name when no h1 title', async () => {
    const repoInfo = { ...baseRepoInfo, name: 'my-repo' } as RawRepoInfo & { name?: string }
    const readme = 'No heading here.\n\nSome text.'
    const result = await extractor.extract(readme, repoInfo)
    expect(result.title).toBe('my-repo')
  })

  it('falls back to repoInfo.description when no paragraph found', async () => {
    const repoInfo = { ...baseRepoInfo, description: 'A great project' } as RawRepoInfo & { description?: string }
    const readme = '# Title\n\n![only image](img.png)'
    const result = await extractor.extract(readme, repoInfo)
    expect(result.description).toBe('A great project')
  })

  it('finds "Built With" section as tech stack', async () => {
    const readme = '# My Project\n\n## Built With\n\n- Docker\n- Kubernetes'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.techStack).toContain('Docker')
    expect(result.techStack).toContain('Kubernetes')
  })

  it('finds "Technologies" section as tech stack', async () => {
    const readme = '# My Project\n\n## Technologies\n\n- Python\n- Redis'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.techStack).toContain('Python')
    expect(result.techStack).toContain('Redis')
  })

  it('finds "Highlights" section as features', async () => {
    const readme = '# My Project\n\n## Highlights\n\n- Fast performance\n- Easy to use'
    const result = await extractor.extract(readme, baseRepoInfo)
    expect(result.features).toContain('Fast performance')
    expect(result.features).toContain('Easy to use')
  })
})
