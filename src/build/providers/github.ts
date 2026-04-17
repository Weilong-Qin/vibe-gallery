import { Octokit } from '@octokit/rest'
import type {
  RepoProvider,
  RepoIdentifier,
  RawRepoInfo,
  RawRelease,
  ListReposOptions,
} from './base.js'

function handleGitHubError(err: unknown, owner: string, repo: string): never {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status
    if (status === 404) {
      throw new Error(`Repo ${owner}/${repo} not found (404)`)
    }
    if (status === 401 || status === 403) {
      const headers = (err as {
        response?: { headers?: Record<string, string> }
      }).response?.headers
      if (headers?.['x-ratelimit-remaining'] === '0') {
        throw new Error(
          'GitHub rate limit exceeded — wait or add GITHUB_TOKEN'
        )
      }
      throw new Error('GitHub auth failed — check GITHUB_TOKEN env var')
    }
  }
  throw err
}

export class GitHubProvider implements RepoProvider {
  private octokit: Octokit
  private hasToken: boolean

  constructor(token?: string) {
    this.octokit = new Octokit({ auth: token })
    this.hasToken = Boolean(token)
  }

  async fetchReadme(id: RepoIdentifier): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getReadme({
        owner: id.owner,
        repo: id.repo,
      })
      return Buffer.from(data.content, 'base64').toString('utf-8')
    } catch (err) {
      handleGitHubError(err, id.owner, id.repo)
    }
  }

  async fetchRepoInfo(id: RepoIdentifier): Promise<RawRepoInfo> {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner: id.owner,
        repo: id.repo,
      })

      const defaultBranch = data.default_branch
      let sha = ''
      try {
        const { data: branchData } = await this.octokit.rest.repos.getBranch({
          owner: id.owner,
          repo: id.repo,
          branch: defaultBranch,
        })
        sha = branchData.commit.sha
      } catch {
        // SHA is best-effort; leave empty string if branch fetch fails.
        sha = ''
      }

      return {
        stars: data.stargazers_count,
        forks: data.forks_count,
        watchers: data.subscribers_count ?? data.watchers_count,
        language: data.language ?? undefined,
        defaultBranch,
        sha,
      }
    } catch (err) {
      handleGitHubError(err, id.owner, id.repo)
    }
  }

  async fetchReleases(id: RepoIdentifier): Promise<RawRelease[]> {
    try {
      const { data } = await this.octokit.rest.repos.listReleases({
        owner: id.owner,
        repo: id.repo,
        per_page: 100,
      })
      return data.map((r) => ({
        version: r.tag_name,
        publishedAt: r.published_at ?? r.created_at ?? '',
        body: r.body ?? '',
      }))
    } catch (err) {
      handleGitHubError(err, id.owner, id.repo)
    }
  }

  async listUserRepos(
    username: string,
    opts: ListReposOptions
  ): Promise<RepoIdentifier[]> {
    try {
      const repos = this.hasToken
        ? await this.octokit.paginate(
            this.octokit.rest.repos.listForAuthenticatedUser,
            { per_page: 100, affiliation: 'owner' }
          )
        : await this.octokit.paginate(this.octokit.rest.repos.listForUser, {
            username,
            per_page: 100,
          })

      const exclude = new Set(opts.exclude ?? [])
      const minStars = opts.minStars ?? 0

      return repos
        .filter((r) => {
          if (this.hasToken && r.owner?.login !== username) return false
          if (exclude.has(r.name)) return false
          if ((r.stargazers_count ?? 0) < minStars) return false
          return true
        })
        .map((r) => ({
          platform: 'github' as const,
          owner: r.owner?.login ?? username,
          repo: r.name,
        }))
    } catch (err) {
      handleGitHubError(err, username, '*')
    }
  }
}
