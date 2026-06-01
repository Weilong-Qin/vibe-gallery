import React from 'react'
import type { ExperienceItem } from '../../../types/index.js'
import { useLang } from '../../i18n.js'

export function Experience({ experience }: { experience: ExperienceItem[] }) {
  const t = useLang()
  if (experience.length === 0) return null

  return (
    <section>
      <h2 className="experience-section__heading">{t.experience}</h2>
      <div className="experience-section__list">
        {experience.map((item, i) => (
          <div key={i} className="experience-item">
            <div className="experience-item__header">
              <strong className="experience-item__company">{item.company}</strong>
              <span className="experience-item__period">{item.period}</span>
            </div>
            <p className="experience-item__title">{item.title}</p>
            {item.location && <p className="experience-item__location">{item.location}</p>}
            {item.highlights && item.highlights.length > 0 && (
              <ul className="experience-item__highlights">
                {item.highlights.map((h, j) => <li key={j}>{h}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
