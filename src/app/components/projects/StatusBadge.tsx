import React from 'react'
import { useLang } from '../../i18n.js'

const STATUS_COLORS = {
  active: '#22c55e',
  wip: '#f59e0b',
  archived: '#6b7280',
} as const

export function StatusBadge({ status }: { status: 'active' | 'wip' | 'archived' }) {
  const t = useLang()
  const color = STATUS_COLORS[status]

  return (
    <span
      className="status-badge"
      style={{
        border: `1px solid ${color}33`,
        background: `${color}11`,
        color,
      }}
    >
      <span
        className="status-badge__dot"
        style={{ background: color }}
      />
      {t.status[status]}
    </span>
  )
}
