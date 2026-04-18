# T06: Theme System (4 Presets + CSS Variables)

## Goal
Implement the 4 theme presets (minimal, grid, magazine, terminal) as CSS files using CSS custom properties, plus the theme registration and application mechanism in the React app.

## Requirements

### CSS Custom Properties Architecture
Each theme defines a set of CSS variables under its `data-theme` selector. The root `App.tsx` applies `data-theme={theme}` on the top-level `<div>`.

Core variables every theme must define:
```css
[data-theme="<name>"] {
  /* Colors */
  --color-bg: ...;
  --color-surface: ...;
  --color-border: ...;
  --color-text: ...;
  --color-text-muted: ...;
  --color-text-inverse: ...;
  --color-accent: ...;           /* user accent override via --accent-override */

  /* Typography */
  --font-sans: ...;
  --font-mono: ...;
  --font-size-base: 16px;
  --font-size-sm: 14px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-size-2xl: 32px;
  --font-size-hero: 48px;

  /* Spacing (density-aware) */
  --space-xs: ...;
  --space-sm: ...;
  --space-md: ...;
  --space-lg: ...;
  --space-xl: ...;

  /* Cards */
  --card-radius: ...;
  --card-shadow: ...;
  --card-padding: ...;
}
```

Accent override (in App.tsx or global CSS):
```css
:root {
  --accent-override: ;  /* empty = no override */
}
[data-theme] {
  --color-accent: var(--accent-override, var(--color-accent-default));
}
```

### 4 Theme Files

**`src/app/themes/minimal.css`** — Clean, whitespace-heavy, prose-like
- White background, near-black text
- System serif/sans font stack
- Subtle gray borders
- Flat cards, no shadows

**`src/app/themes/grid.css`** — Structured, card-based, developer-portfolio feel
- Light gray background, white cards
- Strong grid layouts
- Defined card shadows
- Inter/system-ui font

**`src/app/themes/magazine.css`** — Editorial, bold typography
- Off-white background
- Large hero typography
- Accent color used liberally for headings
- Playfair Display / Georgia serif

**`src/app/themes/terminal.css`** — Dark mode, monospace, hacker aesthetic
- Near-black background (#0d1117 or #1a1a2e)
- Bright green or cyan accent (#00ff88 or #00d4ff)
- Monospace font (Fira Code, JetBrains Mono, fallback monospace)
- Thin borders instead of shadows
- ASCII-art style decorators (optional: `::before` content)

### Theme Registration (`src/app/themes/index.ts`)
```typescript
export const THEMES = ['minimal', 'grid', 'magazine', 'terminal'] as const
export type ThemeName = typeof THEMES[number]

export function loadTheme(theme: ThemeName): void {
  // Dynamic import of CSS — Vite handles this
}
```

Actually, just import all theme CSS files statically in `main.tsx` — Vite will bundle them. No dynamic loading needed.

### Apply Theme in `App.tsx`
```tsx
<div
  data-theme={galleryData.theme}
  style={{
    '--accent-override': galleryData.accent ?? '',
  } as React.CSSProperties}
>
  ...
</div>
```

### Theme Preview Component (`src/app/components/ThemePreview.tsx`)
A minimal component that renders a small color swatch card for each theme — useful for the docs/README.

## Acceptance Criteria
- [ ] All 4 theme CSS files exist with all required CSS variables defined
- [ ] `npm run dev` shows the page styled with the default theme
- [ ] Changing `data-theme` attribute in browser devtools switches the theme visually
- [ ] `--accent-override` CSS variable overrides `--color-accent` when set
- [ ] `tsc --noEmit` passes

## Technical Notes
- Do NOT use Tailwind — pure CSS custom properties only for themes
- Themes are orthogonal to layout — no layout rules in theme files
- Keep theme CSS focused on colors, typography, spacing tokens only
- The `terminal` theme should use `prefers-color-scheme: dark` as a hint but not require it
