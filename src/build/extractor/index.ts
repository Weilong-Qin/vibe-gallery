import type { ExtractedData, RawRepoInfo } from '../../types/index.js'
import { HeuristicExtractor } from './heuristic.js'
import { LLMExtractor } from './llm.js'

export interface Extractor {
  extract(readme: string, repoInfo: RawRepoInfo, language?: 'en' | 'zh'): Promise<ExtractedData>
}

export { HeuristicExtractor, LLMExtractor }

export function createExtractor(): Extractor {
  if (process.env.LLM_API_KEY && process.env.LLM_BASE_URL) {
    return new LLMExtractor({
      baseUrl: process.env.LLM_BASE_URL,
      apiKey: process.env.LLM_API_KEY,
      model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
    })
  }
  return new HeuristicExtractor()
}
