# T08: Resume Components (Profile/Skills/Experience/Education)

## Goal
Implement the four resume section React components using CSS custom properties from the theme system. These render the web-resume portion of the portfolio.

## Requirements

All components live in `src/app/components/resume/` and consume `GalleryData` types from `src/types/index.ts`.

### `Profile.tsx`
Props: `{ profile: ProfileData }`
- Avatar: `<img src={profile.avatarUrl} alt={profile.name} />` with circular crop
- Name: `<h1>` styled with `--font-size-hero`
- Bio: `<p>` with `--color-text-muted`
- Social links: horizontal row of icon+label links
  - Support icons for: github, x (twitter), email, linkedin, weibo, website (generic)
  - Use SVG inline icons (simple, no external icon library)
  - Email links get `mailto:` prefix if not present

### `Skills.tsx`
Props: `{ skills: SkillCategory[] }`
- Renders each SkillCategory as a group: category heading + flex-wrap of skill badges
- Skill badges: `<span>` with border, `--card-radius`, padding
- Badge background: `--color-surface`, border: `--color-border`

### `Experience.tsx`
Props: `{ experience: ExperienceItem[] }`
- Timeline-style list (or simple card list)
- Each item: company (bold), title, period (muted), location, highlights as `<ul>`
- Separator between items: thin border or vertical line

### `Education.tsx`
Props: `{ education: EducationItem[] }`
- Similar to Experience but simpler (no highlights)
- School, degree, period

### Index barrel (`src/app/components/resume/index.ts`)
Export all four components.

### Style approach
- Use inline styles with CSS variables (e.g., `style={{ color: 'var(--color-text-muted)' }}`)
- No Tailwind, no CSS modules — everything through CSS custom properties defined in themes
- Components should be visually complete using only the CSS variables from the theme system

## Acceptance Criteria
- [ ] `tsc --noEmit` passes
- [ ] All components render without errors given valid props
- [ ] Profile renders avatar, name, bio, and social links
- [ ] Skills renders categories with badge items
- [ ] Experience renders timeline with highlights

## Technical Notes
- Import types from `../../../types/index.js` (or alias)
- Social link icon type is inferred from the `key` field ('github' → GitHub icon, 'x' → X/Twitter icon, etc.)
- Keep SVG icons minimal (24x24 viewBox, single path)
