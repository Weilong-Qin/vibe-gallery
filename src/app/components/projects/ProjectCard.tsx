import React from 'react'
import type { ProjectData } from '../../../types/index.js'
import { StatusBadge } from './StatusBadge.js'
import { StatsBar } from './StatsBar.js'

export function ProjectCard({ project }: { project: ProjectData }) {
  return (
    <div
      className={`project-card${project.featured ? ' featured' : ''}`}
      style={{
        background: 'var(--color-surface)',
        border: 'var(--card-border)',
        borderRadius: 'var(--card-radius)',
        boxShadow: 'var(--card-shadow)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {project.featured && (
        <span style={{
          position: 'absolute',
          top: 'var(--space-sm)',
          right: 'var(--space-sm)',
          background: 'var(--color-accent)',
          color: 'var(--color-text-inverse)',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          zIndex: 1,
        }}>
          Featured
        </span>
      )}
      {project.heroImage && (
        <img
          src={project.heroImage}
          alt={project.title}
          style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
        />
      )}
      <div style={{ padding: 'var(--card-padding)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-text)', textDecoration: 'none' }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--color-accent)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--color-text)')}
          >
            {project.title}
          </a>
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-base)', lineHeight: 1.6 }}>
          {project.description}
        </p>
        {project.techStack.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {project.techStack.map((tech) => (
              <code key={tech} style={{
                padding: '1px 6px',
                background: 'var(--color-bg)',
                border: 'var(--card-border)',
                borderRadius: 4,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
              }}>
                {tech}
              </code>
            ))}
          </div>
        )}
        {project.features.length > 0 && (
          <ul style={{ paddingLeft: 'var(--space-md)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {project.features.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        )}
        {project.screenshots.length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--space-xs)', overflowX: 'auto' }}>
            {project.screenshots.map((src, i) => (
              <img key={i} src={src} alt={`screenshot ${i + 1}`} style={{ height: 60, borderRadius: 4, flexShrink: 0 }} />
            ))}
          </div>
        )}
        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)', borderTop: 'var(--card-border)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={project.status} />
            <StatsBar stats={project.stats} display={project.display} />
          </div>
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '4px 12px',
                background: 'var(--color-accent)',
                color: 'var(--color-text-inverse)',
                borderRadius: 'var(--card-radius)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Demo →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
