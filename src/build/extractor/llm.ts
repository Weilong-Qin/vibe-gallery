import type { ExtractedData, RawRepoInfo } from '../../types/index.js'
import type { Extractor } from './index.js'
import { HeuristicExtractor } from './heuristic.js'

interface LLMConfig {
  baseUrl: string
  apiKey: string
  model: string
}

export class LLMExtractor implements Extractor {
  constructor(
    private config: LLMConfig,
    private fallback: Extractor = new HeuristicExtractor(),
  ) {}

  async extract(
    readme: string,
    repoInfo: RawRepoInfo,
  ): Promise<ExtractedData> {
    try {
      const truncated = readme.slice(0, 4000)
      const response = await fetch(
        `${this.config.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              {
                role: 'system',
                content:
                  'You are a developer portfolio assistant. Extract structured information from a GitHub README. Return only valid JSON.',
              },
              {
                role: 'user',
                content: `Extract project info from this README and return JSON with these exact fields:
{
  "title": "project name",
  "description": "one sentence describing what this does",
  "techStack": ["tech1", "tech2"],
  "features": ["feature1", "feature2"],
  "heroImage": "url or null"
}

README:
${truncated}`,
              },
            ],
            response_format: { type: 'json_object' },
          }),
        },
      )

      if (!response.ok) throw new Error(`LLM API error: ${response.status}`)
      const data = (await response.json()) as {
        choices: { message: { content: string } }[]
      }
      const content = data.choices[0]?.message?.content
      if (!content) throw new Error('Empty LLM response')

      const parsed = JSON.parse(content) as Partial<ExtractedData>
      return {
        title: parsed.title ?? '',
        description: parsed.description ?? '',
        techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
        features: Array.isArray(parsed.features) ? parsed.features : [],
        heroImage: parsed.heroImage ?? undefined,
      }
    } catch {
      return this.fallback.extract(readme, repoInfo)
    }
  }
}
