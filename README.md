# vibe-gallery

> A static portfolio + web resume for the vibe coding era. Fork, configure, deploy.

## What is this?

**vibe-gallery** is a developer portfolio that auto-generates from your GitHub repos and a single config file. It pulls repo metadata (stars, README, releases) across GitHub, Gitee, Codeup, and Gitea; optionally enriches it with an LLM; bakes everything into a static site; and ships it to GitHub Pages via GitHub Actions.

Zero database. Zero server. Zero runtime. You push a YAML file, you get a portfolio.

## Quick Start

1. **Fork** this repository (or click "Use this template").
2. **Configure** — run `npx vibe-gallery init` for an interactive wizard, or edit `gallery.config.yaml` directly.
3. **Push** to your `main` branch.
4. **Enable Pages** — in your fork, go to **Settings → Pages → Source: GitHub Actions**.
5. **Done** — your portfolio is live at `https://<yourusername>.github.io/vibe-gallery`.

The included workflow rebuilds on every push to `gallery.config.yaml` and on a weekly schedule, so stars and release data stay fresh without any action from you.

## Configuration

Everything lives in `gallery.config.yaml`. Here is the full reference:

```yaml
# ─── Profile ─────────────────────────────────────────────────────────
profile:
  name: "Your Name"
  bio: "Full-stack developer building in the vibe coding era"
  # bio_override: "Takes precedence over bio if set"
  avatar: github           # 'github' or a direct URL
  links:
    github: "https://github.com/yourusername"
    x: "https://x.com/yourusername"
    linkedin: "https://linkedin.com/in/yourusername"
    email: "you@example.com"
    website: "https://example.com"

# ─── Appearance ──────────────────────────────────────────────────────
theme: terminal            # minimal | grid | magazine | terminal
accent: "#00ff88"          # optional hex color

layout:
  page: sidebar            # single-column | sidebar | hero
  projects: featured-first # grid | masonry | list | featured-first
  columns: 2               # 1 | 2 | 3 | auto
  density: comfortable     # compact | comfortable | spacious

display:
  stats: stars             # stars | milestones | none

# ─── Resume ──────────────────────────────────────────────────────────
resume:
  sections: [skills, experience, education, projects]
  skills:
    - category: "Languages"
      items: [TypeScript, Python, Go]
    - category: "Frontend"
      items: [React, Vite, TailwindCSS]
  experience:
    - company: "Acme Corp"
      title: "Senior Engineer"
      period: "2022 - Present"
      location: "Remote"
      highlights:
        - "Built scalable microservices serving 10M+ daily users"
        - "Led migration from monolith to event-driven architecture"
  education:
    - school: "University of Example"
      degree: "B.S. Computer Science"
      period: "2018 - 2022"

# ─── Auto-import from GitHub ─────────────────────────────────────────
import:
  github: yourusername
  exclude: [yourusername/dotfiles, yourusername/scratch]
  min_stars: 0

# ─── Explicit projects (any platform) ────────────────────────────────
projects:
  - github: owner/flagship-project
    featured: true
    demo_url: "https://demo.example.com"
    screenshots:
      - "https://example.com/screenshot1.png"
    status: active          # active | wip | archived
    display:
      stats: milestones
    override:
      title: "My Best Project"
      description: "Custom description here"
      techStack: [TypeScript, React, PostgreSQL]
      features:
        - "Real-time collaboration"
        - "Offline-first sync"
      heroImage: "https://example.com/hero.png"

  # Gitee
  - gitee: owner/chinese-project
    featured: false

  # Aliyun Codeup
  - codeup:
      org: your-org
      repo: internal-tool
    status: wip

  # Self-hosted Gitea
  - gitea:
      url: "https://git.example.com"
      repo: owner/private-tool
    demo_url: "https://tool.example.com"

# ─── Sync schedule ───────────────────────────────────────────────────
sync:
  schedule: "0 6 * * 1"     # cron: weekly on Mondays at 06:00 UTC
  on_push: true             # also rebuild when gallery.config.yaml changes
```

Any field marked optional can be omitted. `import` and `projects` can coexist — explicit `projects` entries override auto-imported ones with the same repo.

