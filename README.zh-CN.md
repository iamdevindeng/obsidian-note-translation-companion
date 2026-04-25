[English](README.md) | [简体中文](README.zh-CN.md)

# Note Translation Companion

> Obsidian 双语阅读伴侣插件：一键生成中文翻译对照笔记，保留 Markdown 结构，智能缓存不重复扣费。

<p align="center">
  <a href="https://github.com/iamdevindeng/obsidian-note-translation-companion/releases">
    <img src="https://img.shields.io/github/v/release/iamdevindeng/obsidian-note-translation-companion?include_prereleases" alt="release">
  </a>
  <img src="https://img.shields.io/badge/obsidian-%3E%3D0.15.0-blue" alt="obsidian">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
</p>

## 这是什么

Note Translation Companion 是一个面向 Obsidian 双语阅读的插件。

当你在 Obsidian 里阅读英文 Markdown 笔记时，运行一个命令，插件会生成一份简体中文 companion note，自动在右侧 pane 打开，并且不改动原始笔记。

- 不用手动复制粘贴全文去翻译。
- 保留 Markdown 结构，包括代码、公式、链接、标签和 Obsidian 属性。
- 源笔记和请求配置没变化时，自动复用缓存，不重复调用 API。
- 支持 DeepSeek、OpenAI、OpenRouter、通义千问兼容模式，以及任意 OpenAI-compatible API。

## 为什么做

这个插件来自我自己的 Obsidian 英文阅读痛点：我希望在阅读英文笔记时，有一个干净的中文对照 pane，同时不破坏原文 Markdown，也不因为重复打开同一篇笔记而反复扣 API 费用。

它也是我从个人痛点出发，用 AI 协作把一个小工具做成公开项目的样本。我的公开身份是 `Devin Deng / iamdevindeng`，当前方向是 AI workflow、developer tools 和 knowledge tooling。

## 功能一览

| 功能 | 说明 |
| --- | --- |
| 一键翻译 | 在命令面板运行 `Open Chinese Translation In New Pane`。 |
| 自动语言检测 | 中文占比较高的笔记会自动跳过，避免浪费 API 调用。 |
| 智能缓存 | 基于 SHA-256 内容哈希，源笔记未变化时直接打开已有翻译。 |
| 强制刷新 | 运行 `Refresh Translation For Current Note` 可以手动重新翻译。 |
| Markdown 保护 | 保留 frontmatter、代码块、公式、链接、wiki link、标签和属性键。 |
| 自定义 Provider | 支持自定义模型、headers 和 request body 字段。 |
| 60 秒超时 | API 挂起时自动中断，并给出明确错误提示。 |

## 快速开始

### 手动安装

