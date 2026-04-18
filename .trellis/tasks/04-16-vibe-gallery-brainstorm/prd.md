# Vibe Gallery — Developer Portfolio App

## Goal

vibe coding 时代的开发者个人主页生成器——网页版简历 + 项目作品集二合一。开发者 fork 模板仓库、填写 `gallery.config.yaml`，GitHub Actions 自动抓取各项目 README、AI 提取亮点、生成集个人信息/工作经历/技能/项目作品集于一体的静态站点并部署到 GitHub Pages。零数据库、零服务器、零运维。

## Product Model

**静态站点生成器模板**，类比 Hugo/Jekyll 主题，但专为项目作品集设计：

- 用户 fork 模板仓库
- 编辑 `gallery.config.yaml`（项目列表、主题、个人信息）
- 设置 GitHub Secrets（可选 LLM key）
- push → GitHub Actions 自动构建 → 部署到 GitHub Pages
- 作品集 URL：`{username}.github.io/{repo}` 或自定义域名

## Decisions (ADR-lite)

### D5: 多平台仓库支持
**决策**: Provider 抽象层（适配器模式），各平台实现统一接口

```typescript
interface RepoProvider {
  fetchReadme(repo: RepoConfig): Promise<string>
  fetchCommitActivity(repo: RepoConfig): Promise<WeeklyActivity[]>
  fetchReleases(repo: RepoConfig): Promise<Release[]>
  fetchRepoInfo(repo: RepoConfig): Promise<RepoInfo>
}
```

支持平台：
| 平台 | 认证方式 | commit_activity | Releases |
|------|---------|----------------|----------|
| GitHub（公开/私有）| `GITHUB_TOKEN` | 原生 API `/stats/commit_activity` | 原生 |
| Gitee | `GITEE_TOKEN` | 无周统计，自行聚合 `/commits` | 原生 |
| Codeup（阿里云）| `CODEUP_TOKEN` + `CODEUP_ORG_ID` | GitLab 兼容 API | 原生 |
| Gitea（自托管）| `GITEA_TOKEN` + `GITEA_URL` | 自行聚合 `/commits` | 原生 |

无周统计的平台降级策略：抓取最近 90 天 commits，按周聚合为活跃度数据。

Config 示例：
```yaml
projects:
  - github: owner/repo-a
  - github: owner/private-repo        # 使用 GITHUB_TOKEN
  - gitee: owner/repo-b
  - gitea:
      url: https://git.example.com    # 自托管实例地址
      repo: owner/repo-c
  - codeup:
      org: my-org
      repo: owner/repo-d
```

### D1: 部署架构
**决策**: GitHub Actions + 静态站点，不使用 Cloudflare Workers
- 数据本质静态（README 不实时变化），构建期抓取足够
- LLM 提取在构建期执行，结果烘焙进静态文件，无运行时 API 调用
- 私有仓库通过内置 `GITHUB_TOKEN` 天然支持
- LLM key 存 GitHub Secret，开发者最熟悉的方式
- 部署目标灵活：GitHub Pages（默认/免费）、Cloudflare Pages、Vercel

### D2: README 提取方式
**决策**: BYOK LLM（OpenAI 兼容格式）+ 结构化解析降级
- 环境变量配置：`LLM_BASE_URL` + `LLM_API_KEY` + `LLM_MODEL`
- 支持 OpenAI、DeepSeek、本地 Ollama 等任意兼容接口
- 未配置时降级为启发式解析：H1=标题、首段=描述、`## Features` 节=亮点列表
- 构建产物缓存（Actions cache），README 无变化时跳过重复提取

### D3: 主题定制
**决策**: 预设主题 + `gallery.config.yaml` 配置文件驱动
- 4-6 套预设主题：`minimal` | `grid` | `magazine` | `terminal`
- 配置项控制：主题、强调色、布局、个人信息、置顶项目

### D6: 项目数据展示维度（可配置）
**决策**: 全局默认 + 项目级覆盖，三选一

| 选项 | 展示内容 | 适用场景 |
|------|---------|---------|
| `milestones` | 最新 Release 版本号 + 发布日期 + body 摘要 | 有正式发版节奏的项目 |
| `stars` | ★ Stars · 🍴 Forks · 👁 Watches | 有社区影响力的开源项目 |
| `none` | 不展示任何统计数据 | 专注 idea 和实现描述 |

Provider 接口按需调用：`milestones` 时调 `fetchReleases`，`stars` 时调 `fetchRepoInfo`，`none` 时不发额外请求。

### D4: 内容覆盖
**决策**: 支持在 config 中 `override` 字段手动覆盖 AI 提取结果
- 覆盖字段优先级高于 AI 提取，重新构建不会被覆盖
- 用户通过删除 override 字段恢复 AI 版本

### D7: 账户级自动导入
**决策**: 支持两种项目来源模式，可混用

**模式 A：账户自动导入**（零配置起点）
```yaml
import:
  github: weilong          # 自动拉取账户下所有可访问仓库
  exclude:
    - weilong/dotfiles     # 排除不想展示的
  min_stars: 1             # 可选：只导入有 star 的项目
```
- 公开仓库无需 token；配置 `GITHUB_TOKEN` 后自动包含私有仓库
- 未来可扩展支持 `gitee: username` 等其他平台账户导入

