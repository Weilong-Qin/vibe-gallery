import React, { useState, useMemo } from 'react'
import type { ProjectData, SortConfig, SortMode } from '../../../types/index.js'
import { ProjectCard } from './ProjectCard.js'
import { useLang } from '../../i18n.js'

function sortProjects(projects: ProjectData[], mode: SortMode): ProjectData[] {
  const sorted = [...projects]

  switch (mode) {
    case 'stars':
      sorted.sort((a, b) => {
        const aStars = a.stats?.type === 'stars' ? a.stats.stars : 0
        const bStars = b.stats?.type === 'stars' ? b.stats.stars : 0
        return bStars - aStars || (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      })
      break

    case 'forks':
      sorted.sort((a, b) => {
        const aForks = a.stats?.type === 'stars' ? a.stats.forks : 0
        const bForks = b.stats?.type === 'stars' ? b.stats.forks : 0
        return bForks - aForks || (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      })
      break

    case 'watchers':
      sorted.sort((a, b) => {
        const aWatchers = a.stats?.type === 'stars' ? a.stats.watchers : 0
        const bWatchers = b.stats?.type === 'stars' ? b.stats.watchers : 0
        return bWatchers - aWatchers || (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      })
      break

    case 'custom':
      sorted.sort((a, b) => {
        const weightDiff = b.sortWeight - a.sortWeight
        if (weightDiff !== 0) return weightDiff
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      })
      break

    case 'default':
    default:
      sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
      break
  }

  return sorted
}

interface ProjectGridProps {
  projects: ProjectData[]
  sort?: SortConfig
}

export function ProjectGrid({ projects, sort: sortConfig }: ProjectGridProps) {
  const defaultMode = sortConfig?.by ?? 'default'
  const [mode, setMode] = useState<SortMode>(defaultMode)
  const t = useLang()

  const sorted = useMemo(() => sortProjects(projects, mode), [projects, mode])

  const SORT_OPTIONS: { value: SortMode; label: string }[] = [
    { value: 'default', label: t.sort?.default ?? 'Default' },
    { value: 'stars', label: t.sort?.stars ?? 'Stars' },
    { value: 'forks', label: t.sort?.forks ?? 'Forks' },
    { value: 'watchers', label: t.sort?.watchers ?? 'Watchers' },
    { value: 'custom', label: t.sort?.custom ?? 'Custom' },
  ]

  return (
    <div className="projects-section">
      <div className="projects-sort">
        <span className="projects-sort__label">{t.sort?.label ?? 'Sort'}</span>
        <div className="projects-sort__options">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`projects-sort__btn${mode === opt.value ? ' projects-sort__btn--active' : ''}`}
              onClick={() => setMode(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="projects-grid">
        {sorted.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