1. 从 [Releases](https://github.com/iamdevindeng/obsidian-note-translation-companion/releases) 下载 `main.js`、`manifest.json`、`styles.css`。
2. 在你的 Obsidian vault 中创建目录：

   ```text
   .obsidian/plugins/note-translation-companion/
   ```

3. 将三个文件复制进去。
4. 重启 Obsidian。
5. 进入 **设置 -> 社区插件**，开启 **Note Translation Companion**。

### BRAT 安装

如果你使用 [BRAT](https://github.com/TfTHacker/obsidian42-brat)：

```text
https://github.com/iamdevindeng/obsidian-note-translation-companion
```

### 社区插件市场状态

当前还没有上架 Obsidian 社区插件市场。上架后，可以直接在 Obsidian 社区插件浏览器中搜索 "Note Translation Companion" 安装。

## 配置

进入 **设置 -> Note Translation Companion**：

| 设置项 | 说明 | 示例 |
| --- | --- | --- |
| API Base URL | 服务商接口地址 | `https://api.deepseek.com/v1` |
| API Key | 你的 API 密钥 | `sk-...` |
| Model | 模型标识 | `deepseek-chat` |
| Temperature | 翻译随机性，越低越稳定 | `0.3` |
| Extra Headers (JSON) | 可选 provider 额外 HTTP headers | `{"HTTP-Referer":"https://example.com","X-Title":"My Vault"}` |
| Extra Body (JSON) | 可选 provider 请求体参数 | `{"thinking":{"type":"disabled"}}` |

`Extra Headers` 只用于 HTTP headers，例如 OpenRouter 的站点归因。`Extra Body` 会合并到 `/chat/completions` JSON body，用于 DeepSeek thinking、`reasoning_effort` 或 provider routing 等模型行为参数。

### 常用 Provider 配置

<details>
<summary><b>DeepSeek</b></summary>

- Base URL: `https://api.deepseek.com`
- Model: `deepseek-v4-pro`
- Extra Body (JSON): `{"thinking":{"type":"disabled"}}`

如果需要开启思考模式：

```json
{"thinking":{"type":"enabled"},"reasoning_effort":"high"}
```

DeepSeek 思考模式下，服务商可能会忽略 `temperature`。插件仍然会把 `temperature` 纳入缓存 key，避免请求行为变化后误用旧翻译。

</details>

<details>
<summary><b>OpenAI</b></summary>

- Base URL: `https://api.openai.com/v1`
- Model: `gpt-4o-mini`

</details>

<details>
<summary><b>通义千问 / DashScope 兼容模式</b></summary>

- Base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- Model: `qwen-plus`

</details>

<details>
<summary><b>OpenRouter</b></summary>

- Base URL: `https://openrouter.ai/api/v1`
- Model: `deepseek/deepseek-chat`
- Extra Headers (JSON): `{"HTTP-Referer":"https://your-site.example","X-Title":"Note Translation Companion"}`
- Extra Body (JSON): `{"provider":{"allow_fallbacks":true}}`

</details>

## 使用方式

1. 打开任意英文 Markdown 笔记。
2. 按 `Cmd/Ctrl+P` 打开命令面板。
3. 运行 **Open Chinese Translation In New Pane**。
4. 右侧出现中文 companion note，并排阅读。
5. 后续再次运行命令时，如果源笔记没有变化，会直接打开缓存翻译。
6. 如需强制刷新，运行 **Refresh Translation For Current Note**。

翻译文件保存在：

```text
_translations/<原路径>.zh-Hans.md
```

示例：

```text
源笔记:   notes/ai/agent-design.md
翻译文件: _translations/notes/ai/agent-design.zh-Hans.md
```

## 工作原理

```text
当前笔记
    |
    v
语言检测
    |
    +-- 中文占比较高 -> 跳过
    |
    v
缓存指纹
    |
    +-- 未变化 -> 打开缓存翻译
    |
    v
OpenAI-compatible API 请求
    |
    v
_translations/<原路径>.zh-Hans.md
    |
    v
右侧 Obsidian pane
```

以下任一输入变化都会触发重新翻译：

- 源文件内容
- 源文件路径
- Provider Base URL
- 模型名称
- Temperature
- Extra Body 请求体参数
- Prompt 版本
- 目标语言

以下 Markdown 结构会在翻译过程中保留：

- YAML frontmatter / Obsidian Properties
- 代码块和行内代码
- 行内公式和块级公式
- Markdown 链接和 wiki 链接
- 标签
- Obsidian 属性键

插件自己的缓存 metadata 会写入文末隐藏 HTML 注释，不显示在 Obsidian Properties 里。这样顶部 Properties 区域仍然留给源文档自己的属性。

## 常见问题

<details>
<summary>翻译速度很慢？</summary>

翻译速度主要取决于你选择的 API Provider。DeepSeek 或其他服务商在高峰期可能响应较慢。本地处理，例如读取文件、检测语言、计算哈希，开销很小。

可以尝试更快的 provider、更小的模型，或在网络更稳定时使用。

</details>

<details>
<summary>缓存什么时候失效？</summary>

源笔记内容、源路径、provider、模型、temperature、extra body、prompt 版本或目标语言任一变化，都会让缓存失效。

</details>

<details>
<summary>中文笔记被跳过了？</summary>

这是预期行为。如果插件检测到中文占比较高，会显示 notice 并跳过翻译。

如果判断不符合预期，通常是因为笔记里包含大量代码块、英文术语或中英文混合内容。可以调整 provider 配置后手动刷新。

</details>

<details>
<summary>可以翻译到其他语言吗？</summary>

当前版本只专注英译中 companion note。多语言支持是后续方向。

</details>

<details>
<summary>API Key 安全吗？</summary>

API Key 存储在 Obsidian 本地插件数据文件 `data.json` 中。本项目没有自己的服务器，也不会上传你的 API Key。插件只会从你的本地 Obsidian 向你配置的 provider 发起请求。

</details>

## 本地开发

```bash
npm install
npm run dev
npm test
npm run build
```

相关文档：

- [PRD summary](docs/prd-summary.md)
- [Backlog](docs/backlog.md)
- [Development rhythm](docs/development-rhythm.md)
- [Changelog](CHANGELOG.md)
- [Agent instructions](AGENTS.md)

实现上保持轻量：TypeScript、Obsidian Plugin API、原生 `fetch()`，不引入 OpenAI SDK。

## Roadmap

- 提交到 Obsidian 社区插件目录。
- 增加从翻译文件打开源笔记、管理翻译缓存等可选命令。
- 首次公开发布后，补齐更轻量的 release 和 smoke test 文档。
- 英译中流程稳定后，再探索多语言 companion note。

## 反馈与交流

- 有 bug？开 [Issue](https://github.com/iamdevindeng/obsidian-note-translation-companion/issues)。
- 有想法？开 [Discussion](https://github.com/iamdevindeng/obsidian-note-translation-companion/discussions)。

目前这个项目只通过 GitHub Issues 和 Discussions 收集反馈。

## 维护者

由 [Devin Deng](https://github.com/iamdevindeng) 构建和维护。我正在围绕 AI workflow、developer tools 和 knowledge tooling 做公开作品积累。

- GitHub: [@iamdevindeng](https://github.com/iamdevindeng)
- X: [@iamdevindeng](https://x.com/iamdevindeng)

## License

[MIT](LICENSE)
