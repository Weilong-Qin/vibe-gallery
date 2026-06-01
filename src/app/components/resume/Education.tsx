import React from 'react'
import type { EducationItem } from '../../../types/index.js'
import { useLang } from '../../i18n.js'

export function Education({ education }: { education: EducationItem[] }) {
  const t = useLang()
  if (education.length === 0) return null

  return (
    <section>
      <h2 className="education-section__heading">{t.education}</h2>
      <div className="education-section__list">
        {education.map((item, i) => (
          <div key={i}>
            <div className="education-item__header">
              <strong className="education-item__school">{item.school}</strong>
              <span className="education-item__period">{item.period}</span>
            </div>
            <p className="education-item__degree">{item.degree}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