## Themes

| Theme      | Style                                      |
| ---------- | ------------------------------------------ |
| `minimal`  | Clean, whitespace-heavy, prose-like        |
| `grid`     | Card-based, structured, GitHub-inspired    |
| `magazine` | Editorial, bold typography, serif          |
| `terminal` | Dark, monospace, hacker aesthetic          |

Set `accent` to any hex color to tint links, highlights, and borders.

## Layout System

Layout is composed from four independent dimensions — pick one value from each:

- **`page`** — overall page shape.
  - `single-column` — everything stacked, classic long-form.
  - `sidebar` — profile/resume on the side, projects in the main pane.
  - `hero` — large intro block above a projects section.
- **`projects`** — how project entries are arranged.
  - `grid` — uniform cards.
  - `masonry` — Pinterest-style variable heights.
  - `list` — vertical rows with more detail per item.
  - `featured-first` — a big hero card up top, smaller cards below.
- **`columns`** — `1`, `2`, `3`, or `auto` (responsive).
- **`density`** — `compact`, `comfortable`, or `spacious` — controls padding and gaps.

Mix freely — `hero` + `featured-first` + `auto` + `spacious` reads very differently from `sidebar` + `list` + `1` + `compact`.

## Supported Platforms

- **GitHub** — public and private repos (via `GITHUB_TOKEN`, auto-provided in Actions).
- **Gitee** — via `GITEE_TOKEN`.
- **Codeup / Aliyun DevOps** — via `CODEUP_TOKEN`.
- **Gitea (self-hosted)** — via `GITEA_TOKEN`. Specify the instance URL per-project.

Each platform has its own entry shape under `projects:` — see the config reference above.

## AI-Powered Extraction

vibe-gallery uses a **BYOK** (bring your own key) model for LLM-assisted extraction of tech stack, features, and hero images from READMEs.

- Set `LLM_API_KEY` and `LLM_BASE_URL` in your fork's GitHub Actions secrets.
- Optionally set `LLM_MODEL` (defaults to `gpt-4o-mini`).
- Works with any OpenAI-compatible endpoint (OpenAI, DeepSeek, Qwen, local Ollama, etc.).

If no LLM is configured, the build falls back to heuristic parsing — you still get a usable portfolio, just less polish.

All per-project data can be overridden manually via the `override:` block, which always wins.

## Local Development

```bash
npm install
cp .env.example .env      # add your tokens (optional — public repos need none)
npm run build:data        # fetch repo data and extract project info
npm run dev               # start Vite dev server
```

Other scripts:

- `npm run build` — full build (`build:data` + `build:app`).
- `npm run build:app` — Vite build only (reuses last `build:data` output).
- `npm run preview` — preview the built site.
- `npm run typecheck` — TypeScript check.

Between runs, a `.gallery-cache.json` file avoids re-fetching unchanged repos; the CI workflow caches it automatically.

## Secrets Reference

Set these under **Settings → Secrets and variables → Actions** on your fork:

| Secret          | Required          | Purpose                                  |
| --------------- | ----------------- | ---------------------------------------- |
| `GITHUB_TOKEN`  | Auto-provided     | Fetch GitHub repo data                   |
| `GITEE_TOKEN`   | Optional          | Gitee repos                              |
| `CODEUP_TOKEN`  | Optional          | Codeup / Aliyun DevOps repos             |
| `GITEA_TOKEN`   | Optional          | Self-hosted Gitea repos                  |
| `LLM_API_KEY`   | Optional          | Enables AI extraction                    |
| `LLM_BASE_URL`  | Optional          | OpenAI-compatible endpoint               |
| `LLM_MODEL`     | Optional          | Model name (default: `gpt-4o-mini`)      |

For local development, put the same values in a `.env` file in the project root.

## CLI

A small CLI ships in `packages/cli`:

```bash
npx vibe-gallery init       # interactive wizard — scaffolds gallery.config.yaml
npx vibe-gallery preview    # local build + dev server
```

`init` asks a few questions (name, GitHub username, theme, layout) and writes a starter config. `preview` is a shortcut for `npm run build:data && npm run dev`.

## License

MIT — fork it, ship it, make it yours.
