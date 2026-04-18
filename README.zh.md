# vibe-gallery

[English](./README.md) · [中文](./README.zh.md)

> 属于 Vibe Coding 时代的静态作品集 + 网页简历。Fork、配置、部署，搞定。

## 这是什么？

**vibe-gallery** 是一个开发者作品集，从你的 GitHub 仓库和一个配置文件自动生成。它拉取仓库元数据（Star 数、README、Release 记录）支持 GitHub、Gitee、Codeup、Gitea 等平台，可选接入 LLM 进行智能提取，最终构建成静态站点并通过 GitHub Actions 部署到 GitHub Pages。

零数据库。零服务器。零运行时。推一个 YAML 文件，作品集就上线了。

## 快速开始

### 1. Fork 并开启 Pages

1. **Fork** 本仓库（或点击 "Use this template"）。
2. 在你的 Fork 中，进入 **Settings → Pages → Source: GitHub Actions**。

### 2. 配置

在本地运行交互式向导，或直接编辑 `gallery.config.yaml`：

```bash
npm install
npx vibe-gallery init     # 交互式向导
```

至少需要填写 `profile.name` 和 `import.github`（你的 GitHub 用户名）。

### 3. 配置 Secrets（可选但推荐）

在 Fork 的 **Settings → Secrets and variables → Actions** 中添加：

| Secret         | 是否必须      | 用途                                |
|----------------|---------------|-------------------------------------|
| `GITHUB_TOKEN` | 自动提供      | 拉取 GitHub 仓库数据                |
| `LLM_API_KEY`  | 可选          | AI 智能提取 README                  |
| `LLM_BASE_URL` | 可选          | OpenAI 兼容接口地址                 |
| `LLM_MODEL`    | 可选          | 模型名称（默认：`gpt-4o-mini`）     |
| `GITEE_TOKEN`  | 可选          | Gitee 仓库                          |
| `CODEUP_TOKEN` | 可选          | 阿里云 Codeup 仓库                  |
| `GITEA_TOKEN`  | 可选          | 自托管 Gitea 仓库                   |

### 4. 推送并部署

推送到 `main` 分支 —— GitHub Actions 自动构建并部署。

你的作品集将发布在 `https://<你的用户名>.github.io/vibe-gallery`。

---

## 构建机制

项目提供**两个独立的 Workflow**，分别针对不同类型的改动进行了优化：

### `build-full` — 完整构建（拉取数据 + 部署）

执行 `npm run build:data`：调用 GitHub API、拉取 README、运行 LLM 提取、写入缓存。

**自动触发时机：**
- `src/build/**` 或 `src/types/**` 代码变更
- 每周定时（UTC 周一早 6 点）—— 刷新 Star 数、发现新仓库等
- 在 **Actions → Full Build → Run workflow** 手动触发

**需要手动触发的场景：**
- 首次部署
- 新增了仓库，希望立即展示
- 希望用 LLM 重新提取更新后的 README

### `build-config` — 快速构建（仅配置/样式变更，约 1 分钟）

执行 `npm run build:assemble`：从本地缓存读取项目数据，结合当前配置重新组装 `gallery.json`。不调用任何 API，不走 LLM。

**自动触发时机：**
- `gallery.config.yaml` 变更（主题、布局、个人简介、简历内容）
- 前端源码变更（`src/app/**`）

**适用场景：**
- 更换主题或调整布局
- 修改个人简介、技能、工作经历、教育经历
- 调整颜色、间距、分区顺序
- 任何视觉/样式迭代

> **注意：** `build-config` 依赖 `build-full` 产生的缓存文件。首次使用时，请先手动触发一次 `build-full`。

### 本地开发流程

```bash
npm install
cp .env.example .env           # 填入你的 Token（可选，公开仓库不需要）

# 首次或需要刷新项目数据时：
npm run build:data             # 调用 API + LLM，需要几分钟

# 调整样式/布局/个人简介时（快速）：
npm run build:assemble         # 不到 1 秒，从本地缓存组装

# 启动开发服务器（CSS/组件变更实时热更新）：
npm run dev
```

只有在仓库数据需要更新时才需要重跑 `build:data`。其他所有改动——主题、布局、简历——使用 `build:assemble` 即可，或者直接推送让 `build-config` 自动处理。

---

## 配置参考

所有配置集中在 `gallery.config.yaml`：