**模式 B：手动列表**（精细控制，现有方式）
```yaml
projects:
  - github: owner/repo-a
  - gitee: owner/repo-b
```

两种模式可以混用：`import` 批量导入 + `projects` 追加其他平台或补充配置。

### D8: 项目卡片增强字段
**决策**: config 支持手动补充 README 中通常没有的信息
```yaml
projects:
  - github: owner/repo-a
    demo_url: "https://demo.example.com"
    screenshots:
      - "https://example.com/screenshot1.png"
      - "https://example.com/screenshot2.gif"
    status: wip             # wip | active | archived，默认 active
```
- `wip` 状态：卡片展示"开发中"角标
- `archived` 状态：卡片展示置灰样式或"已归档"角标
- `screenshots` 在卡片中展示轮播或首图预览

### D9: AI 生成开发者整体简介
**决策**: 构建期由 LLM 读取所有项目提取结果，合成 profile summary
- 输入：所有项目的 `{ title, description, techStack[], features[] }`
- 输出：100-200 字的开发者技术画像（擅长方向、技术偏好、项目特点）
- 显示在作品集页面顶部 profile 区域，替代或补充手写 bio
- 未配置 LLM 时跳过，显示 config 中手写的 `bio`
- 用户可在 config 中 `profile.bio_override` 手动覆盖

### D11: 简历内容支持
**决策**: `gallery.config.yaml` 新增 `resume` 块，包含工作经历、教育背景、技能

页面结构：
```
┌─────────────────────────────┐
│  Profile（头像 + bio + 社交）│
├─────────────────────────────┤
│  Skills（技能标签云/分类列表）│
├─────────────────────────────┤
│  Experience（工作经历时间线）│
├─────────────────────────────┤
│  Education（教育背景）       │
├─────────────────────────────┤
│  Projects（项目作品集）      │
└─────────────────────────────┘
```

各 section 可在 config 中控制显示/隐藏及排列顺序。

### D10: CLI 工具
**决策**: 发布 `vibe-gallery` npm 包，提供两个核心命令
- `npx vibe-gallery init`：交互式引导生成 `gallery.config.yaml`，询问平台/账户/主题等
- `npx vibe-gallery preview`：本地构建 + 启动开发服务器，实时预览作品集效果

## gallery.config.yaml 示例

```yaml
profile:
  name: "Weilong"
  bio: "Full-stack developer building in the vibe coding era"
  # bio_override: "手动覆盖 AI 生成的简介"
  avatar: github
  links:
    github: "https://github.com/weilong"
    x: "https://x.com/weilong"
    weibo: "https://weibo.com/weilong"
    email: "weilong@example.com"
    website: "https://weilong.dev"
    linkedin: "https://linkedin.com/in/weilong"
    # 任意 key 均可，未内置图标的显示通用链接图标

theme: terminal
accent: "#00ff88"
layout: grid              # grid | masonry | list

display:
  stats: stars            # 全局默认：stars | milestones | none

# 简历内容
resume:
  sections: [skills, experience, education, projects]  # 控制顺序和显隐

  skills:
    - category: "Languages"
      items: ["TypeScript", "Go", "Python"]
    - category: "Frameworks"
      items: ["React", "Hono", "FastAPI"]

  experience:
    - company: "Alibaba"
      title: "Senior Engineer"
      period: "2022.03 - present"
      location: "Hangzhou"
      highlights:
        - "主导 XX 系统从单体迁移到微服务，QPS 提升 3x"
        - "带领 5 人团队交付 XX 项目"
    - company: "Startup Inc."
      title: "Full-stack Engineer"
      period: "2019.06 - 2022.02"

  education:
    - school: "Tsinghua University"
      degree: "B.S. Computer Science"
      period: "2015 - 2019"

# 模式 A：账户级自动导入（零配置起点）
import:
  github: weilong
  exclude:
    - weilong/dotfiles
  min_stars: 0

# 模式 B：手动补充（其他平台 or 覆盖特定项目配置）
projects:
  - gitee: owner/repo-b
  - github: owner/flagship-project
    featured: true
    demo_url: "https://demo.example.com"
    screenshots:
      - "https://example.com/s1.png"
    status: active          # active | wip | archived
    display:
      stats: milestones
    override:
      title: "My Best Project"
      description: "自定义描述"
```

## Tech Stack

| 层级 | 技术 |
|------|------|
| 构建脚本 | Node.js + TypeScript |
| 前端 | Vite + React + TailwindCSS（静态导出） |
| CI/CD | GitHub Actions |
| 部署 | GitHub Pages（默认）|
| LLM | 用户 BYOK，OpenAI 兼容 |
| 缓存 | GitHub Actions cache（跳过未变更 README）|

**不需要**：Cloudflare Workers / KV、Hono、Turso、Drizzle、Better Auth

## Requirements

