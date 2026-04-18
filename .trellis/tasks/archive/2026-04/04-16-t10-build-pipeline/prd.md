# T10: Build Pipeline (data fetch → gallery.json → vite build)

## Goal
Implement the main build script `src/build/index.ts` that orchestrates the full data pipeline: read config → list repos → fetch data (with cache) → extract → write gallery.json.

## Requirements

### `src/build/index.ts` — Main orchestrator
```typescript
async function main() {
  const config = await loadConfig()
  const identifiers = resolveProjects(config)

  // For import.github: list user repos and merge
  if (config.import?.github) {
    const provider = createProvider({ platform: 'github', owner: config.import.github, repo: '' })
    const imported = await provider.listUserRepos(config.import.github, {
      exclude: config.import.exclude ?? [],
      minStars: config.import.minStars ?? 0,
    })
    // merge, dedup
  }

  // Fetch all repos in parallel (max 5 concurrent)
  const projects = await fetchAllProjects(identifiers, config)

  // Generate AI profile summary
  const bio = await generateProfileSummary(projects, config.profile)

  // Assemble GalleryData
  const galleryData: GalleryData = {
    profile: assembleProfile(config.profile, bio),
    resume: config.resume ?? { sections: [], skills: [], experience: [], education: [] },
    projects,
    theme: config.theme,
    accent: config.accent,
    layout: config.layout,
    builtAt: new Date().toISOString(),
  }

  // Write to src/app/data/gallery.json
  await fs.writeFile('src/app/data/gallery.json', JSON.stringify(galleryData, null, 2))
  console.log(`✓ Built gallery with ${projects.length} projects`)
}
```

### `fetchAllProjects` function
- For each RepoIdentifier, check cache first (key = `${platform}:${owner}/${repo}@${sha}`)
- Cache hit → use cached ProjectData
- Cache miss → fetch + extract → cache
- Concurrency: max 5 parallel with p-limit
- Apply `override` fields from config after extraction

### `assembleProfile` function
- Build `ProfileData` from config:
  - `avatarUrl`: if `config.profile.avatar === 'github'` → `https://github.com/${config.import?.github ?? config.profile.name}.png`; else use as URL directly
  - `links`: convert `config.profile.links` Record to `SocialLink[]` — infer icon type from key ('github'→'github', 'x'→'x', 'email'→'email', 'linkedin'→'linkedin', 'weibo'→'weibo', else 'website')

### `fetchSingleProject` function
```typescript
async function fetchSingleProject(
  id: RepoIdentifier,
  projectConfig: ProjectConfig | undefined,
  extractor: Extractor
): Promise<ProjectData>
```
- Get provider for id
- Fetch repoInfo (always needed)
- Check cache by `id@repoInfo.sha`
- If cache miss:
  - Fetch readme
  - Fetch releases if `display.stats === 'milestones'`
  - Extract structured data
  - Fix image paths
- Apply overrides from projectConfig
- Assemble into ProjectData

## Acceptance Criteria
- [ ] `tsc --noEmit` passes
- [ ] `npm run build:data` runs successfully on the demo `gallery.config.yaml`
- [ ] `src/app/data/gallery.json` is written with valid structure
- [ ] Cache file `.gallery-cache.json` is created on second run
- [ ] Second run is faster (cache hits)

## Technical Notes
- Import p-limit: `import pLimit from 'p-limit'`
- The `display.stats` controls which data is fetched: 'stars' → fetchRepoInfo only; 'milestones' → also fetchReleases; 'none' → minimal fetch
- `gallery.config.yaml` already has a minimal demo project — use it for testing
- On any individual project error: log warning and skip (don't fail the whole build)