```yaml
# ─── 个人信息 ─────────────────────────────────────────────────────────
profile:
  name: "你的名字"
  bio: "全栈开发者，在 Vibe Coding 时代构建产品"
  # bio_override: "手动填写时优先于 AI 生成的简介"
  avatar: github           # 'github' 自动拉取头像，或填直链 URL
  links:
    github: "https://github.com/yourusername"
    x: "https://x.com/yourusername"
    linkedin: "https://linkedin.com/in/yourusername"
    email: "you@example.com"
    website: "https://example.com"

# ─── 语言 ────────────────────────────────────────────────────────────
language: zh               # en | zh —控制 UI 标签语言及 LLM 提取内容的输出语言

# ─── 外观 ────────────────────────────────────────────────────────────
theme: terminal            # minimal | grid | magazine | terminal
accent: "#00ff88"          # 可选，自定义强调色（十六进制）

layout:
  page: sidebar            # single-column | sidebar | hero
  projects: featured-first # grid | masonry | list | featured-first
  columns: 2               # 1 | 2 | 3 | auto
  density: comfortable     # compact | comfortable | spacious

display:
  stats: stars             # stars | milestones | none

# ─── 简历 ────────────────────────────────────────────────────────────
resume:
  sections: [skills, experience, education, projects]
  skills:
    - category: "编程语言"
      items: [TypeScript, Python, Go]
    - category: "前端"
      items: [React, Vite, TailwindCSS]
  experience:
    - company: "某科技公司"
      title: "高级工程师"
      period: "2022 - 至今"
      location: "远程"
      highlights:
        - "构建了服务日活 1000 万的微服务架构"
  education:
    - school: "某大学"
      degree: "计算机科学 学士"
      period: "2018 - 2022"

# ─── 自动导入 GitHub 仓库 ────────────────────────────────────────────
import:
  github: yourusername
  exclude: [yourusername/dotfiles, yourusername/scratch]
  min_stars: 0
  exclude_forks: true      # 跳过 Fork 的仓库（默认：true）

# ─── 手动指定项目（支持多平台）────────────────────────────────────────
projects:
  - github: owner/flagship-project
    featured: true
    demo_url: "https://demo.example.com"
    screenshots:
      - "https://example.com/screenshot1.png"
    status: active          # active | wip | archived（不填则自动推断）
    display:
      stats: milestones
    override:
      title: "我的代表作"              # 覆盖仓库名
      description: "自定义描述"        # 覆盖 LLM 提取的描述
      techStack: [TypeScript, React, PostgreSQL]
      features:
        - "实时协作"
        - "离线优先同步"
      heroImage: "https://example.com/hero.png"

  # Gitee
  - gitee: owner/my-project

  # 阿里云 Codeup
  - codeup:
      org: your-org
      repo: internal-tool

  # 自托管 Gitea
  - gitea:
      url: "https://git.example.com"
      repo: owner/private-tool

# ─── 同步计划 ────────────────────────────────────────────────────────
sync:
  schedule: "0 6 * * 1"   # cron 表达式，控制 build-full 的定时触发
  on_push: true
```

**项目状态自动推断**（未手动设置 `status` 时）：
- 3 个月内有更新 → `active`（活跃）
- 3～12 个月未更新 → `wip`（进行中）
- 超过 12 个月未更新 → `archived`（已归档）

---

## 主题

| 主题       | 风格                          |
|------------|-------------------------------|
| `minimal`  | 简洁，大量留白，文章感         |
| `grid`     | 卡片式，结构化，类 GitHub 风格 |
| `magazine` | 编辑风，粗体排版，衬线字体     |
| `terminal` | 暗色，等宽字体，黑客美学       |

设置 `accent` 为任意十六进制颜色，可自定义链接、高亮和边框颜色。

## 布局系统

布局由四个独立维度组合而成，每个维度各选一个值：

- **`page`** — 整体页面结构
  - `single-column` — 所有内容垂直堆叠
  - `sidebar` — 左侧个人信息/简历，右侧项目列表
  - `hero` — 顶部大图个人简介，下方项目区
- **`projects`** — 项目卡片排列方式
  - `grid` — 等宽网格
  - `masonry` — 瀑布流（高度可变）
  - `list` — 垂直列表
  - `featured-first` — 置顶项目占满整行，其余项目在下方
- **`columns`** — 列数：`1`、`2`、`3` 或 `auto`（响应式）
- **`density`** — 密度：`compact`（紧凑）、`comfortable`（舒适）、`spacious`（宽松）

修改主题和布局只需 `build:assemble` 或推送触发 `build-config`，无需重新拉取数据。

## 支持的平台

- **GitHub** — 公开及私有仓库（通过 `GITHUB_TOKEN`，Actions 中自动提供）
- **Gitee** — 需配置 `GITEE_TOKEN`
- **Codeup / 阿里云效能平台** — 需配置 `CODEUP_TOKEN`
- **Gitea（自托管）** — 需配置 `GITEA_TOKEN`，并在每个项目中指定实例 URL

## AI 智能提取

vibe-gallery 采用 **BYOK**（自带密钥）模式接入 LLM，从 README 中提取技术栈、功能特性和描述。

- 在 Fork 的 Actions Secrets 中设置 `LLM_API_KEY` 和 `LLM_BASE_URL`
- 可选设置 `LLM_MODEL`（默认 `gpt-4o-mini`）
- 兼容所有 OpenAI 格式接口：OpenAI、DeepSeek、SiliconFlow、Moonshot、本地 Ollama 等

未配置 LLM 时，自动降级为启发式解析，作品集仍可正常使用。所有提取结果均可通过 `override:` 字段手动覆盖。

## CLI 工具

```bash
npx vibe-gallery init       # 交互式向导，生成 gallery.config.yaml
npx vibe-gallery preview    # 本地构建 + 预览服务器
```

## License

MIT — Fork 它，改造它，让它成为你的。
