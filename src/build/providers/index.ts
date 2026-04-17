import type {
  RepoIdentifier,
  RawRepoInfo,
  RawRelease,
  ListReposOptions,
} from '../../types/index.js'
import type { RepoProvider } from './base.js'
import { GitHubProvider } from './github.js'

class NotImplementedProvider implements RepoProvider {
  constructor(private platform: string) {}

  fetchReadme(_id: RepoIdentifier): Promise<string> {
    return Promise.reject(
      new Error(`${this.platform} provider not implemented yet`)
    )
  }

  fetchRepoInfo(_id: RepoIdentifier): Promise<RawRepoInfo> {
    return Promise.reject(
      new Error(`${this.platform} provider not implemented yet`)
    )
  }

  fetchReleases(_id: RepoIdentifier): Promise<RawRelease[]> {
    return Promise.reject(
      new Error(`${this.platform} provider not implemented yet`)
    )
  }

  listUserRepos(
    _username: string,
    _opts: ListReposOptions
  ): Promise<RepoIdentifier[]> {
    return Promise.reject(
      new Error(`${this.platform} provider not implemented yet`)
    )
  }
}

export function createProvider(id: RepoIdentifier): RepoProvider {
  switch (id.platform) {
    case 'github':
      return new GitHubProvider(process.env.GITHUB_TOKEN)
    case 'gitee':
      return new NotImplementedProvider('Gitee')
    case 'codeup':
      return new NotImplementedProvider('Codeup')
    case 'gitea':
      return new NotImplementedProvider('Gitea')
    default:
      throw new Error(`Unknown platform: ${(id as RepoIdentifier).platform}`)
  }
}

export type { RepoProvider } from './base.js'
