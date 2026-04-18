# Journal - weilong (Part 1)

> AI development session journal
> Started: 2026-04-16

---



## Session 1: Full vibe-gallery implementation + bug fixes + two-workflow CI

**Date**: 2026-04-18
**Task**: Full vibe-gallery implementation + bug fixes + two-workflow CI
**Branch**: `main`

### Summary

(Add summary)

### Main Changes

## Summary

Full end-to-end implementation of vibe-gallery across all 14 planned tasks, followed by iterative bug fixes based on live testing with real credentials.

## What Was Built

| Area | Details |
|------|---------|
| Build pipeline | `src/build/index.ts` — GitHub API → LLM extraction → `gallery.json` |
| Config schema | Zod validation in `src/build/config.ts`; `exclude_forks: true` default |
| GitHub provider | `@octokit/rest` with fork filtering, `pushedAt` for status inference |
| Other providers | Gitee/Codeup/Gitea stubs via `NotImplementedProvider` |
| LLM extractor | SiliconFlow-compatible: no `response_format`, code-fence stripping, retry on 429 |
| Heuristic extractor | Markdown parsing fallback for tech stack, features, description |
| Theme system | 4 CSS themes (minimal, grid, magazine, terminal) via CSS custom properties |
| Layout system | Data-attribute CSS (`data-page-layout`, `data-projects-layout`, `data-density`) |
| Resume components | Profile, Skills, Experience, Education |
| Project components | ProjectCard (clickable title), StatsBar (⑂ fork icon, no dupe tags) |
| Fast assembly | `src/build/assemble.ts` — reads cache + config, no API calls, 0.45s |
| Two workflows | `build-full.yml` (full fetch+deploy) + `build-config.yml` (cache+config only ~1min) |
| CLI | `packages/cli` — `vibe-gallery init` and `vibe-gallery preview` |
| Docs | README.md (two-workflow explanation) + README.zh.md (Chinese translation) |

## Key Bug Fixes (from live testing)

- **LLM not working**: `response_format: json_object` rejected by SiliconFlow → removed
- **Code fence in LLM output**: Added stripping of ` ```json ` wrappers
- **429 rate limits**: Added `callWithRetry` with exponential backoff (3s, 6s, 9s)
- **Stars/forks missing**: `pushedAt` was missing from provider return → added
- **Fork repos included**: Added `exclude_forks: true` default to config schema + provider
- **Duplicate tech tags**: Removed language tag from StatsBar (already in techStack)
- **Description truncated**: Removed `line-clamp` from ProjectCard description
- **Title was LLM summary**: Changed to use repo name directly (`id.repo`)
- **Concurrency**: Reduced `pLimit` from 5→2 to avoid rate limiting

## Actions Cache Strategy

`build-full` saves `.gallery-cache.json` with key `gallery-data-{run_id}`.
`build-config` restores with `restore-keys: gallery-data-` to get latest across runs.
Falls back to `build:data` if no cache exists (first-time fork).


### Git Commits

| Hash | Message |
|------|---------|
| `437e982` | (see git log) |
| `ddf6afa` | (see git log) |
| `d3b96ba` | (see git log) |
| `d32fd4d` | (see git log) |
| `c23fb83` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete
