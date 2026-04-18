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
  const config = { label: t.status[status], color }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 999,
      border: `1px solid ${config.color}33`,
      background: `${config.color}11`,
      fontSize: 'var(--font-size-sm)',
      color: config.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.color, display: 'inline-block' }} />
      {config.label}
    </span>
  )
}
