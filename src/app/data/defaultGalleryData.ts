import type { GalleryData } from '../../types/index.js'

export const defaultGalleryData: GalleryData = {
  profile: {
    name: 'vibe-gallery',
    bio: '',
    avatarUrl: '',
    links: [],
  },
  resume: {
    sections: ['skills', 'experience', 'education', 'projects'],
    skills: [],
    experience: [],
    education: [],
  },
  projects: [],
  language: 'en',
  theme: 'minimal',
  layout: {
    page: 'sidebar',
    projects: 'featured-first',
    columns: 'auto',
    density: 'comfortable',
  },
  builtAt: '',
}
