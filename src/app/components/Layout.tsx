import React from 'react'
import type { LayoutConfig } from '../../types/index.js'

interface LayoutProps {
  layout: LayoutConfig
  theme: string
  accent?: string
  children: React.ReactNode
}

export function Layout({ layout, theme, accent, children }: LayoutProps) {
  return (
    <div
      data-theme={theme}
      data-page-layout={layout.page}
      data-projects-layout={layout.projects}
      data-density={layout.density}
      style={{
        '--accent-override': accent ?? '',
        '--columns': layout.columns === 'auto' ? 'auto-fill' : String(layout.columns),
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-sans)',
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
