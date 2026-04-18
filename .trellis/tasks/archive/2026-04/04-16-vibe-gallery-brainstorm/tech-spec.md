# Vibe Gallery — Technical Specification

## 1. 仓库结构

用户 fork 的是一个完整的 monorepo 模板。根目录是用户直接交互的层（填 config、push），`src/` 是框架代码，`packages/cli/` 单独发布为 npm 包。

```
vibe-gallery/
├── gallery.config.yaml          # ← 用户唯一需要编辑的文件
├── gallery.config.example.yaml  # 完整示例
├── .github/
│   └── workflows/
│       └── build.yml            # CI/CD（由 init CLI 生成 or 模板内置）
├── src/
│   ├── build/                   # 构建脚本（Node.js，构建期执行）
│   │   ├── index.ts             # 入口：读 config → fetch → extract → 写 gallery.json
│   │   ├── config.ts            # YAML 解析 + zod schema 校验
│   │   ├── providers/           # 多平台数据抓取适配器
│   │   │   ├── base.ts          # RepoProvider 接口定义
│   │   │   ├── github.ts        # GitHub（公开/私有 + 账户导入）
│   │   │   ├── gitee.ts         # Gitee
│   │   │   ├── codeup.ts        # 阿里云 Codeup（GitLab 兼容）
│   │   │   └── gitea.ts         # 自托管 Gitea
│   │   ├── extractor/           # README → 结构化数据
│   │   │   ├── llm.ts           # BYOK LLM 提取
│   │   │   ├── heuristic.ts     # 启发式解析降级
│   │   │   ├── profile.ts       # AI 生成开发者整体简介
│   │   │   └── image.ts         # 图片路径修正
│   │   └── cache.ts             # Actions cache 读写
│   ├── app/                     # React 前端（Vite 静态导出）
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── resume/          # 简历区块
│   │   │   │   ├── Profile.tsx
│   │   │   │   ├── Skills.tsx
│   │   │   │   ├── Experience.tsx
│   │   │   │   └── Education.tsx
│   │   │   └── projects/        # 作品集区块
│   │   │       ├── ProjectCard.tsx
│   │   │       ├── ProjectGrid.tsx
│   │   │       └── StatusBadge.tsx
│   │   ├── themes/
│   │   │   ├── index.ts         # 主题注册表
│   │   │   ├── minimal.css
│   │   │   ├── grid.css
│   │   │   ├── magazine.css
│   │   │   └── terminal.css
│   │   └── data/
│   │       └── gallery.json     # 构建脚本生成，gitignore（本地）
│   └── types/
│       └── index.ts             # 构建脚本和前端共享的 TypeScript 类型
├── packages/
│   └── cli/                     # 独立 npm 包：npx vibe-gallery
│       ├── src/
│       │   ├── commands/
│       │   │   ├── init.ts      # 交互式向导
│       │   │   └── preview.ts   # 本地预览
│       │   └── index.ts
│       └── package.json
├── vite.config.ts
├── tsconfig.json
└── package.json                 # workspace root
```

---

## 2. 核心数据流

```
gallery.config.yaml
       │
       ▼ parse + zod validate
   GalleryConfig
       │
       ├─── import.github → GitHubProvider.listUserRepos() → RepoIdentifier[]
       │
       ├─── projects[] → resolve platform → RepoIdentifier[]
       │
       ▼ merge + dedup
   RepoIdentifier[]
       │
       ▼ for each repo (parallel, max concurrency 5)
   ┌─────────────────────────────────────────┐
   │  cache.get(repo@sha)                    │
   │    hit  → ProjectData (skip fetch)      │
   │    miss → Provider.fetchReadme()        │
   │           + Provider.fetchRepoInfo()    │  ← 按 display.stats 按需调用
   │           + Provider.fetchReleases()    │
   │           → Extractor.extract(readme)   │
   │           → apply override fields       │
   │           → fixImagePaths()             │
   │           → cache.set(repo@sha, data)   │
   └─────────────────────────────────────────┘
       │
       ▼
   ProjectData[]
       │
       ▼ all projects extracted
   ProfileSummary ← LLM(all ProjectData[]) or config.profile.bio
       │
       ▼ assemble
   GalleryData = { profile, resume, projects, theme, ... }
       │
       ▼ write
   src/app/data/gallery.json
       │
       ▼ vite build
   dist/  →  GitHub Pages
```

