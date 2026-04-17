import { createInterface } from 'readline'
import { writeFile, access } from 'fs/promises'
import { resolve } from 'path'

function prompt(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve))
}

export async function init() {
  const rl = createInterface({ input: process.stdin, output: process.stdout })

  console.log('\n✨ vibe-gallery setup\n')

  try {
    const configPath = resolve(process.cwd(), 'gallery.config.yaml')

    // Check if config already exists
    try {
      await access(configPath)
      const overwrite = await prompt(rl, 'gallery.config.yaml already exists. Overwrite? (y/N) ')
      if (!overwrite.toLowerCase().startsWith('y')) {
        console.log('Aborted.')
        rl.close()
        return
      }
    } catch {
      // file doesn't exist, proceed
    }

    const name = (await prompt(rl, 'Your name: ')).trim() || 'Developer'
    const bio = (await prompt(rl, 'Short bio (optional): ')).trim()
    const github = (await prompt(rl, 'GitHub username (for auto-import, optional): ')).trim()
    const themeInput = (await prompt(rl, 'Theme [minimal/grid/magazine/terminal] (default: terminal): ')).trim().toLowerCase()
    const theme = ['minimal', 'grid', 'magazine', 'terminal'].includes(themeInput) ? themeInput : 'terminal'
    const layoutInput = (await prompt(rl, 'Page layout [single-column/sidebar/hero] (default: sidebar): ')).trim().toLowerCase()
    const pageLayout = ['single-column', 'sidebar', 'hero'].includes(layoutInput) ? layoutInput : 'sidebar'

    const configYaml = `profile:
  name: "${name}"${bio ? `\n  bio: "${bio}"` : ''}
  avatar: github
  links:
    ${github ? `github: "https://github.com/${github}"` : '# github: "https://github.com/yourusername"'}
    # x: "https://x.com/yourusername"
    # email: "you@example.com"

theme: ${theme}
# accent: "#00ff88"  # optional accent color override

layout:
  page: ${pageLayout}
  projects: featured-first
  columns: 2
  density: comfortable

display:
  stats: stars

resume:
  sections: [skills, experience, education, projects]
  skills: []
  experience: []
  education: []

${github ? `import:
  github: ${github}
  exclude: []
  min_stars: 0

` : ''}projects: []
  # Example:
  # - github: owner/repo
  #   featured: true
  #   demo_url: "https://demo.example.com"
  #   status: active  # active | wip | archived

sync:
  on_push: true
  schedule: "0 6 * * 1"  # Weekly rebuild (Monday 6am UTC)
`

    await writeFile(configPath, configYaml)
    console.log(`\n✓ Created gallery.config.yaml`)

    // Write .env.example
    const envExample = `# GitHub token for fetching repo data (required for private repos)
GITHUB_TOKEN=your_github_token_here

# Optional: Gitee / Codeup / Gitea tokens
# GITEE_TOKEN=
# CODEUP_TOKEN=
# GITEA_TOKEN=

# Optional: LLM for AI-powered README extraction and profile summary
# LLM_API_KEY=your_openai_key
# LLM_BASE_URL=https://api.openai.com/v1
# LLM_MODEL=gpt-4o-mini
`
    await writeFile(resolve(process.cwd(), '.env.example'), envExample)
    console.log('✓ Created .env.example')

    console.log('\nNext steps:')
    console.log('  1. Edit gallery.config.yaml to add your projects and resume info')
    console.log('  2. Copy .env.example to .env and add your tokens')
    console.log('  3. Run: npm run build:data && npm run dev')
    console.log('  4. Push to GitHub to trigger automatic deployment\n')
  } finally {
    rl.close()
  }
}
