import React from 'react'
import type { ExperienceItem } from '../../../types/index.js'
import { useLang } from '../../i18n.js'

export function Experience({ experience }: { experience: ExperienceItem[] }) {
  const t = useLang()
  if (experience.length === 0) return null
  return (
    <section>
      <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-lg)', color: 'var(--color-text)' }}>
        {t.experience}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {experience.map((item, i) => (
          <div key={i} style={{ paddingLeft: 'var(--space-md)', borderLeft: '2px solid var(--color-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
              <strong style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text)' }}>{item.company}</strong>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{item.period}</span>
            </div>
            <p style={{ color: 'var(--color-accent)', fontSize: 'var(--font-size-base)', marginTop: 2 }}>{item.title}</p>
            {item.location && <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>{item.location}</p>}
            {item.highlights && item.highlights.length > 0 && (
              <ul style={{ marginTop: 'var(--space-sm)', paddingLeft: 'var(--space-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)' }}>
                {item.highlights.map((h, j) => <li key={j} style={{ marginBottom: 2 }}>{h}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
