import React, { useState, useRef, useEffect } from 'react'
import type { ProjectData } from '../../../types/index.js'
import { StatusBadge } from './StatusBadge.js'
import { StatsBar } from './StatsBar.js'
import { useLang } from '../../i18n.js'
import { MarkdownText } from '../MarkdownText.js'

export function ProjectCard({ project }: { project: ProjectData }) {
  const t = useLang()
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (lightboxImage) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [lightboxImage])

  return (
    <div className={`project-card${project.featured ? ' featured' : ''}`}>
      {project.featured && (
        <span className="project-card__badge">{t.featured}</span>
      )}
      <div className="project-card__hero-container">
        {project.heroImage ? (
          <img
            className="project-card__hero"
            src={project.heroImage}
            alt={project.title}
            loading="lazy"
            decoding="async"
            width={600}
            height={337}
            onClick={() => setLightboxImage(project.heroImage!)}
          />
        ) : (
          <div className="project-card__hero-fallback">
            <span className="project-card__hero-initial">{project.title.charAt(0).toUpperCase()}</span>
            <div className="project-card__hero-pattern"></div>
          </div>
        )}
      </div>
      <div className="project-card__body">
        <h3 className="project-card__title">
          <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
            {project.title}
          </a>
        </h3>
        <MarkdownText content={project.description} className="project-card__desc" />
        {project.techStack.length > 0 && (
          <div className="project-card__tech">
            {project.techStack.map((tech) => (
              <span key={tech} className="project-card__tech-badge">{tech}</span>
            ))}
          </div>
        )}
        {project.features.length > 0 && (
          <ul className="project-card__features">
            {project.features.slice(0, 3).map((f, i) => <li key={i}><MarkdownText content={f} inline /></li>)}
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
                height={45}
                className="project-card__thumbnail"
                onClick={() => setLightboxImage(src)}
              />
            ))}
          </div>
        )}
        <div className="project-card__footer">
          <div className="project-card__footer-left">
            <StatusBadge status={project.status} />
            <StatsBar stats={project.stats} display={project.display} />
          </div>
          <div className="project-card__actions">
            <a
              className="project-card__btn project-card__btn--repo"
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Code
            </a>
            {project.demoUrl && (
              <a
                className="project-card__btn project-card__btn--demo"
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

      <dialog 
        ref={dialogRef} 
        className="lightbox-dialog" 
        onClose={() => setLightboxImage(null)}
        onClick={(e) => { if(e.target === e.currentTarget) setLightboxImage(null) }}
      >
        <div className="lightbox-content">
          <button className="lightbox-close" onClick={() => setLightboxImage(null)} title="Close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          {lightboxImage && <img src={lightboxImage} alt="Preview" />}
        </div>
      </dialog>
    </div>
  )
}
