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
      <div className="stats-bar--stars">
        <span>⭐ {stats.stars.toLocaleString()}</span>
        <span title="Forks">⑂ {stats.forks.toLocaleString()}</span>
        <span>👁 {stats.watchers.toLocaleString()}</span>
      </div>
    )
  }

  return (
    <div className="stats-bar--milestones">
      {stats.releases.slice(0, 3).map((r) => (
        <div key={r.version} className="stats-bar__release">
          <span className="stats-bar__version">{r.version}</span>
          <span>{r.date}</span>
          {r.summary && <span className="stats-bar__summary">{r.summary}</span>}
        </div>
      ))}
    </div>
  )
}
