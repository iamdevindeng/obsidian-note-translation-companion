# AGENTS

## Purpose

This repository implements the project summarized in `docs/prd-summary.md`.

This repo is for code, release docs, and implementation workflow. Private planning notes, if any, are outside this public repository and should not be required for normal development.

## Working Rules

1. Read `docs/prd-summary.md` before making changes.
2. Read `docs/backlog.md` for the current execution queue before coding.
3. If a task is still ambiguous, use repo-local docs first and ask for clarification when product intent is not documented.
4. Implement only the current milestone, backlog item, or explicitly requested task.
5. Do not expand scope beyond the PRD without calling it out.
6. Keep the architecture simple and easy to review.
7. Preserve Markdown structure assumptions from the PRD.
8. Prefer incremental, reviewable changes over large refactors.
9. After meaningful work, update `docs/backlog.md`, `CHANGELOG.md`, and an iteration note when useful.

## Product Intent

This is not a generic AI chat plugin.

The product goal is:

- detect whether the current Obsidian note is English-dominant
- if yes, generate a Chinese companion translation note
- open that translation in a right-side pane
- reuse cached translations when the source note has not changed
- skip translation for Chinese notes

## Current Scope

Until changed explicitly, work from these milestones:

1. Scaffold the Obsidian plugin and basic settings.
2. Implement the translation command flow.
3. Add cache and refresh behavior.
4. Protect Markdown structure.
5. Polish docs, errors, and release readiness.

## Constraints

- Target stack: TypeScript + Obsidian Plugin API
- First version should support OpenAI-compatible APIs
- Avoid heavy dependencies unless they clearly reduce risk
- Prefer native note/leaf behavior over custom views for the MVP

## Canonical Files

- Repo execution summary: `docs/prd-summary.md`
- Repo execution queue: `docs/backlog.md`
- Session and milestone notes: `docs/iterations/`
- Lasting decisions: `docs/adr/`

## Recommended Prompt Pattern

Use a prompt like this when starting a task:

```text
Read docs/prd-summary.md and docs/backlog.md first.
Implement only the current milestone, backlog item, or explicitly requested task.
Do not expand scope beyond the PRD.
State important assumptions before coding if something is unclear.
```
