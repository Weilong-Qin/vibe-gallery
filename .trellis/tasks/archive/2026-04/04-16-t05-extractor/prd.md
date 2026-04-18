# T05: Extractor (Heuristic + LLM + Cache + AI Profile Summary)

## Goal
Implement the README extraction pipeline: structured data extraction from raw README markdown, with LLM as primary and heuristic parsing as fallback. Also includes Actions cache layer and AI-generated developer profile summary.

## Requirements

### Extractor interface (`src/build/extractor/index.ts`)
```typescript
export interface Extractor {
  extract(readme: string, repoInfo: RawRepoInfo): Promise<ExtractedData>
}

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
```

### HeuristicExtractor (`src/build/extractor/heuristic.ts`)
Parse README markdown structure to extract:
- **title**: First `# Heading` or repo name from repoInfo
- **description**: First paragraph after the title (or repoInfo.description)
- **techStack**: Look for "Tech Stack", "Built With", "Technologies" sections — extract list items; also scan for common tech keywords (React, Vue, TypeScript, Python, Go, Rust, Docker, etc.)
- **features**: Look for "Features", "What it does", "Highlights" sections — extract as bullet points
- **heroImage**: First `![...](url)` in the README with a non-icon URL (exclude badges/shields)

### LLMExtractor (`src/build/extractor/llm.ts`)
Call OpenAI-compatible API to extract structured data:
```
System: You are a developer portfolio assistant. Extract structured information from a GitHub README.
User: <README content (truncated to 4000 chars)>

Return JSON:
{
  "title": "...",
  "description": "One-sentence summary of what this project does",
  "techStack": ["lang/framework list"],
  "features": ["Key feature 1", "Key feature 2"],
  "heroImage": "url or null"
}
```
- Use fetch with OpenAI-compatible endpoint
- Parse JSON from response
- On error/invalid JSON → fallback to HeuristicExtractor

### Cache (`src/build/cache.ts`)
GitHub Actions cache is handled externally via `actions/cache`. The local cache is a simple JSON file:
- Cache file: `.gallery-cache.json` (gitignored)
- Key: `${platform}:${owner}/${repo}@${sha}`
- Structure: `Record<string, ProjectData>`
```typescript
export async function getCached(key: string): Promise<ProjectData | null>
export async function setCached(key: string, data: ProjectData): Promise<void>
```
Load the cache file once at startup, write after each entry.

### Image path fixer (`src/build/extractor/image.ts`)
```typescript
export function fixImagePaths(data: ExtractedData, repoInfo: RawRepoInfo): ExtractedData
```
Convert relative image paths in heroImage/screenshots to absolute GitHub raw URLs:
- `./screenshot.png` → `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/screenshot.png`
- Already-absolute URLs → unchanged

### AI Profile Summary (`src/build/extractor/profile.ts`)
```typescript
export async function generateProfileSummary(
  projects: ProjectData[],
  config: ProfileConfig
): Promise<string>
```
- If `config.bio_override` exists → return it unchanged
- If LLM configured: prompt = "Given these projects: {titles + descriptions}, write a 2-sentence developer bio for {name}"
- If no LLM → return `config.bio ?? ''`

## Acceptance Criteria
- [ ] `tsc --noEmit` passes
- [ ] HeuristicExtractor correctly extracts title from a sample README with `# Title`
- [ ] HeuristicExtractor falls back to repoInfo.description when no description paragraph found
- [ ] LLMExtractor falls back to heuristic on JSON parse error
- [ ] Cache read/write round-trip works

## Technical Notes
- Use native `fetch` (Node 18+) for LLM calls — no extra HTTP library needed
- Truncate README to 4000 chars before sending to LLM (cost control)
- The cache file `.gallery-cache.json` should be in `.gitignore`
