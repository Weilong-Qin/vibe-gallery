# T02: Config Schema + Zod Validation

## Goal
Implement `src/build/config.ts` — YAML parsing and Zod schema validation for `gallery.config.yaml`. This is the single source of truth that all downstream tasks (providers, extractor, build pipeline, frontend) depend on.

## Requirements

### Zod Schema
Define a complete Zod schema in `src/build/config.ts` that:
- Validates all fields from `GalleryConfig` in `src/types/index.ts`
- Provides sensible defaults (e.g., `theme: 'minimal'`, `layout.density: 'comfortable'`)
- Gives clear error messages for invalid values
- Infers the `GalleryConfig` type from the schema (so types stay in sync)

Key schemas:
- `LayoutConfigSchema` — `page`, `projects`, `columns`, `density`
- `ProfileConfigSchema` — name (required), bio, avatar (default 'github'), links
- `ProjectConfigSchema` — platform field (github/gitee/codeup/gitea, exactly one required), featured, status, demo_url, screenshots, display.stats, override
- `ResumeConfigSchema` — sections array, skills, experience, education
- `ImportConfigSchema` — github username, exclude list, min_stars
- `SyncConfigSchema` — schedule (cron string), on_push
- `GalleryConfigSchema` — root schema composing all above

### loadConfig function
```typescript
export async function loadConfig(configPath: string): Promise<GalleryConfig>
```
- Reads YAML file from disk
- Parses with js-yaml
- Validates with Zod schema
- On validation error: print human-readable error (using `z.ZodError.flatten()`) and throw
- Returns typed `GalleryConfig`

### resolveProjects function
```typescript
export function resolveProjects(config: GalleryConfig): RepoIdentifier[]
```
- Merges `import.github` auto-imported repos (placeholder — just returns empty array, actual listing happens at build time) with `projects[]` list
- Normalizes each `ProjectConfig` into a `RepoIdentifier`
- Deduplicates by `platform + owner/repo`

## Acceptance Criteria
- [ ] `loadConfig('gallery.config.yaml')` succeeds on the example config
- [ ] Missing required field `profile.name` throws a clear error
- [ ] Invalid `theme` value throws a clear error
- [ ] Invalid `layout.columns` value (not 1/2/3/'auto') throws a clear error
- [ ] `tsc --noEmit` passes

## Technical Notes
- Import types from `../../types/index.ts` (or alias `@types/index.ts`)
- The Zod schema should be the **source of truth** for validation — `src/types/index.ts` types can optionally be replaced by `z.infer<typeof GalleryConfigSchema>` to avoid drift, but for now keep both and ensure they match
- Use `z.discriminatedUnion` or `z.union` for platform fields in ProjectConfig
