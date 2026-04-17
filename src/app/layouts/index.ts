export const PAGE_LAYOUTS = ['single-column', 'sidebar', 'hero'] as const
export const PROJECTS_LAYOUTS = ['grid', 'masonry', 'list', 'featured-first'] as const
export const COLUMN_OPTIONS = [1, 2, 3, 'auto'] as const
export const DENSITY_OPTIONS = ['compact', 'comfortable', 'spacious'] as const

export type PageLayout = (typeof PAGE_LAYOUTS)[number]
export type ProjectsLayout = (typeof PROJECTS_LAYOUTS)[number]
