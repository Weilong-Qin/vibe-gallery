# T03: Provider Abstraction + GitHub Provider

## Goal
Implement the `RepoProvider` interface and the GitHub provider that supports both public and private repos, plus account-level repo listing for auto-import.

## Requirements

### Base provider interface (`src/build/providers/base.ts`)
Already has a placeholder — flesh it out:
```typescript
export interface RepoProvider {
  fetchReadme(id: RepoIdentifier): Promise<string>
  fetchRepoInfo(id: RepoIdentifier): Promise<RawRepoInfo>
  fetchReleases(id: RepoIdentifier): Promise<RawRelease[]>
  listUserRepos(username: string, opts: ListReposOptions): Promise<RepoIdentifier[]>
}
```

### Provider factory (`src/build/providers/index.ts`)
```typescript
export function createProvider(id: RepoIdentifier): RepoProvider
```
- Reads tokens from env vars: `GITHUB_TOKEN`, `GITEE_TOKEN`, `CODEUP_TOKEN`, `GITEA_TOKEN`
- Returns correct provider based on `id.platform`
- Gitee/Codeup/Gitea return `NotImplementedProvider` (stub that throws "not implemented yet")

### GitHub Provider (`src/build/providers/github.ts`)
Use `@octokit/rest` to implement:

1. `fetchReadme(id)` — GET `/repos/{owner}/{repo}/readme`, decode base64 content
2. `fetchRepoInfo(id)` — GET `/repos/{owner}/{repo}`, map to `RawRepoInfo`:
   - `name`, `description`, `language`, `stars`, `forks`, `watchers`, `defaultBranch`, `topics`
3. `fetchReleases(id)` — GET `/repos/{owner}/{repo}/releases`, map to `RawRelease[]`:
   - `id`, `tag`, `name`, `body`, `publishedAt`
4. `listUserRepos(username, opts)` — GET `/users/{username}/repos` with pagination:
   - Applies `opts.exclude` filter
   - Applies `opts.minStars` filter
   - Returns `RepoIdentifier[]`

Error handling:
- 404 → throw with clear message "Repo {owner}/{repo} not found (404)"
- 401/403 → throw "GitHub auth failed — check GITHUB_TOKEN"
- Rate limit (403 with x-ratelimit-remaining: 0) → throw "GitHub rate limit exceeded"

Private repo support: works automatically if `GITHUB_TOKEN` has `repo` scope.

## Acceptance Criteria
- [ ] `tsc --noEmit` passes
- [ ] `fetchReadme` on a known public repo returns markdown string
- [ ] `listUserRepos` filters by minStars correctly
- [ ] Missing token on private repo → clear auth error

## Technical Notes
- Use `new Octokit({ auth: token })` — token is optional (public repos work without it)
- Do NOT hardcode any tokens
- Map GitHub API response fields to our `RawRepoInfo` type — don't leak Octokit types into the rest of the codebase
