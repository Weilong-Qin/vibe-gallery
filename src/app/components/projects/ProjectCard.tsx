import React from 'react'
import type { ProjectData } from '../../../types/index.js'
import { StatusBadge } from './StatusBadge.js'
import { StatsBar } from './StatsBar.js'
import { useLang } from '../../i18n.js'

export function ProjectCard({ project }: { project: ProjectData }) {
  const t = useLang()

  return (
    <div className={`project-card${project.featured ? ' featured' : ''}`}>
      {project.featured && (
        <span className="project-card__badge">{t.featured}</span>
      )}
      {project.heroImage && (
        <img
          className="project-card__hero"
          src={project.heroImage}
          alt={project.title}
          loading="lazy"
          decoding="async"
          width={600}
          height={200}
        />
      )}
      <div className="project-card__body">
        <h3 className="project-card__title">
          <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
            {project.title}
          </a>
        </h3>
        <p className="project-card__desc">{project.description}</p>
        {project.techStack.length > 0 && (
          <div className="project-card__tech">
            {project.techStack.map((tech) => (
              <code key={tech}>{tech}</code>
            ))}
          </div>
        )}
        {project.features.length > 0 && (
          <ul className="project-card__features">
            {project.features.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        )}
        {project.screenshots.length > 0 && (
          <div className="project-card__screenshots">
            {project.screenshots.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`screenshot ${i + 1}`}
                loading="lazy"
                decoding="async"
                width={80}
                height={60}
              />
            ))}
          </div>
        )}
        <div className="project-card__footer">
          <div className="project-card__footer-left">
            <StatusBadge status={project.status} />
            <StatsBar stats={project.stats} display={project.display} />
          </div>
          {project.demoUrl && (
            <a
              className="project-card__demo"
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.demo}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
