import type { RepoIdentifier, RawRepoInfo, RawRelease, ListReposOptions, } from '../../types/index.js'
import type { RepoProvider } from './base.js'
import { GitHubProvider } from './github.js'

const providerRegistry = new Map<string, (id: RepoIdentifier) => RepoProvider>()

// Register built-in GitHub provider
providerRegistry.set('github', () => new GitHubProvider(process.env.GITHUB_TOKEN))

export function registerProvider(
  platform: string,
  factory: (id: RepoIdentifier) => RepoProvider,
): void {
  providerRegistry.set(platform, factory)
}

export function createProvider(id: RepoIdentifier): RepoProvider {
  const factory = providerRegistry.get(id.platform)
  if (!factory) {
    throw new Error(
      `Unknown platform: "${id.platform}". Available: ${[...providerRegistry.keys()].join(', ')}. ` +
      `Use registerProvider() to add custom platform support.`,
    )
  }
  return factory(id)
}

export type { RepoProvider } from './base.js'
