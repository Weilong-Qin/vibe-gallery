// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { StatusBadge } from './StatusBadge.js'
import { LangContext } from '../../i18n.js'

function renderWithLang(ui: React.ReactElement, lang: 'en' | 'zh' = 'en') {
  return render(<LangContext.Provider value={lang}>{ui}</LangContext.Provider>)
}

describe('StatusBadge', () => {
  it('renders active status in English', () => {
    const { container } = renderWithLang(<StatusBadge status="active" />)
    expect(container.textContent).toContain('Active')
  })

  it('renders wip status in English', () => {
    const { container } = renderWithLang(<StatusBadge status="wip" />)
    expect(container.textContent).toContain('WIP')
  })

  it('renders archived status in English', () => {
    const { container } = renderWithLang(<StatusBadge status="archived" />)
    expect(container.textContent).toContain('Archived')
  })

  it('renders active status in Chinese', () => {
    const { container } = renderWithLang(<StatusBadge status="active" />, 'zh')
    expect(container.textContent).toContain('活跃')
  })

  it('renders wip status in Chinese', () => {
    const { container } = renderWithLang(<StatusBadge status="wip" />, 'zh')
    expect(container.textContent).toContain('进行中')
  })

  it('renders archived status in Chinese', () => {
    const { container } = renderWithLang(<StatusBadge status="archived" />, 'zh')
    expect(container.textContent).toContain('已归档')
  })

  it('renders a dot element', () => {
    const { container } = renderWithLang(<StatusBadge status="active" />)
    const dot = container.querySelector('.status-badge__dot')
    expect(dot).not.toBeNull()
  })

  it('applies correct color for active status', () => {
    const { container } = renderWithLang(<StatusBadge status="active" />)
    const badge = container.querySelector('.status-badge') as HTMLElement
    expect(badge?.style.color).toBe('rgb(34, 197, 94)')
  })

  it('applies correct color for wip status', () => {
    const { container } = renderWithLang(<StatusBadge status="wip" />)
    const badge = container.querySelector('.status-badge') as HTMLElement
    expect(badge?.style.color).toBe('rgb(245, 158, 11)')
  })

  it('applies correct color for archived status', () => {
    const { container } = renderWithLang(<StatusBadge status="archived" />)
    const badge = container.querySelector('.status-badge') as HTMLElement
    expect(badge?.style.color).toBe('rgb(107, 114, 128)')
  })
})
