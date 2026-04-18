# T01: Monorepo Scaffold + Tooling

## Goal
Bootstrap the entire vibe-gallery repository skeleton — directory structure, package.json files, TypeScript config, Vite config, and tooling — so every subsequent task has a working build environment to code into.

## Requirements

### Directory Structure
Create the full directory tree from tech-spec Section 1:
- `src/build/` — Node.js build scripts
- `src/app/` — React frontend (Vite)
- `src/types/` — Shared TypeScript types
- `packages/cli/src/` — CLI tool (npm workspace)
- `.github/workflows/` — placeholder for GitHub Actions

### Root package.json
- npm workspaces: `["packages/*"]`
- Scripts: `build:data` (tsx src/build/index.ts), `build:app` (vite build), `build` (build:data then build:app), `preview` (vite preview), `dev` (vite)
- Dependencies: react, react-dom, js-yaml, zod, octokit, openai (or openai-compatible client), p-limit
- devDependencies: typescript, vite, @vitejs/plugin-react, tsx, @types/node, @types/react, @types/react-dom, @types/js-yaml, eslint, prettier

### TypeScript Config
- `tsconfig.json` at root — strict mode, paths alias `@types` → `src/types`, `@app` → `src/app`, `@build` → `src/build`
- Target ES2022, moduleResolution bundler

### Vite Config
- `vite.config.ts` — React plugin, resolve aliases matching tsconfig paths
- Output to `dist/`
- Input: `src/app/main.tsx`

### Placeholder Files
Create minimal placeholder files so TypeScript doesn't error:
- `src/types/index.ts` — export all shared types (from tech-spec Section 3)
- `src/app/main.tsx` — minimal React entry
- `src/app/App.tsx` — skeleton component
- `src/build/index.ts` — TODO placeholder
- `packages/cli/package.json` — CLI package manifest
- `packages/cli/src/index.ts` — placeholder

### Tooling
- `.gitignore` — node_modules, dist, `src/app/data/gallery.json`, `.env*`
- `gallery.config.example.yaml` — full example from PRD
- `gallery.config.yaml` — minimal starter (for dev/demo)

## Acceptance Criteria
- [ ] `npm install` succeeds at workspace root
- [ ] `npx tsc --noEmit` passes (no type errors) on placeholder files
- [ ] `npm run dev` starts Vite dev server (even if page is blank)
- [ ] `npm run build:data` runs without crashing (placeholder build script)
- [ ] Directory structure matches tech-spec Section 1

## Technical Notes
- Use `tsx` (not ts-node) to run TypeScript build scripts directly
- `gallery.json` is generated at build time — gitignore it, but keep `src/app/data/` dir with a `.gitkeep`
- LayoutConfig must match the spec: `{ page, projects, columns, density }` — not flat string