- 用户 fork 仓库后只需编辑 `gallery.config.yaml` 和设置 Secrets，无需写代码
- 构建脚本读取 config，从 GitHub API 批量抓取 README
- 支持公开仓库（无需 token）和私有仓库（`GITHUB_TOKEN` with repo scope）
- LLM 提取：结构化输出 `{ title, description, techStack[], features[], heroImage? }`
- 未配置 LLM 时自动降级为启发式解析
- `override` 字段优先级高于提取结果
- 静态站点渲染项目卡片，支持 4-6 套主题切换
- 每张卡片链接到对应 GitHub 仓库
- README 内嵌图片路径自动修正为 `raw.githubusercontent.com` 绝对路径
- Actions cache：README 内容 hash 未变则跳过重新提取


### 定时自动同步
- `gallery.config.yaml` 中配置同步策略：
  ```yaml
  sync:
    schedule: "0 6 * * 1"   # cron 表达式，每周一早 6 点重新构建
    on_push: true            # push 到 main 也触发（默认 true）
  ```
- Actions workflow 读取 config 中的 schedule 字段，动态写入 `on.schedule.cron`
- 定时构建时重新抓取所有数据，Actions cache 按 SHA 精确控制哪些项目跳过重提取

## Acceptance Criteria

- [ ] fork 后填写 config + 设置 Secret，push 即可触发构建，无需额外操作
- [ ] 构建成功后 GitHub Pages 上可访问作品集
- [ ] 项目卡片正确展示标题、描述、技术栈标签
- [ ] `override` 字段内容正确覆盖 AI 提取结果
- [ ] 无 LLM 配置时结构化解析至少提取出标题和描述
- [ ] 私有仓库在 `GITHUB_TOKEN` 有权限时正常提取
- [ ] 主题切换（至少 3 套）视觉效果明显不同
- [ ] `sync.schedule` 配置后定时任务按预期触发重新构建

## Definition of Done

- 构建脚本有单元测试（解析、提取、降级逻辑）
- TypeScript 无类型错误，lint 通过
- README 包含 fork → 上线的完整步骤（5 分钟内）
- 至少包含一个 `gallery.config.yaml` 示例文件

## Out of Scope

- SaaS 平台 / 多用户体系
- 管理后台 UI（配置通过文件编辑）
- 自动 webhook 实时同步（push 触发重新构建即可）
- 视频/Demo 嵌入
- 社交功能（点赞、评论）
- 访问统计

## 实施计划

| PR | 内容 | 关键文件 |
|----|------|---------|
| PR1 | 脚手架 + config schema（zod，含所有新字段）| `src/config.ts`, `gallery.config.yaml` |
| PR2 | Provider 抽象 + GitHub Provider（公开/私有 + 账户自动导入）| `src/providers/base.ts`, `src/providers/github.ts` |
| PR3 | Gitee / Codeup / Gitea Provider | `src/providers/gitee.ts`, `gitea.ts`, `codeup.ts` |
| PR4 | 启发式解析 + BYOK LLM 提取 + AI profile summary + override + 图片路径修正 + Actions cache | `src/extractor/` |
| PR5a | Vite + React 前端：简历区块组件（Profile / Skills / Experience / Education）+ 4 套主题 | `src/app/resume/`, `src/themes/` |
| PR5b | 项目作品集区块：项目卡片（demo/screenshots/status 角标）+ 与简历区块组合布局 | `src/app/projects/` |
| PR6 | CLI 工具：`vibe-gallery init` + `vibe-gallery preview` | `packages/cli/` |
| PR7 | 定时同步 workflow + 部署文档 | `.github/workflows/build.yml`, `README.md` |

## Technical Notes

- **GitHub**: `GET /repos/{owner}/{repo}/readme`、`/stats/commit_activity`（202 需重试）、`/releases`
- **Gitee**: `GET /repos/{owner}/{repo}/readme`、无周统计→`/commits?since=90天前`按周聚合、`/releases`；base URL `https://gitee.com/api/v5`
- **Codeup**: GitLab 兼容 API，`GET /api/v4/projects/{encoded_path}/repository/files/README.md`、`/repository/commits`、`/releases`；需 `CODEUP_ORG_ID` 拼接 project path
- **Gitea**: `GET /repos/{owner}/{repo}/raw/README.md`（或 `/contents/README.md`）、`/releases`、`/commits`；base URL 由用户 `GITEA_URL` 配置
- 图片路径修正：相对路径 → `https://raw.githubusercontent.com/{owner}/{repo}/HEAD/{path}`
- LLM structured output：`response_format: json_object`，返回 `{ title, description, techStack[], features[], heroImage? }`
- Release 摘要：LLM 对 `release.body` 提炼 1-2 句话；未配置 LLM 则截取前 200 字符
- Actions cache key：`{owner}/{repo}@{sha}` 精确控制，只有仓库有新提交才重新抓取
- 定时 workflow：`sync.schedule` 字段写入 `on.schedule[0].cron`，需在首次 push 时生成 `.github/workflows/build.yml`
- Vite 静态导出：`base` 配置适配 GitHub Pages 子路径（`/{repo-name}/`）
- `commit_activity` API 注意：统计数据可能有缓存延迟，首次请求 202 时需轮询重试（最多 3 次）
