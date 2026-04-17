import React from 'react'
import type { ProjectData } from '../../../types/index.js'
import { ProjectCard } from './ProjectCard.js'

export function ProjectGrid({ projects }: { projects: ProjectData[] }) {
  const sorted = [...projects].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
  return (
    <div className="projects-grid">
      {sorted.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
