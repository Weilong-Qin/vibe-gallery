# T12: GitHub Actions Workflow (build + deploy + cache)

## Goal
Create the GitHub Actions workflow file that runs the full build pipeline and deploys the static site to GitHub Pages. Includes cache strategy keyed by repo SHA.

## Requirements

### `.github/workflows/build.yml`

```yaml
name: Build and Deploy Gallery

on:
  push:
    branches: [main]
    paths:
      - 'gallery.config.yaml'
      - 'src/**'
      - '.github/workflows/build.yml'
  schedule:
    - cron: '0 6 * * 1'  # Weekly Monday 6am UTC (overridden by user config)
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Restore gallery cache
        uses: actions/cache@v4
        with:
          path: .gallery-cache.json
          key: gallery-cache-${{ hashFiles('gallery.config.yaml') }}
          restore-keys: |
            gallery-cache-

      - name: Build data
        run: npm run build:data
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITEE_TOKEN: ${{ secrets.GITEE_TOKEN }}
          CODEUP_TOKEN: ${{ secrets.CODEUP_TOKEN }}
          GITEA_TOKEN: ${{ secrets.GITEA_TOKEN }}
          LLM_API_KEY: ${{ secrets.LLM_API_KEY }}
          LLM_BASE_URL: ${{ secrets.LLM_BASE_URL }}
          LLM_MODEL: ${{ secrets.LLM_MODEL }}

      - name: Build frontend
        run: npm run build:app

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Notes
- Cache key uses `hashFiles('gallery.config.yaml')` so cache invalidates when config changes
- `restore-keys: gallery-cache-` allows partial cache hits from previous runs
- `GITHUB_TOKEN` is auto-provided by Actions; others are optional secrets
- `workflow_dispatch` allows manual triggers from the GitHub UI

## Acceptance Criteria
- [ ] `.github/workflows/build.yml` is valid YAML
- [ ] All required secrets are documented (in comments or README)
- [ ] Workflow has correct permissions for Pages deployment
- [ ] Cache step uses correct restore-keys strategy
