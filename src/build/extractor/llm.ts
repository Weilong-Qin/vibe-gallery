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

  private async callWithRetry(body: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body,
      })
      if (response.status === 429) {
        const wait = (i + 1) * 3000
        console.warn(`  LLM rate limited, retrying in ${wait / 1000}s...`)
        await new Promise(r => setTimeout(r, wait))
        continue
      }
      return response
    }
    throw new Error('LLM API error: 429 after retries')
  }

  async extract(readme: string, repoInfo: RawRepoInfo): Promise<ExtractedData> {
    try {
      const truncated = readme.slice(0, 4000)
      const body = JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a developer portfolio assistant. Extract structured information from a GitHub README. Return only valid JSON.',
          },
          {
            role: 'user',
            content: `Extract project info from this README. Reply with ONLY a JSON object, no markdown, no explanation:
{
  "title": "project name",
  "description": "one sentence (max 120 chars) describing what this does",
  "techStack": ["tech1", "tech2"],
  "features": ["Key feature 1", "Key feature 2"],
  "heroImage": "url or null"
}

README:
${truncated}`,
          },
        ],
      })

      const response = await this.callWithRetry(body)
      if (!response.ok) throw new Error(`LLM API error: ${response.status}`)

      const data = (await response.json()) as {
        choices: { message: { content: string } }[]
      }
      const raw = data.choices[0]?.message?.content
      if (!raw) throw new Error('Empty LLM response')

      // strip markdown code fences if model wraps output
      const content = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim()
      const parsed = JSON.parse(content) as Partial<ExtractedData>

      return {
        title: parsed.title ?? '',
        description: parsed.description ?? '',
        techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
        features: Array.isArray(parsed.features) ? parsed.features : [],
        heroImage: parsed.heroImage ?? undefined,
      }
    } catch (err) {
      console.warn(
        `  LLM extraction failed, using heuristic: ${err instanceof Error ? err.message : String(err)}`,
      )
      return this.fallback.extract(readme, repoInfo)
    }
  }
}
