import { describe, it, expect } from 'vitest'
import { fixImagePaths } from './image.js'
import type { ExtractedData } from '../../types/index.js'

describe('fixImagePaths', () => {
  const baseData: ExtractedData = {
    title: 'My Project',
    description: 'A test project',
    techStack: ['React'],
    features: [],
  }

  it('leaves absolute HTTPS URLs unchanged', () => {
    const data = { ...baseData, heroImage: 'https://example.com/image.png' }
    const result = fixImagePaths(data, 'owner', 'repo', 'main')
    expect(result.heroImage).toBe('https://example.com/image.png')
  })

  it('leaves absolute HTTP URLs unchanged', () => {
    const data = { ...baseData, heroImage: 'http://example.com/image.png' }
    const result = fixImagePaths(data, 'owner', 'repo', 'main')
    expect(result.heroImage).toBe('http://example.com/image.png')
  })

  it('converts relative paths to raw.githubusercontent.com URLs', () => {
    const data = { ...baseData, heroImage: 'assets/hero.png' }
    const result = fixImagePaths(data, 'owner', 'repo', 'main')
    expect(result.heroImage).toBe('https://raw.githubusercontent.com/owner/repo/main/assets/hero.png')
  })

  it('strips ./ prefix from relative paths', () => {
    const data = { ...baseData, heroImage: './images/hero.png' }
    const result = fixImagePaths(data, 'owner', 'repo', 'develop')
    expect(result.heroImage).toBe('https://raw.githubusercontent.com/owner/repo/develop/images/hero.png')
  })

  it('strips leading / from absolute-style paths', () => {
    const data = { ...baseData, heroImage: '/static/hero.png' }
    const result = fixImagePaths(data, 'owner', 'repo', 'v2')
    expect(result.heroImage).toBe('https://raw.githubusercontent.com/owner/repo/v2/static/hero.png')
  })

  it('returns undefined heroImage when input is undefined', () => {
    const data = { ...baseData, heroImage: undefined }
    const result = fixImagePaths(data, 'owner', 'repo', 'main')
    expect(result.heroImage).toBeUndefined()
  })

  it('does not mutate the original data', () => {
    const data = { ...baseData, heroImage: 'img.png' }
    const result = fixImagePaths(data, 'owner', 'repo', 'main')
    expect(result).not.toBe(data)
    expect(data.heroImage).toBe('img.png')
  })
})
