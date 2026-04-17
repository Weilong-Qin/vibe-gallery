import type { ExtractedData } from '../../types/index.js'

export function fixImagePaths(
  data: ExtractedData,
  owner: string,
  repo: string,
  branch: string,
): ExtractedData {
  const toAbsolute = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const path = url.startsWith('./')
      ? url.slice(2)
      : url.startsWith('/')
        ? url.slice(1)
        : url
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
  }

  return {
    ...data,
    heroImage: data.heroImage ? toAbsolute(data.heroImage) : undefined,
  }
}
