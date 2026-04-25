# Changelog

## [Unreleased]

### Documentation

- Recorded the `v1.0.0` clean-vault smoke test, GitHub Release verification, and public repository publication in repo-side release docs.

## 1.0.0 (2026-04-22)

### Features

- One-command Chinese translation for English markdown notes
- Automatic language detection (English / Chinese / unknown)
- Smart caching with SHA-256 content hash and plugin metadata stored in a hidden terminal HTML comment
- Refresh command for forced re-translation
- Deterministic Markdown structure protection:
  - YAML frontmatter
  - Fenced code blocks and inline code
  - Math formulas (inline and display)
  - Markdown links and wiki links
  - Tags and Obsidian property keys
- Settings UI for API configuration (baseURL, apiKey, model, temperature, extra headers, extra body)
- 60-second API timeout with clear error messages
- Support for OpenAI-compatible APIs (DeepSeek, OpenAI, OpenRouter, etc.)
- Provider request extensibility with `Extra Body (JSON)` support for OpenAI-compatible body parameters
- Cache validation includes request behavior inputs such as temperature and extra body settings
- Repo-side project workflow docs for post-PRD backlog, iteration notes, and ADRs
- Public repository hygiene before first push, including sanitized repo docs and tracked-file privacy checks
