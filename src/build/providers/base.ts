import type {
  RepoIdentifier,
  RawRepoInfo,
  RawRelease,
  ListReposOptions,
} from '../../types/index.js'

export type {
  RepoIdentifier,
  RawRepoInfo,
  RawRelease,
  ListReposOptions,
}

export interface RepoProvider {
  fetchReadme(id: RepoIdentifier): Promise<string>
  fetchRepoInfo(id: RepoIdentifier): Promise<RawRepoInfo>
  fetchReleases(id: RepoIdentifier): Promise<RawRelease[]>
  listUserRepos(
    username: string,
    opts: ListReposOptions
  ): Promise<RepoIdentifier[]>
}