---

## 3. TypeScript 类型系统（共享）

`src/types/index.ts` 在构建脚本和 React 前端之间共享，避免类型漂移。

```typescript
// ── Config types（用户填写的 YAML 结构）─────────────────��──────────

export interface GalleryConfig {
  profile: ProfileConfig
  theme: 'minimal' | 'grid' | 'magazine' | 'terminal'
  accent?: string
  layout: 'grid' | 'masonry' | 'list'
  display?: { stats: 'stars' | 'milestones' | 'none' }
  resume?: ResumeConfig
  sync?: SyncConfig
  import?: ImportConfig
  projects?: ProjectConfig[]
}

export interface ProfileConfig {
  name: string
  bio?: string
  bio_override?: string    // 优先于 AI 生成
  avatar: 'github' | string  // 'github' = 从 GitHub 自动拉取
  links?: Record<string, string>  // 任意 key→url，email 自动加 mailto:
}

export interface ProjectConfig {
  // 平台入口（四选一）
  github?: string           // "owner/repo"
  gitee?: string
  codeup?: { org: string; repo: string }
  gitea?: { url: string; repo: string }
  // 增强字段
  featured?: boolean
  status?: 'active' | 'wip' | 'archived'
  demo_url?: string
  screenshots?: string[]
  display?: { stats: 'stars' | 'milestones' | 'none' }
  override?: Partial<ExtractedData>
}

export interface ResumeConfig {
  sections: ('skills' | 'experience' | 'education' | 'projects')[]
  skills?: SkillCategory[]
  experience?: ExperienceItem[]
  education?: EducationItem[]
}

export interface SyncConfig {
  schedule?: string   // cron 表达式
  on_push?: boolean
}

export interface ImportConfig {
  github?: string     // GitHub username
  exclude?: string[]  // "owner/repo" 列表
  min_stars?: number
}

// ── Built data types（构建输出，前端消费）─────────────────────────────

export interface GalleryData {
  profile: ProfileData
  resume: ResumeData
  projects: ProjectData[]
  theme: GalleryConfig['theme']
  accent?: string
  layout: GalleryConfig['layout']
  builtAt: string   // ISO timestamp
}

export interface ProfileData {
  name: string
  bio: string         // AI 生成 or bio_override or 原始 bio
  avatarUrl: string
  links: SocialLink[]
}

export interface SocialLink {
  key: string         // 'github' | 'x' | 'email' | ...
  url: string
  icon: 'github' | 'x' | 'email' | 'linkedin' | 'website' | 'weibo' | 'generic'
}

export interface ProjectData {
  id: string
  platform: 'github' | 'gitee' | 'codeup' | 'gitea'
  repoUrl: string
  title: string
  description: string
  techStack: string[]
  features: string[]
  heroImage?: string
  demoUrl?: string
  screenshots: string[]
  status: 'active' | 'wip' | 'archived'
  featured: boolean
  display: { stats: 'stars' | 'milestones' | 'none' }
  stats?: StarsData | MilestonesData
}

export interface StarsData {
  type: 'stars'
  stars: number
  forks: number
  watchers: number
  language?: string
}

export interface MilestonesData {
  type: 'milestones'
  releases: { version: string; date: string; summary: string }[]
}

export interface ExtractedData {
  title: string
  description: string
  techStack: string[]
  features: string[]
  heroImage?: string
}

export interface ResumeData {
  sections: ResumeConfig['sections']
  skills: SkillCategory[]
  experience: ExperienceItem[]
  education: EducationItem[]
}

export interface SkillCategory { category: string; items: string[] }
export interface ExperienceItem {
  company: string; title: string; period: string
  location?: string; highlights?: string[]
}
export interface EducationItem {
  school: string; degree: string; period: string
}
```

---

## 4. Provider 架构

适配器模式，各平台实现 `RepoProvider` 接口。

