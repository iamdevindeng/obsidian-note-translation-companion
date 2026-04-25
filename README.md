[English](README.md) | [简体中文](README.zh-CN.md)

# Note Translation Companion

> Generate a Chinese companion translation for English Obsidian notes, preserve Markdown structure, and reuse cached translations when nothing changed.

<p align="center">
  <a href="https://github.com/iamdevindeng/obsidian-note-translation-companion/releases">
    <img src="https://img.shields.io/github/v/release/iamdevindeng/obsidian-note-translation-companion?include_prereleases" alt="release">
  </a>
  <img src="https://img.shields.io/badge/obsidian-%3E%3D0.15.0-blue" alt="obsidian">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
</p>

## What It Does

Note Translation Companion is an Obsidian plugin for side-by-side bilingual reading.

When you are reading an English Markdown note, run one command and the plugin creates a Simplified Chinese companion note, opens it in the right pane, and keeps the original note untouched.

- No copy-paste translation workflow.
- Markdown structure stays intact, including code, math, links, tags, and Obsidian properties.
- Cached translations are reused when the source note and request behavior have not changed.
- OpenAI-compatible providers are supported, including DeepSeek, OpenAI, OpenRouter, Qwen-compatible endpoints, and custom compatible APIs.

## Why I Built This

I built this from my own Obsidian reading workflow: I wanted to read English notes with a clean Chinese companion pane without breaking the original Markdown or paying for repeated API calls.

This is also one public artifact in my AI-native builder transition: turning a private workflow pain into a small, maintained, reusable tool.

## Features

| Feature | What it does |
| --- | --- |
| One-command translation | Run `Open Chinese Translation In New Pane` from the command palette. |
| Automatic language detection | Chinese-dominant notes are skipped to avoid wasted API calls. |
| Smart cache | SHA-256 source hashing reuses unchanged translations. |
| Force refresh | Run `Refresh Translation For Current Note` to regenerate on demand. |
| Markdown protection | Preserves frontmatter, code, math, links, wiki links, tags, and property keys. |
| Custom provider setup | Use any OpenAI-compatible API with custom model, headers, and request body fields. |
| Timeout handling | Requests stop after 60 seconds with a clear error message. |

## Quick Start

### Manual Install

