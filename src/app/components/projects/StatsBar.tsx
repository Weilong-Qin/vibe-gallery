import React from 'react'
import type { StarsData, MilestonesData } from '../../../types/index.js'

interface StatsBarProps {
  stats: StarsData | MilestonesData | undefined
  display: { stats: 'stars' | 'milestones' | 'none' }
}

export function StatsBar({ stats, display }: StatsBarProps) {
  if (display.stats === 'none' || !stats) return null

  if (stats.type === 'stars') {
    return (
      <div style={{ display: 'flex', gap: 'var(--space-md)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
        <span>⭐ {stats.stars.toLocaleString()}</span>
        <span>🍴 {stats.forks.toLocaleString()}</span>
        <span>👁 {stats.watchers.toLocaleString()}</span>
        {stats.language && <span style={{ color: 'var(--color-accent)' }}>{stats.language}</span>}
      </div>
    )
  }

  return (
    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
      {stats.releases.slice(0, 3).map((r) => (
        <div key={r.version} style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 2 }}>
          <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>{r.version}</span>
          <span>{r.date}</span>
          {r.summary && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{r.summary}</span>}
        </div>
      ))}
    </div>
  )
}