```typescript
// src/build/providers/base.ts

export interface RepoIdentifier {
  platform: 'github' | 'gitee' | 'codeup' | 'gitea'
  owner: string
  repo: string
  baseUrl?: string   // Gitea 自托管 URL
  org?: string       // Codeup org
}

export interface RepoProvider {
  fetchReadme(id: RepoIdentifier): Promise<string>
  fetchRepoInfo(id: RepoIdentifier): Promise<RawRepoInfo>
  fetchReleases(id: RepoIdentifier): Promise<RawRelease[]>
  listUserRepos(username: string, opts: ListReposOptions): Promise<RepoIdentifier[]>
}

export interface RawRepoInfo {
  stars: number; forks: number; watchers: number
  language?: string; defaultBranch: string; sha: string
}

export interface RawRelease {
  version: string; publishedAt: string; body: string
}
```

**各 Provider 实现要点：**

| Provider | README 端点 | Auth Header | 账户导入 | 备注 |
|---------|------------|-------------|---------|------|
| GitHub | `GET /repos/{o}/{r}/readme`（base64）| `Authorization: Bearer {GITHUB_TOKEN}` | `GET /users/{u}/repos?type=owner` | SHA 从 `/repos/{o}/{r}` 的 `pushed_at`+`default_branch` 获取 |
| Gitee | `GET /repos/{o}/{r}/readme` | `access_token={GITEE_TOKEN}` query param | `GET /users/{u}/repos` | base URL: `https://gitee.com/api/v5` |
| Codeup | `GET /api/v4/projects/{encoded}/repository/files/README.md?ref=HEAD` | `Authorization: Bearer {CODEUP_TOKEN}` | `GET /api/v4/groups/{org}/projects` | project path: `{org}%2F{repo}` URL encoded |
| Gitea | `GET /repos/{o}/{r}/contents/README.md` | `Authorization: token {GITEA_TOKEN}` | `GET /repos/search?owner={u}` | base URL: 用户配置 `GITEA_URL` |

**Provider 工厂：**

```typescript
// src/build/providers/index.ts
export function createProvider(id: RepoIdentifier): RepoProvider {
  switch (id.platform) {
    case 'github':  return new GitHubProvider(process.env.GITHUB_TOKEN)
    case 'gitee':   return new GiteeProvider(process.env.GITEE_TOKEN)
    case 'codeup':  return new CodeupProvider(process.env.CODEUP_TOKEN)
    case 'gitea':   return new GiteaProvider(process.env.GITEA_TOKEN, id.baseUrl)
  }
}
```

---

## 5. Extractor 架构

```typescript
// src/build/extractor/index.ts

export interface Extractor {
  extract(readme: string, repoInfo: RawRepoInfo): Promise<ExtractedData>
}

// LLMExtractor: 调用 OpenAI 兼容 API
// HeuristicExtractor: 正则/markdown 解析降级
// 运行时根据环境变量自动选择：
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

**LLMExtractor prompt：**
```
Extract structured information from this GitHub README.
Return valid JSON matching exactly this schema:
{
  "title": string,           // project name, 1 line
  "description": string,     // what it does and why it matters, 2-3 sentences
  "techStack": string[],     // technologies used, e.g. ["React", "TypeScript"]
  "features": string[],      // key features, 3-5 bullet points
  "heroImage": string | null // first meaningful image URL, or null
}

README:
{readme_content}
```

**HeuristicExtractor 规则：**
```
title:       第一个 H1（# Title）或仓库名
description: 第一个非标题、非徽章的段落
techStack:   扫描 "Built with" / "Tech Stack" / "Technologies" 节的列表项
             + 扫描常见技术关键词（React/Vue/Go/Python...）
features:    "## Features" / "## What it does" 节的列表项（前5条）
heroImage:   第一张 ![...](url) 图片
```

**AI Profile Summary（`src/build/extractor/profile.ts`）：**
```
Given these projects by a developer, write a 2-3 sentence professional bio
that describes their technical focus, strengths, and what kind of problems
they enjoy solving. Be specific, not generic.

