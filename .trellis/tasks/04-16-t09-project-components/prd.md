# T09: Project Components (ProjectCard/Grid/StatusBadge/StatsBar)

## Goal
Implement the project showcase React components: cards, grid container, status badges, and stats bars for displaying portfolio projects.

## Requirements

All components live in `src/app/components/projects/` and consume types from `src/types/index.ts`.

### `StatusBadge.tsx`
Props: `{ status: 'active' | 'wip' | 'archived' }`
- Small pill badge indicating project status
- active → green dot + "Active"
- wip → yellow dot + "WIP"
- archived → gray dot + "Archived"
- Colors: use CSS variables where possible; hardcode status dot colors (green/yellow/gray are semantic)

### `StatsBar.tsx`
Props: `{ stats: StarsData | MilestonesData | undefined; display: { stats: 'stars' | 'milestones' | 'none' } }`
- If `display.stats === 'none'` or no stats → render nothing
- `StarsData`: render ⭐ {stars} · 🍴 {forks} · 👁 {watchers} (and language if present)
- `MilestonesData`: render list of releases (version + date + one-line summary)
  - Show max 3 releases in collapsed view

### `ProjectCard.tsx`
Props: `{ project: ProjectData }`
- Hero image (if present): full-width image at top of card, max-height 200px, object-fit cover
- Title: bold, `--font-size-xl`
- Description: 2-line clamp, `--color-text-muted`
- Tech stack: flex-wrap of small `<code>` badges
- Features: bullet list (max 3 shown)
- Footer row: StatusBadge + StatsBar + Demo link (if present)
- Screenshots: if present, small thumbnail row below hero
- `featured` projects: add a "Featured" label (top-right corner badge)
- Card wrapper: `--card-radius`, `--card-shadow`, `--card-border`, `--card-padding`, `--color-surface` background
- Class: `project-card` (for layout CSS to target); add `featured` class when `project.featured`
- Demo link: opens in new tab, styled as accent button

### `ProjectGrid.tsx`
Props: `{ projects: ProjectData[] }`
- Wrapper div with class `projects-grid` (layout CSS targets this)
- Renders `<ProjectCard>` for each project
- Sorts: featured projects first (for `featured-first` layout they'll span full width via CSS)

### Index barrel (`src/app/components/projects/index.ts`)
Export all components.

## Acceptance Criteria
- [ ] `tsc --noEmit` passes
- [ ] ProjectCard renders with hero image, title, description, tech stack, features, and footer
- [ ] Featured card has "Featured" badge
- [ ] StatsBar renders correctly for both `StarsData` and `MilestonesData`
- [ ] ProjectGrid renders all projects in `projects-grid` container

## Technical Notes
- CSS class names: `project-card`, `projects-grid`, `featured` — must match layout.css selectors from T07
- Line clamp: use `-webkit-line-clamp: 2` with `display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden`
- No external icon library — use emoji or simple inline SVG for stats icons
