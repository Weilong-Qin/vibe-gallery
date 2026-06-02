import { describe, it, expect } from 'vitest'

const TRANSLATIONS = {
  en: {
    skills: 'Skills',
    experience: 'Experience',
    education: 'Education',
    featured: 'Featured',
    demo: 'Demo →',
    status: {
      active: 'Active',
      wip: 'WIP',
      archived: 'Archived',
    },
    sort: {
      label: 'Sort',
      default: 'Default',
      stars: 'Stars',
      forks: 'Forks',
      watchers: 'Watchers',
      custom: 'Custom',
    },
  },
  zh: {
    skills: '技能',
    experience: '工作经历',
    education: '教育经历',
    featured: '精选',
    demo: '演示 →',
    status: {
      active: '活跃',
      wip: '进行中',
      archived: '已归档',
    },
    sort: {
      label: '排序',
      default: '默认',
      stars: 'Star',
      forks: 'Fork',
      watchers: 'Watch',
      custom: '自定义',
    },
  },
} as const

type Lang = keyof typeof TRANSLATIONS

describe('i18n translations', () => {
  const languages: Lang[] = ['en', 'zh']

  it('has both en and zh locales', () => {
    expect(languages.every((lang) => lang in TRANSLATIONS)).toBe(true)
  })

  it('has all required keys in each locale', () => {
    const requiredKeys = ['skills', 'experience', 'education', 'featured', 'demo', 'status', 'sort']

    for (const lang of languages) {
      for (const key of requiredKeys) {
        expect(TRANSLATIONS[lang]).toHaveProperty(key)
      }
    }
  })

  it('has all status sub-keys in each locale', () => {
    const statusKeys = ['active', 'wip', 'archived']

    for (const lang of languages) {
      for (const key of statusKeys) {
        expect(TRANSLATIONS[lang].status).toHaveProperty(key)
        expect(typeof TRANSLATIONS[lang].status[key as keyof typeof TRANSLATIONS[typeof lang]['status']]).toBe('string')
      }
    }
  })

  it('has all sort sub-keys in each locale', () => {
    const sortKeys = ['label', 'default', 'stars', 'forks', 'watchers', 'custom']

    for (const lang of languages) {
      for (const key of sortKeys) {
        expect(TRANSLATIONS[lang].sort).toHaveProperty(key)
      }
    }
  })

  it('zh locale has Chinese translations for status', () => {
    expect(TRANSLATIONS.zh.status.active).toBe('活跃')
    expect(TRANSLATIONS.zh.status.wip).toBe('进行中')
    expect(TRANSLATIONS.zh.status.archived).toBe('已归档')
  })

  it('en locale has English translations for status', () => {
    expect(TRANSLATIONS.en.status.active).toBe('Active')
    expect(TRANSLATIONS.en.status.wip).toBe('WIP')
    expect(TRANSLATIONS.en.status.archived).toBe('Archived')
  })

  it('en locale has English translations for resume sections', () => {
    expect(TRANSLATIONS.en.skills).toBe('Skills')
    expect(TRANSLATIONS.en.experience).toBe('Experience')
    expect(TRANSLATIONS.en.education).toBe('Education')
  })

  it('zh locale has Chinese translations for resume sections', () => {
    expect(TRANSLATIONS.zh.skills).toBe('技能')
    expect(TRANSLATIONS.zh.experience).toBe('工作经历')
    expect(TRANSLATIONS.zh.education).toBe('教育经历')
  })

  it('has non-empty strings for all translations', () => {
    for (const lang of languages) {
      const t = TRANSLATIONS[lang]
      expect(t.skills.length).toBeGreaterThan(0)
      expect(t.experience.length).toBeGreaterThan(0)
      expect(t.education.length).toBeGreaterThan(0)
      expect(t.featured.length).toBeGreaterThan(0)
      expect(t.demo.length).toBeGreaterThan(0)
    }
  })
})