Projects:
{projects.map(p => `- ${p.title}: ${p.description}`).join('\n')}
```

---

## 6. 缓存策略

利用 GitHub Actions cache 在构建间持久化，避免重复调用 LLM（最昂贵操作）。

```
缓存 key:   gallery-v1-{platform}-{owner}-{repo}-{sha}
缓存内容:   ProjectData（完整的结构化数据，含提取结果）
缓存路径:   .cache/projects/{platform}/{owner}/{repo}.json
```

```typescript
// src/build/cache.ts
export class BuildCache {
  private dir = path.join(process.cwd(), '.cache/projects')

  async get(id: RepoIdentifier, sha: string): Promise<ProjectData | null>
  async set(id: RepoIdentifier, sha: string, data: ProjectData): Promise<void>
}
```

**Actions workflow cache 配置：**
```yaml
- uses: actions/cache@v4
  with:
    path: .cache
    key: gallery-v1-${{ hashFiles('gallery.config.yaml') }}-${{ github.run_id }}
    restore-keys: |
      gallery-v1-${{ hashFiles('gallery.config.yaml') }}-
      gallery-v1-
```

当 `gallery.config.yaml` 变化（新增/删除项目）时，cache key 前缀变化，旧缓存仍可 restore 复用未变化的项目数据；各项目按 SHA 精确判断是否需要重新提取。

---

## 7. 前端架构

**入口：** `src/app/main.tsx` import `gallery.json`（vite 构建时静态内联）。

```typescript
// main.tsx
import galleryData from './data/gallery.json'
import type { GalleryData } from '../types'

const data = galleryData as GalleryData
```

**页面结构（`App.tsx`）：**
```tsx
<div data-theme={data.theme} data-page-layout={data.layout.page}
     data-projects-layout={data.layout.projects} data-density={data.layout.density}
     style={{ '--accent-override': data.accent, '--columns': data.layout.columns } as CSSProperties}>
  <main>
    <Profile data={data.profile} />
    {data.resume.sections.map(section => {
      if (section === 'skills')     return <Skills data={data.resume.skills} />
      if (section === 'experience') return <Experience data={data.resume.experience} />
      if (section === 'education')  return <Education data={data.resume.education} />
      if (section === 'projects')   return <Projects data={data.projects} layout={data.layout} />
    })}
  </main>
</div>
```

**ProjectCard 组件结构：**
```
┌─────────────────────────────────┐
│ [WIP] [featured]                │  ← StatusBadge
│ 截图预览（首图 or hero image）   │
│                                 │
│ 标题                            │
│ 描述（2行截断）                  │
│                                 │
│ [React] [TypeScript] [Hono]     │  ← TechStack tags
│                                 │
│ ★ 142  🍴 23  or  v1.2 · 3天前 │  ← StatsBar（按 display.stats）
│                                 │
│ [Demo ↗]  [GitHub →]            │
└─────────────────────────────────┘
```

---

## 8. 布局系统

主题（theme）控制**视觉风格**（颜色、字体、圆角），布局（layout）控制**结构排列**，两者正交、可自由组合。

### 布局配置结构

`layout` 从单一字符串升级为对象，各维度独立配置：

```yaml
layout:
  page: sidebar           # 页面整体结构
  projects: featured-first  # 项目区块排列方式
  columns: 3              # 网格列数（grid/masonry 有效）
  density: comfortable    # 卡片密度
```

### 布局维度说明

**`page`（页面结构）**

| 值 | 效果 | 适合场景 |
|----|------|---------|
| `single-column` | 所有 section 上下堆叠，全宽 | 简洁简历风、移动端友好 |
| `sidebar` | 左侧固定 sidebar（Profile + 简历），右侧滚动项目 | 经典简历布局 |
| `hero` | 顶部大 hero 区（Profile + bio），下方项目网格 | 作品集展示为主 |

```
single-column          sidebar                  hero
┌──────────────┐   ┌────────┬──────────┐   ┌──────────────────┐
│   Profile    │   │Profile │ Projects │   │   Hero / Profile  │
│   Skills     │   │Skills  │  card    │   ├──────────────────┤
│  Experience  │   │Exp.    │  card    │   │ card  card  card │
│   Projects   │   │Edu.    │  card    │   │ card  card  card │
└──────────────┘   └────────┴──────────┘   └──────────────────┘
```

**`projects`（项目区块布局）**

| 值 | 效果 |
|----|------|
| `grid` | 等高等宽网格，`columns` 控制列数 |
| `masonry` | 瀑布流，卡片高度自适应内容 |
| `list` | 全宽行列，左图右文，适合展示截图 |
| `featured-first` | `featured: true` 的项目占满行宽大卡片，其余走网格 |

**`columns`（列数）**

| 值 | 适用场景 |
|----|---------|
| `1` | 极简、内容详细 |
| `2` | 默认，截图展示好看 |
| `3` | 项目多、卡片紧凑 |
| `auto` | 响应式自适应（`auto-fill, minmax(300px, 1fr)`）|

**`density`（卡片密度）**

| 值 | padding | 图片 | features 列表 |
|----|---------|------|--------------|
| `compact` | 小 | 不显示 | 不显示 |
| `comfortable` | 中（默认）| 显示 hero 图 | 显示前 3 条 |
| `spacious` | 大 | 显示截图轮播 | 显示全部 |

### TypeScript 类型更新

```typescript
// src/types/index.ts（替换原 layout 字段）

