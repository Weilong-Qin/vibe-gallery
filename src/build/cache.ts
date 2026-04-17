import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ProjectData } from '../types/index.js'

const CACHE_FILE = join(process.cwd(), '.gallery-cache.json')
let cache: Record<string, ProjectData> | null = null

async function loadCache(): Promise<Record<string, ProjectData>> {
  if (cache) return cache
  try {
    const content = await readFile(CACHE_FILE, 'utf-8')
    cache = JSON.parse(content) as Record<string, ProjectData>
  } catch {
    cache = {}
  }
  return cache
}

export async function getCached(key: string): Promise<ProjectData | null> {
  const c = await loadCache()
  return c[key] ?? null
}

export async function setCached(
  key: string,
  data: ProjectData,
): Promise<void> {
  const c = await loadCache()
  c[key] = data
  await writeFile(CACHE_FILE, JSON.stringify(c, null, 2))
}
