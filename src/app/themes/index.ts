export const THEMES = ['minimal', 'grid', 'magazine', 'terminal'] as const
export type ThemeName = typeof THEMES[number]