export interface LayoutConfig {
  page: 'single-column' | 'sidebar' | 'hero'
  projects: 'grid' | 'masonry' | 'list' | 'featured-first'
  columns: 1 | 2 | 3 | 'auto'
  density: 'compact' | 'comfortable' | 'spacious'
}

// GalleryConfig 中：
export interface GalleryConfig {
  // ...
  layout: LayoutConfig
  // ...
}

// 默认值（zod default）：
const defaultLayout: LayoutConfig = {
  page: 'single-column',
  projects: 'grid',
  columns: 'auto',
  density: 'comfortable',
}
```

### 前端实现

布局由 CSS Grid + Tailwind 变量实现，各维度通过 `data-*` 属性注入：

```tsx
// App.tsx
<div
  data-theme={theme}
  data-page-layout={layout.page}
  data-projects-layout={layout.projects}
  data-density={layout.density}
  style={{
    '--accent-override': accent,
    '--columns': layout.columns === 'auto' ? undefined : layout.columns,
  } as CSSProperties}
>
```

```css
/* 项目网格响应式 */
[data-projects-layout="grid"] .projects-grid {
  display: grid;
  grid-template-columns: repeat(
    var(--columns, auto-fill),
    minmax(280px, 1fr)
  );
}

[data-projects-layout="masonry"] .projects-grid {
  columns: var(--columns, 3);
  column-gap: 1.5rem;
}

[data-projects-layout="list"] .projects-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* featured-first: 第一个 featured 项目跨满列 */
[data-projects-layout="featured-first"] .project-card[data-featured="true"]:first-of-type {
  grid-column: 1 / -1;
}

/* density */
[data-density="compact"]     .project-card { --card-padding: 0.75rem; }
[data-density="comfortable"] .project-card { --card-padding: 1.25rem; }
[data-density="spacious"]    .project-card { --card-padding: 2rem; }

/* sidebar 页面布局 */
[data-page-layout="sidebar"] .page-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: start;
}
[data-page-layout="sidebar"] .sidebar { position: sticky; top: 2rem; }
```

### gallery.config.yaml 示例（布局部分）

```yaml
# 极简简历风
layout:
  page: single-column
  projects: list
  columns: 1
  density: comfortable

# 作品集展示风
layout:
  page: hero
  projects: featured-first
  columns: auto
  density: spacious

# 经典开发者简历
layout:
  page: sidebar
  projects: grid
  columns: 2
  density: comfortable
