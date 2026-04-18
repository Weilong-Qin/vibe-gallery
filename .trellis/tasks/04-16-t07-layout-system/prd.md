# T07: Layout System (page/projects/columns/density)

## Goal
Implement the layout system as CSS data-attribute rules, orthogonal to themes. Layout controls page structure, project grid arrangement, column count, and density — not colors or typography.

## Requirements

### CSS Layout File (`src/app/layouts/layout.css`)
All layout rules keyed by `data-*` attributes on the root element:

```css
/* ── Page layouts ───────────────────────────────────────── */
[data-page-layout="single-column"] .page-root {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-xl) var(--space-md);
}

[data-page-layout="sidebar"] .page-root {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-xl);
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-xl) var(--space-md);
}

[data-page-layout="hero"] .page-root {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0;
}
[data-page-layout="hero"] .hero-section {
  padding: var(--space-2xl) var(--space-xl);
  border-bottom: var(--card-border);
}
[data-page-layout="hero"] .content-section {
  padding: var(--space-xl);
}

/* ── Project grid layouts ───────────────────────────────── */
[data-projects-layout="grid"] .projects-grid {
  display: grid;
  grid-template-columns: repeat(var(--columns, 2), 1fr);
  gap: var(--space-lg);
}

[data-projects-layout="masonry"] .projects-grid {
  columns: var(--columns, 2);
  column-gap: var(--space-lg);
}
[data-projects-layout="masonry"] .project-card {
  break-inside: avoid;
  margin-bottom: var(--space-lg);
}

[data-projects-layout="list"] .projects-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
[data-projects-layout="list"] .project-card {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
}

[data-projects-layout="featured-first"] .projects-grid {
  display: grid;
  grid-template-columns: repeat(var(--columns, 2), 1fr);
  gap: var(--space-lg);
}
[data-projects-layout="featured-first"] .project-card.featured {
  grid-column: 1 / -1;  /* span full width */
}

/* ── Responsive: collapse to single column on mobile ────── */
@media (max-width: 768px) {
  [data-page-layout="sidebar"] .page-root {
    grid-template-columns: 1fr;
  }
  .projects-grid {
    grid-template-columns: 1fr !important;
    columns: 1 !important;
  }
}
```

### Layout constants (`src/app/layouts/index.ts`)
```typescript
export const PAGE_LAYOUTS = ['single-column', 'sidebar', 'hero'] as const
export const PROJECTS_LAYOUTS = ['grid', 'masonry', 'list', 'featured-first'] as const
export const COLUMN_OPTIONS = [1, 2, 3, 'auto'] as const
export const DENSITY_OPTIONS = ['compact', 'comfortable', 'spacious'] as const

export type PageLayout = typeof PAGE_LAYOUTS[number]
export type ProjectsLayout = typeof PROJECTS_LAYOUTS[number]
```

### Layout wrapper component (`src/app/components/Layout.tsx`)
```tsx
import React from 'react'
import type { LayoutConfig } from '../../../types/index.js'

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
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
```

### Import layout CSS in `main.tsx`
Add: `import './layouts/layout.css'`

### Update `App.tsx`
Use the `Layout` component wrapper, and add `page-root` and `projects-grid` CSS classes to the demo content.

## Acceptance Criteria
- [ ] `tsc --noEmit` passes
- [ ] `data-page-layout="sidebar"` renders a 2-column grid
- [ ] `data-projects-layout="featured-first"` makes `.featured` cards span full width
- [ ] Mobile breakpoint collapses all layouts to single column

## Technical Notes
- Layout CSS must not contain any color/font rules — those belong in theme CSS
- `--columns` CSS variable drives `grid-template-columns: repeat(var(--columns, 2), 1fr)`
- `columns: auto` should map to `auto-fill` for grid, or just use default 2
