import React from 'react'
import type { SkillCategory } from '../../../types/index.js'
import { useLang } from '../../i18n.js'

export function Skills({ skills }: { skills: SkillCategory[] }) {
  const t = useLang()
  if (skills.length === 0) return null

  return (
    <section className="skills-section">
      <h2 className="skills-section__heading">{t.skills}</h2>
      <div className="skills-section__list">
        {skills.map((cat) => (
          <div key={cat.category}>
            <h3 className="skills-category__name">{cat.category}</h3>
            <div className="skills-category__items">
              {cat.items.map((item) => (
                <span key={item} className="skills-category__item">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