1. Download `main.js`, `manifest.json`, and `styles.css` from [Releases](https://github.com/iamdevindeng/obsidian-note-translation-companion/releases).
2. Create this folder inside your Obsidian vault:

   ```text
   .obsidian/plugins/note-translation-companion/
   ```

3. Copy the three files into that folder.
4. Restart Obsidian.
5. Open **Settings -> Community plugins** and enable **Note Translation Companion**.

### BRAT Install

If you use [BRAT](https://github.com/TfTHacker/obsidian42-brat), add this repository as a beta plugin:

```text
https://github.com/iamdevindeng/obsidian-note-translation-companion
```

### Community Plugin Status

The plugin is not yet listed in the Obsidian community plugin browser. After listing, you will be able to install it directly by searching for "Note Translation Companion" inside Obsidian.

## Setup

Open **Settings -> Note Translation Companion** and configure your provider:

| Setting | Description | Example |
| --- | --- | --- |
| API Base URL | Provider endpoint | `https://api.deepseek.com/v1` |
| API Key | Your provider API key | `sk-...` |
| Model | Model name | `deepseek-chat` |
| Temperature | Translation randomness | `0.3` |
| Extra Headers (JSON) | Optional HTTP headers | `{"HTTP-Referer":"https://example.com","X-Title":"My Vault"}` |
| Extra Body (JSON) | Optional request body fields | `{"thinking":{"type":"disabled"}}` |

`Extra Headers` is only for HTTP headers, such as OpenRouter attribution headers. `Extra Body` is merged into the `/chat/completions` JSON body for provider-specific options such as DeepSeek thinking mode, `reasoning_effort`, or provider routing.

### Provider Examples

<details>
<summary><b>DeepSeek</b></summary>

- Base URL: `https://api.deepseek.com`
- Model: `deepseek-v4-pro`
- Extra Body (JSON): `{"thinking":{"type":"disabled"}}`

To enable thinking mode:

```json
{"thinking":{"type":"enabled"},"reasoning_effort":"high"}
```

When DeepSeek thinking mode is enabled, the provider may ignore `temperature`. The plugin still includes `temperature` in the cache key so request behavior changes do not accidentally reuse an old translation.

</details>

<details>
<summary><b>OpenAI</b></summary>

- Base URL: `https://api.openai.com/v1`
- Model: `gpt-4o-mini`

</details>

<details>
<summary><b>Qwen / DashScope compatible mode</b></summary>

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

## Usage

1. Open any English Markdown note in Obsidian.
2. Press `Cmd/Ctrl+P` to open the command palette.
3. Run **Open Chinese Translation In New Pane**.
4. The Chinese companion note opens in the right pane.
5. Run the command again later. If the source note has not changed, the cached translation opens immediately.
6. Run **Refresh Translation For Current Note** when you want to force a new translation.

Translation files are stored here:

```text
_translations/<source-relative-path>.zh-Hans.md
```

Example:

```text
source:      notes/ai/agent-design.md
translation: _translations/notes/ai/agent-design.zh-Hans.md
```

## How It Works

```text
current note
    |
    v
language detection
    |
    +-- Chinese-dominant -> skip
    |
    v
cache fingerprint
    |
    +-- unchanged -> open cached translation
    |
    v
OpenAI-compatible API call
    |
    v
_translations/<source-path>.zh-Hans.md
    |
    v
right-side Obsidian pane
```

The cache is invalidated when any of these inputs change:

- source file content
- source file path
- provider base URL
- model
- temperature
- extra request body
- prompt version
- target language

The plugin preserves these Markdown structures during translation:

- YAML frontmatter / Obsidian Properties
- fenced code blocks and inline code
- inline and display math
- Markdown links and wiki links
- tags
- Obsidian property keys

Plugin-owned cache metadata is stored in a hidden terminal HTML comment so the visible Obsidian Properties area remains reserved for the source note's own metadata.

## Troubleshooting

<details>
<summary>Translation is slow.</summary>

Translation speed depends mostly on your API provider. DeepSeek and other providers may respond slowly during peak hours. Local work such as reading files, detecting language, and hashing content is lightweight.

Try a faster provider, a smaller model, or a more stable network connection.

</details>

<details>
<summary>When does the cache expire?</summary>

The cache expires when the source note, source path, provider, model, temperature, extra body, prompt version, or target language changes.

</details>

<details>
<summary>A Chinese note was skipped.</summary>

This is expected. If Chinese text is more than the language-detection threshold, the plugin shows a notice and skips translation.

If the result looks wrong, the note may contain a high ratio of code blocks, English terms, or mixed-language content. Use refresh after adjusting provider settings.

</details>

<details>
<summary>Can it translate into other languages?</summary>

Not yet. The current version focuses on English-to-Simplified-Chinese companion notes. Multi-language support is a future direction.

</details>

<details>
<summary>Is my API key safe?</summary>

The API key is stored in Obsidian's local plugin data file (`data.json`). It is not uploaded to any server owned by this project. The plugin only sends requests from your local Obsidian app to the provider you configure.

</details>

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

Useful repo docs:

- [PRD summary](docs/prd-summary.md)
- [Backlog](docs/backlog.md)
- [Development rhythm](docs/development-rhythm.md)
- [Changelog](CHANGELOG.md)
- [Agent instructions](AGENTS.md)

The implementation is intentionally lightweight: TypeScript, Obsidian Plugin API, native `fetch()`, and no OpenAI SDK dependency.

## Roadmap

- Submit to the Obsidian community plugin directory.
- Add optional commands for opening the source note from a translation and managing translation cache files.
- Improve manual release and smoke-test documentation after the first public release.
- Explore multi-language companion notes after the English-to-Chinese workflow is stable.

## Support

- Found a bug? Open an [Issue](https://github.com/iamdevindeng/obsidian-note-translation-companion/issues).
- Have an idea? Start a [Discussion](https://github.com/iamdevindeng/obsidian-note-translation-companion/discussions).

For now, support happens through GitHub Issues and Discussions.

## Maintainer

Built and maintained by [Devin Deng](https://github.com/iamdevindeng), an AI-native builder working on AI workflow, developer tools, and knowledge tooling.

- GitHub: [@iamdevindeng](https://github.com/iamdevindeng)
- X: [@iamdevindeng](https://x.com/iamdevindeng)

## License

[MIT](LICENSE)
