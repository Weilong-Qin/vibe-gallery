import React from 'react'
import type { SkillCategory } from '../../../types/index.js'

export function Skills({ skills }: { skills: SkillCategory[] }) {
  if (skills.length === 0) return null
  return (
    <section>
      <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-lg)', color: 'var(--color-text)' }}>
        Skills
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {skills.map((cat) => (
          <div key={cat.category}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {cat.category}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
              {cat.items.map((item) => (
                <span key={item} style={{
                  padding: '2px 10px',
                  background: 'var(--color-surface)',
                  border: 'var(--card-border)',
                  borderRadius: 'var(--card-radius)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text)',
                }}>
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
