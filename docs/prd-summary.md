# PRD Summary

## Public Source

This file is the public execution summary for development inside this repository.

Private planning notes, if any, are outside this public repository. Keep this summary aligned with the behavior and scope that public contributors need to understand.

## Project

- Name: `obsidian-note-translation-companion`
- Type: Obsidian plugin
- Primary problem: existing translation plugins are awkward for side-by-side reading
- Core outcome: one command opens a Chinese companion note for the current English note

## MVP Goal

When the user is viewing an English Obsidian note and runs a command:

1. detect that the note is English-dominant
2. check whether a cached Chinese translation already exists
3. reuse the cached translation if the source has not changed
4. otherwise call an OpenAI-compatible API to generate a translation
5. save the translation as a Markdown companion note
6. open that note in a right-side pane

If the current note is Chinese-dominant, skip translation and show a notice.

## Core Commands

Required for MVP:

- `Open Chinese Translation In New Pane`
- `Refresh Translation For Current Note`

Possible later commands:

- `Open Source Note From Translation`
- `Delete Translation Cache For Current Note`
- `Reveal Translation File In File Explorer`

## Main Product Rules

- Do not overwrite the current source note
- Do not use a manual paste-first translation workflow
- Prefer right-side split pane behavior
- Reuse an already-open translation tab when possible
- Use cache when the source note has not changed

## Storage Model

Default translation output path:

`_translations/<source-relative-path>.zh-Hans.md`

Example:

- source: `notes/ai/agent-design.md`
- translation: `_translations/notes/ai/agent-design.zh-Hans.md`

Each translation note should include plugin-owned cache metadata such as:

- `ntc_translation_of`
- `ntc_source_hash`
- `ntc_source_lang`
- `ntc_target_lang`
- `ntc_provider`
- `ntc_model`
- `ntc_prompt_version`
- `ntc_request_hash`
- `ntc_generated_at`
- `ntc_plugin_version`

Store these plugin-owned fields in a hidden terminal HTML comment so the note's visible Obsidian Properties remain reserved for the source document's own frontmatter.

## Cache Rules

Cache should be considered valid only when these inputs still match:

- source file path
- source content hash
- target language
- provider
- model
- prompt version
- request behavior hash, including `temperature` and `extraBody`

If the source note changes, translation must be regenerated.

## Translation Rules

The plugin must preserve Markdown structure as much as possible.

Do not translate or corrupt:

- YAML frontmatter
- code blocks
- inline code
- math
- Markdown link URLs
- wiki link targets
- tags
- property keys

Translate primarily:

- headings
- prose
- list item text
- callout text
- regular table cell text

## Provider Rules

First version only needs OpenAI-compatible APIs.

Config should at least support:

- `baseURL`
- `apiKey`
- `model`
- `temperature`
- `extraHeaders` optional
- `extraBody` optional for provider-specific request-body fields

Target compatibility includes:

- DeepSeek
- OpenAI
- OpenRouter

## Milestones

### Milestone 1

- scaffold Obsidian plugin project
- add settings for `baseURL`, `apiKey`, `model`
- register the main command
- prove right-pane note opening works

### Milestone 2

- add OpenAI-compatible translation calls
- add basic language detection
- translate English notes into `_translations/`

### Milestone 3

- add `source_hash`
- write cache metadata
- reuse cache
- add refresh command

### Milestone 4

- protect Markdown structures more carefully
- test notes with code, links, tables, and formulas

### Milestone 5

- improve errors and notices
- write README
- prepare for open-source release

### Milestone 6

- document provider request extensibility
- distinguish extra HTTP headers from extra request body fields
- support provider-specific OpenAI-compatible body parameters such as DeepSeek thinking mode
- include request behavior inputs in cache validation

## Acceptance Criteria

The MVP is acceptable when:

1. An English note can produce a Chinese companion note in a right-side pane.
2. A Chinese note is skipped with a clear notice.
3. Re-running on an unchanged English note does not trigger another API call.
4. Re-running on a changed English note regenerates the translation.
5. The translation is stored as a normal Markdown file.
6. Code blocks, inline code, and formulas are not broken by translation.
7. OpenAI-compatible providers such as DeepSeek can be configured through settings.

## How To Use This Summary With AI

For most coding tasks, give the agent:

1. this file
2. the current milestone
3. the exact task for this round

Ask for clarification if repo-local docs do not contain enough product detail for a safe implementation decision.
