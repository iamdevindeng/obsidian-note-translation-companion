# Development Rhythm

> 本文档记录项目的开发节奏、工作方式和从 0 到 1 的完整链路。
> 每次进入新 milestone 前，先读此文档和 `prd-summary.md`。

---

## 开发者背景

- 从 Java 后端开发转型独立开发，第一次从 0 到 1 做自己的产品
- 第一次使用 Claude Code 进行项目级开发（之前用 Cursor，停留在问答模式）
- 第一次开源自己的项目到 GitHub
- 目标是：通过这个项目学会独立开发全链路（产品 → 代码 → 发布 → 运营）

---

## 为什么做这个项目

做一个 Obsidian 双语阅读翻译插件，核心场景：
- 用户在看一篇英文笔记时，一键生成中文翻译 companion note
- 翻译结果在右侧 pane 并排显示，方便对照阅读
- 有缓存机制，未改动的原文不再重复调用 API

---

## 从 PRD 到产品的完整链路

PRD 只是第一环。完整链路：

```
PRD → 技术方案/架构设计 → 开发（分 Milestone）→ 内部测试 →
文档（README + 使用文档）→ 打包发布 → 开源运营 → 迭代维护
```

### 各阶段产出物

| 阶段 | 产出 |
|------|------|
| PRD | `docs/prd-summary.md`（已有） |
| 技术方案 | Plan Mode 输出的 plan 文件 |
| 开发 | 代码 + 测试用例 `.md` 文件 |
| 测试 | 手动验证（准备各种 edge case 的 markdown 文件） |
| 文档 | `README.md`、`CHANGELOG.md` |
| 发布 | GitHub Release（`main.js` + `manifest.json`） |
| 开源 | 提交到 obsidian-releases（可选） |
| 运营 | 社区帖子、博客文章 |

---

## Milestone 节奏（与 PRD 对齐）

### Milestone 1: Scaffold plugin and settings
- 搭好 Obsidian 插件 TypeScript 骨架
- 实现 settings tab（baseURL, apiKey, model）
- 注册主命令，验证右 pane 打开笔记

### Milestone 2: Implement translation command flow
- 接入 OpenAI-compatible API
- 基础语言检测（英文/中文）
- 翻译结果写入 `_translations/`

### Milestone 3: Add cache and refresh behavior
- source_hash 计算
- 缓存 metadata（`ntc_translation_of`、`ntc_source_hash` 等，写入文末隐藏注释）
- 缓存复用逻辑
- Refresh Translation 命令

### Milestone 4: Protect Markdown structure more carefully
- 保护 YAML frontmatter、code blocks、inline code、math、links 等
- 准备各种测试 markdown 文件验证

### Milestone 5: Polish docs, notices, and release readiness
- 错误提示和 notice 优化
- README、CHANGELOG、LICENSE
- GitHub 仓库 + Release
- 社区发布

### Milestone 6: Provider request extensibility
- 文档化 OpenAI-compatible provider 的 header/body 配置边界
- `extraHeaders` 只用于 HTTP headers
- `extraBody` 用于 provider-specific request body 参数
- 请求行为参数变化时缓存必须失效

---

## PRD 之后的同步节奏

PRD 进入 repo 后，不再把所有开发细节写回主知识库。默认边界：

- `docs/backlog.md`：bug、小优化、新功能、release task 的入口。
- `docs/iterations/`：一轮开发会话或 milestone 的过程摘要。
- `docs/adr/`：重要技术/产品取舍。
- `CHANGELOG.md`：用户可见变化和 release 历史。
- 主知识库 PRD：只同步 milestone、release、重要产品取舍和可复用流程。

每轮开发结束时，先更新 repo 文档和 git history；只有稳定结论再回写 vault。

## Claude Code 使用方式（本项目标准）

### 每个 Milestone 的标准流程

1. **Read** `CLAUDE.md` + `docs/prd-summary.md` + `docs/development-rhythm.md`
2. **确认当前 milestone**（不要跨 milestone 实现）
3. **进入 Plan Mode**（复杂任务必须）
4. **Explore**：启动子 Agent 调研代码、找已有实现
5. **Plan**：设计实现方案，写 plan 文件
6. **审批**：用户确认或调整 plan
7. **执行**：按 plan 写代码
8. **验证**：本地测试（准备测试 markdown 文件）
9. **提交**：用 `/commit` 或 `git commit`
10. **报告**：说明完成内容、假设、剩余缺口

Provider 配置扩展属于对外行为变更。必须先沉淀到 milestone 文档或 ADR，再按文档实现，避免直接把临时 provider 参数写进代码。

### 刻意练习的 Claude Code 能力

| 能力 | 场景 |
|------|------|
| Plan Mode | 每个 milestone 都用 |
| Agent 并行 | 重构时多 Agent 协作 |
| Task 追踪 | 复杂任务拆 Task |
| Loop | 长构建/测试时定时检查 |
| `/commit` | 每次代码提交 |

---

## 开源准备清单

代码层面：
- [ ] `.gitignore`（node_modules, dist 等）
- [ ] `LICENSE`（推荐 MIT）
- [ ] `manifest.json`（Obsidian 插件要求）
- [ ] `package.json`（依赖 + 构建脚本）
- [ ] 构建脚本输出 `main.js`
- [ ] 无硬编码密钥

文档层面：
- [ ] `README.md`（简介、安装、配置、截图）
- [ ] `CHANGELOG.md`
- [ ] 使用说明

发布层面：
- [ ] GitHub 仓库创建
- [ ] Git tag + Release
- [ ] 上传 `main.js` + `manifest.json` + `styles.css`（如有）
- [ ] （可选）提交到 obsidian-releases

---

## 测试策略

Obsidian 插件没有传统单元测试框架，采用**手动验证**：

准备以下测试 markdown 文件放在 `test-notes/` 目录（不提交到 git）：
- 纯英文 prose
- 含 YAML frontmatter
- 含 code blocks（``` 和 inline `）
- 含数学公式 `$...$` 和 `$$...$$`
- 含 Markdown links `[text](url)`
- 含 wiki links `[[note]]`
- 含 tags `#tag`
- 含表格
- 含 callouts
- 中文笔记（验证跳过逻辑）

---

## 技术约束（来自 CLAUDE.md）

- Stack: TypeScript + Obsidian Plugin API
- Provider: OpenAI-compatible only（v1）
- 依赖尽量轻
- MVP 优先用原生 note/leaf 行为，不用 custom view
- 不要覆盖源笔记
- 不要手动粘贴工作流
- 翻译输出在右侧 pane
- 未改动的源笔记复用缓存

---

## 产品不变式

以下规则除非明确变更，否则一直成立：

- 不覆盖当前源笔记
- 不需要手动粘贴工作流
- 翻译输出在右侧 pane
- 未改动的源笔记复用缓存
- Markdown 结构尽量保留
- 不翻译/破坏：YAML frontmatter、code blocks、inline code、math、link URLs、wiki link targets、tags、property keys
