# CLAUDE

## Read This First

When working in this repository, read files in this order:

1. `CLAUDE.md`
2. `docs/prd-summary.md`
3. `docs/backlog.md`

## Repo Role

This repository is for implementation, release docs, and lightweight project workflow.

Use repo-local docs as the public source of implementation context. Private planning notes, if any, are outside this public repository and should not be required for normal development.

## Product Summary

This project is an Obsidian plugin for bilingual reading, not a generic AI chat tool.

Target behavior:

- detect whether the current note is English-dominant
- if yes, generate a Chinese translation companion note
- open that translation in a right-side pane
- reuse cached translations when the source note has not changed
- skip translation for Chinese notes

## Scope Discipline

- Implement only the current milestone, backlog item, or explicitly requested task.
- Do not add extra features outside the PRD unless asked.
- If something is unclear, state the assumption before coding.
- Prefer small, reviewable changes over broad refactors.

## Technical Constraints

- Stack: TypeScript + Obsidian Plugin API
- Provider support for the first version: OpenAI-compatible APIs only
- Keep dependencies light unless they clearly reduce implementation risk
- Prefer native note and leaf behavior over custom views for the MVP

## Product Invariants

These should remain true unless explicitly changed:

- Do not overwrite the current source note
- Do not require a manual paste-first workflow
- Translation output should open in a right-side pane
- Unchanged source notes should reuse cache
- Markdown structure should be preserved as much as possible

## Markdown Protection Expectations

Do not translate or break:

- YAML frontmatter
- code blocks
- inline code
- math
- Markdown link URLs
- wiki link targets
- tags
- property keys

## Milestone Order

1. Scaffold plugin and settings
2. Implement translation command flow
3. Add cache and refresh behavior
4. Protect Markdown structure more carefully
5. Polish docs, notices, and release readiness

## Recommended Working Pattern

For each task:

1. Read `docs/prd-summary.md` and `docs/backlog.md`
2. Identify the current milestone or backlog item
3. Implement only that slice
4. Verify behavior locally if possible
5. Update `docs/backlog.md`, `CHANGELOG.md`, and an iteration note when useful
6. Report assumptions, completed work, and remaining gaps clearly

## Good Default Prompt

```text
Read CLAUDE.md, docs/prd-summary.md, and docs/backlog.md first.
Implement only the current milestone, backlog item, or explicitly requested task.
Do not expand scope beyond the PRD.
Call out important assumptions before coding if anything is unclear.
```
