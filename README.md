# vibe-gallery

[English](./README.md) · [中文](./README.zh.md)

> A static portfolio + web resume for the vibe coding era. Fork, configure, deploy.

## What is this?

**vibe-gallery** is a developer portfolio that auto-generates from your GitHub repos and a single config file. It pulls repo metadata (stars, README, releases) across GitHub, Gitee, Codeup, and Gitea; optionally enriches it with an LLM; bakes everything into a static site; and ships it to GitHub Pages via GitHub Actions.

Zero database. Zero server. Zero runtime. You push a YAML file, you get a portfolio.

## Quick Start

### 1. Fork & enable Pages

1. **Fork** this repository (or click "Use this template").
2. In your fork, go to **Settings → Pages → Source: GitHub Actions**.

### 2. Configure

Run the interactive wizard locally, or edit `gallery.config.yaml` directly:

```bash
npm install
npx vibe-gallery init     # interactive wizard
```

At minimum, set `profile.name` and `import.github` (your GitHub username).

### 3. Set secrets (optional but recommended)

Go to **Settings → Secrets and variables → Actions** on your fork:

| Secret         | Required      | Purpose                             |
|----------------|---------------|-------------------------------------|
| `GITHUB_TOKEN` | Auto-provided | Fetch GitHub repo data              |
| `LLM_API_KEY`  | Optional      | AI-powered README extraction        |
| `LLM_BASE_URL` | Optional      | OpenAI-compatible endpoint URL      |
| `LLM_MODEL`    | Optional      | Model name (default: `gpt-4o-mini`) |
| `GITEE_TOKEN`  | Optional      | Gitee repos                         |
| `CODEUP_TOKEN` | Optional      | Codeup / Aliyun DevOps repos        |
| `GITEA_TOKEN`  | Optional      | Self-hosted Gitea repos             |

### 4. Push & deploy

Push to `main` — GitHub Actions will build and deploy automatically.

Your portfolio will be live at `https://<yourusername>.github.io/vibe-gallery`.

---

## How Builds Work

There are **two separate workflows**, each optimized for different types of changes:

### `build-full` — Full rebuild (fetches data + deploys)

Runs `npm run build:data`: calls GitHub API, fetches READMEs, runs LLM extraction, writes cache.

**Triggers automatically when:**
- Code in `src/build/**` or `src/types/**` changes
- Weekly schedule (Monday 6am UTC) — refreshes stars, new repos, etc.
- Manual trigger via **Actions → Full Build → Run workflow**

**When to trigger manually:**
- First-time setup
- You added new repos and want them to appear immediately
- You want fresh LLM-extracted descriptions

### `build-config` — Fast rebuild (config/style changes only, ~1 min)

Runs `npm run build:assemble`: reads project data from local cache, re-assembles `gallery.json` from the current config. No API calls, no LLM.

**Triggers automatically when:**
- `gallery.config.yaml` changes (theme, layout, profile, resume)
- Frontend source changes (`src/app/**`)

**Use this for:**
- Changing theme or layout
- Updating your bio, skills, experience, education
- Tweaking colors, density, section order
- Any visual/style iteration

> **Note:** `build-config` requires `build-full` to have run at least once so the project data cache exists. On a brand-new fork, trigger `build-full` first.

### Local development workflow

```bash
npm install
cp .env.example .env           # add your tokens

# First time (or when you want fresh project data):
npm run build:data             # ~minutes, calls GitHub API + LLM

# Iterating on style/layout/profile (fast):
npm run build:assemble         # <1 second, reads from local cache

# Start the dev server (Vite HMR — live reload on CSS/component changes):
npm run dev
```

You only need to re-run `build:data` when your repos change. For everything else — theme, layout, profile, resume — use `build:assemble` or just let `build-config` handle it on push.

---

## Configuration

Everything lives in `gallery.config.yaml`. Here is the full reference:

```yaml
# ─── Profile ─────────────────────────────────────────────────────────
profile:
  name: "Your Name"
  bio: "Full-stack developer building in the vibe coding era"
  # bio_override: "Takes precedence over AI-generated bio if set"
  avatar: github           # 'github' fetches your avatar, or use a direct URL
  links:
    github: "https://github.com/yourusername"
    x: "https://x.com/yourusername"
    linkedin: "https://linkedin.com/in/yourusername"
    email: "you@example.com"
    website: "https://example.com"

# ─── Language ────────────────────────────────────────────────────────
language: en               # en | zh — controls UI labels and LLM extraction language

# ─── Appearance ──────────────────────────────────────────────────────
theme: terminal            # minimal | grid | magazine | terminal
accent: "#00ff88"          # optional hex color override

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
  education:
    - school: "University of Example"
      degree: "B.S. Computer Science"
      period: "2018 - 2022"

# ─── Auto-import from GitHub ─────────────────────────────────────────
import:
  github: yourusername
  exclude: [yourusername/dotfiles, yourusername/scratch]
  min_stars: 0
  exclude_forks: true      # skip forked repos (default: true)

# ─── Explicit projects (any platform) ────────────────────────────────
projects:
  - github: owner/flagship-project
    featured: true
    demo_url: "https://demo.example.com"
    screenshots:
      - "https://example.com/screenshot1.png"
    status: active          # active | wip | archived (auto-inferred if omitted)
    display:
      stats: milestones
    override:
      title: "My Best Project"          # override auto-detected repo name
      description: "Custom description" # override LLM-extracted description
      techStack: [TypeScript, React, PostgreSQL]
      features:
        - "Real-time collaboration"
        - "Offline-first sync"
      heroImage: "https://example.com/hero.png"

  # Gitee
  - gitee: owner/chinese-project

  # Aliyun Codeup
  - codeup:
      org: your-org
      repo: internal-tool

  # Self-hosted Gitea
  - gitea:
      url: "https://git.example.com"
      repo: owner/private-tool

# ─── Sync schedule ───────────────────────────────────────────────────
sync:
  schedule: "0 6 * * 1"   # cron — controls build-full weekly trigger
  on_push: true
```

Any field marked optional can be omitted. `import` and `projects` can coexist — explicit `projects` entries override auto-imported ones with the same repo.

**Project status auto-inference** (when `status` is not set):
- Updated within 3 months → `active`
- Updated 3–12 months ago → `wip`
- Not updated for over 12 months → `archived`

---

## Themes

| Theme      | Style                                   |
|------------|-----------------------------------------|
| `minimal`  | Clean, whitespace-heavy, prose-like     |
| `grid`     | Card-based, structured, GitHub-inspired |
| `magazine` | Editorial, bold typography, serif       |
| `terminal` | Dark, monospace, hacker aesthetic       |

Set `accent` to any hex color to tint links, highlights, and borders.

## Layout System

Layout is composed from four independent dimensions — pick one value from each:

- **`page`** — overall page shape.
  - `single-column` — everything stacked, classic long-form.
  - `sidebar` — profile/resume on the left, projects on the right.
  - `hero` — large profile block above a projects section.
- **`projects`** — how project cards are arranged.
  - `grid` — uniform columns.
  - `masonry` — Pinterest-style variable heights.
  - `list` — vertical rows.
  - `featured-first` — one hero card spanning full width, smaller cards below.
- **`columns`** — `1`, `2`, `3`, or `auto` (responsive).
- **`density`** — `compact`, `comfortable`, or `spacious` — controls padding and gaps.

Changing theme/layout only requires `build:assemble` (or pushing to trigger `build-config`).

## Supported Platforms

- **GitHub** — public and private repos (via `GITHUB_TOKEN`, auto-provided in Actions).
- **Gitee** — via `GITEE_TOKEN`.
- **Codeup / Aliyun DevOps** — via `CODEUP_TOKEN`.
- **Gitea (self-hosted)** — via `GITEA_TOKEN`. Specify the instance URL per-project.

## AI-Powered Extraction

vibe-gallery uses a **BYOK** (bring your own key) model for LLM-assisted extraction of tech stack, features, and descriptions from READMEs.

- Set `LLM_API_KEY` and `LLM_BASE_URL` in your fork's GitHub Actions secrets.
- Optionally set `LLM_MODEL` (defaults to `gpt-4o-mini`).
- Works with any OpenAI-compatible endpoint (OpenAI, DeepSeek, SiliconFlow, Moonshot, local Ollama, etc.).

If no LLM is configured, the build falls back to heuristic parsing — you still get a usable portfolio. All extracted data can be overridden manually via `override:`.

## CLI

```bash
npx vibe-gallery init       # interactive wizard — scaffolds gallery.config.yaml
npx vibe-gallery preview    # local build + preview server
```

## License

MIT — fork it, ship it, make it yours.
