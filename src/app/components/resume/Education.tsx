import React from 'react'
import type { EducationItem } from '../../../types/index.js'

export function Education({ education }: { education: EducationItem[] }) {
  if (education.length === 0) return null
  return (
    <section>
      <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-lg)', color: 'var(--color-text)' }}>
        Education
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {education.map((item, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--color-text)' }}>{item.school}</strong>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{item.period}</span>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>{item.degree}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
