import type { ProfileConfig, ProjectData } from '../../types/index.js'

export async function generateProfileSummary(
  projects: ProjectData[],
  config: ProfileConfig,
): Promise<string> {
  if (config.bio_override) return config.bio_override

  if (process.env.LLM_API_KEY && process.env.LLM_BASE_URL) {
    try {
      const projectList = projects
        .slice(0, 10)
        .map((p) => `- ${p.title}: ${p.description}`)
        .join('\n')

      const response = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `Write a 2-sentence developer bio for ${config.name} based on these projects:\n${projectList}\n\nBio should be written in third person and highlight their expertise.`,
            },
          ],
        }),
      })

      if (!response.ok) throw new Error('LLM error')
      const data = (await response.json()) as { choices: { message: { content: string } }[] }
      const content = data.choices[0]?.message?.content?.trim()
      if (content) return content
    } catch {
      // fall through to default
    }
  }

  return config.bio ?? ''
}