```

## 8b. 主题系统

每套主题是一个 CSS 文件，定义 CSS 变量。TailwindCSS 的 `@theme` 层消费这些变量。

```css
/* themes/terminal.css */
[data-theme="terminal"] {
  --color-bg: #0d1117;
  --color-surface: #161b22;
  --color-border: #30363d;
  --color-text-primary: #e6edf3;
  --color-text-secondary: #7d8590;
  --color-accent: var(--accent-override, #00ff88);
  --font-sans: 'JetBrains Mono', monospace;
  --radius-card: 4px;
}
```

`accent` 配置通过 CSS variable 注入：
```tsx
// ThemeProvider.tsx
<div data-theme={theme} style={{ '--accent-override': accent } as CSSProperties}>
```

---

## 9. CLI 工具（`packages/cli/`）

独立 npm 包，`package.json` 的 `bin` 指向入口。

```json
{ "bin": { "vibe-gallery": "./dist/index.js" } }
```

**`vibe-gallery init`** 使用 `@clack/prompts` 交互式向导：
```
1. 选择导入方式（账户导入 / 手动列表）
2. 输入 GitHub 用户名 or 逐个输入仓库
3. 选择主题（展示 ASCII 预览）
4. 填写 profile 信息
5. 是否配置 LLM（显示支持的提供商）
6. 是否配置定时同步
→ 生成 gallery.config.yaml + .github/workflows/build.yml
```

**`vibe-gallery preview`：**
```
1. 在本地执行构建脚本（读取本地 env 或 .env.local）
2. 启动 vite dev server
3. 打开浏览器 http://localhost:5173
```

---

## 10. GitHub Actions Workflow

```yaml
# .github/workflows/build.yml
name: Build & Deploy Gallery

on:
  push:
    branches: [main]
    paths:
      - 'gallery.config.yaml'   # 仅 config 变化时触发（可选优化）
  schedule:
    - cron: '0 6 * * 1'         # 由 vibe-gallery init 生成，或用户手动填写
  workflow_dispatch:             # 支持手动触发

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Restore project cache
        uses: actions/cache@v4
        with:
          path: .cache
          key: gallery-v1-${{ hashFiles('gallery.config.yaml') }}-${{ github.run_id }}
          restore-keys: |
            gallery-v1-${{ hashFiles('gallery.config.yaml') }}-
            gallery-v1-

      - run: npm ci

      - name: Fetch & extract
        run: npm run build:data
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITEE_TOKEN:  ${{ secrets.GITEE_TOKEN }}
          GITEA_TOKEN:  ${{ secrets.GITEA_TOKEN }}
          GITEA_URL:    ${{ secrets.GITEA_URL }}
          CODEUP_TOKEN: ${{ secrets.CODEUP_TOKEN }}
          LLM_BASE_URL: ${{ secrets.LLM_BASE_URL }}
          LLM_API_KEY:  ${{ secrets.LLM_API_KEY }}
          LLM_MODEL:    ${{ secrets.LLM_MODEL }}

      - name: Build site
        run: npm run build:site

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

**`package.json` scripts：**
```json
{
  "scripts": {
    "build:data": "tsx src/build/index.ts",
    "build:site": "vite build",
    "build":      "npm run build:data && npm run build:site",
    "preview":    "vibe-gallery preview",
    "typecheck":  "tsc --noEmit"
  }
}
```

---

## 11. 关键依赖

| 包 | 用途 |
|----|------|
| `zod` | config schema 校验，友好的错误提示 |
| `js-yaml` | 解析 `gallery.config.yaml` |
| `remark` + `remark-gfm` | Markdown AST 解析（启发式提取）|
| `tsx` | 直接运行 TypeScript 构建脚本 |
| `vite` + `@vitejs/plugin-react` | 前端构建 |
| `tailwindcss` v4 | 样式，CSS 变量主题系统 |
| `@clack/prompts` | CLI 交互式向导 |
| `openai` | LLM 调用（OpenAI 兼容 SDK，可指向任意 base URL）|

---

## 12. 图片路径修正

```typescript
// src/build/extractor/image.ts
export function fixImagePaths(
  markdown: string,
  owner: string,
  repo: string,
  branch: string
): string {
  // 相对路径 → raw.githubusercontent.com 绝对路径
  // 匹配: ![alt](./path) 或 ![alt](path)（不以 http 开头）
  return markdown.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
    (_, alt, src) => {
      const cleanSrc = src.replace(/^\.\//, '')
      return `![${alt}](https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleanSrc})`
    }
  )
}
```

---

## 13. 错误处理原则

- Provider 单个仓库抓取失败：记录警告，跳过该仓库，不中断整体构建
- LLM 提取失败（超时/限流/格式错误）：自动降级 HeuristicExtractor，记录警告
- Config 校验失败（zod）：打印具体字段错误，立即退出，不继续构建
- Actions cache 读写失败：降级为无缓存模式，不影响构建正确性
