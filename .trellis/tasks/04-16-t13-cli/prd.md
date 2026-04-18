# T13: CLI Tool (vibe-gallery init + preview)

## Goal
Implement the `packages/cli` npm package providing `npx vibe-gallery` commands: `init` (interactive setup wizard) and `preview` (local preview server).

## Requirements

### `packages/cli/src/commands/init.ts`
Interactive wizard that generates a `gallery.config.yaml`:
1. Ask: "Your name?"
2. Ask: "Short bio? (optional)"
3. Ask: "GitHub username? (for auto-import)"
4. Ask: "Choose a theme: minimal / grid / magazine / terminal" (default: terminal)
5. Ask: "Page layout: single-column / sidebar / hero" (default: sidebar)

Use Node.js built-in `readline` (no extra deps) for prompts.

Output: write `gallery.config.yaml` to cwd with user answers, and add `.env.example` with:
```
GITHUB_TOKEN=your_github_token_here
# LLM_API_KEY=your_openai_key
# LLM_BASE_URL=https://api.openai.com/v1
# LLM_MODEL=gpt-4o-mini
```

### `packages/cli/src/commands/preview.ts`
Runs the build and starts Vite preview:
1. Run `npm run build:data` in the project root
2. Run `npm run build:app` in the project root
3. Run `npm run preview` to start the preview server
4. Print: "Preview running at http://localhost:4173"

Use `child_process.spawn` to run npm commands.

### `packages/cli/src/index.ts`
Main CLI entry:
```typescript
#!/usr/bin/env node
import { init } from './commands/init.js'
import { preview } from './commands/preview.js'

const command = process.argv[2]

switch (command) {
  case 'init':
    init()
    break
  case 'preview':
    preview()
    break
  default:
    console.log('Usage: vibe-gallery <command>')
    console.log('Commands:')
    console.log('  init     Interactive setup wizard')
    console.log('  preview  Build and preview your gallery locally')
    process.exit(command ? 1 : 0)
}
```

## Acceptance Criteria
- [ ] `tsc --noEmit` passes for packages/cli
- [ ] `node packages/cli/src/index.ts` (via tsx) prints help when no command given
- [ ] `init` command generates valid gallery.config.yaml

## Technical Notes
- CLI package is `type: module` in package.json
- No external dependencies — use only Node.js builtins
- The CLI is meant to be run via `npx vibe-gallery` after publishing, or locally via `node packages/cli/src/index.ts`
