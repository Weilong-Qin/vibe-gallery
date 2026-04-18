import React, { createContext, useContext } from 'react'

const TRANSLATIONS = {
  en: {
    skills: 'Skills',
    experience: 'Experience',
    education: 'Education',
    featured: 'Featured',
    demo: 'Demo →',
    status: { active: 'Active', wip: 'WIP', archived: 'Archived' },
  },
  zh: {
    skills: '技能',
    experience: '工作经历',
    education: '教育经历',
    featured: '精选',
    demo: '演示 →',
    status: { active: '活跃', wip: '进行中', archived: '已归档' },
  },
} as const

export type Lang = keyof typeof TRANSLATIONS
export type Translations = typeof TRANSLATIONS[Lang]

export const LangContext = createContext<Lang>('en')

export function useLang(): Translations {
  const lang = useContext(LangContext)
  return TRANSLATIONS[lang]
}

export { React }
