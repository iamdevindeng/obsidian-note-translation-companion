# Backlog

This file is the repo-side entry point for bugs, small improvements, and feature iterations after the initial PRD.

The public product intent is summarized in `docs/prd-summary.md`.

Use this file for execution-level work. Sync any private planning notes separately only when an item becomes a milestone, release, important product decision, or reusable workflow.

## Status Legend

- `todo`: accepted work not started
- `doing`: active in the current session
- `blocked`: needs outside input or a dependency
- `done`: completed and verified
- `dropped`: intentionally not doing

## Current Release Track

### 1.0.0 Public Release

| ID | Status | Type | Title | Notes |
| --- | --- | --- | --- | --- |
| REL-001 | done | release | Initialize git history and create first reviewable commit | Git initialized on `main`; initial commit created for the completed local implementation and workflow docs. |
| REL-005 | done | release | Align public identity references for release | Updated README release/BRAT/issue/discussion links, `manifest.json` author URL, and `package.json` author to `Devin Deng` / `iamdevindeng`. `npm run build` and `npm test` passed after the change. |
| REL-002 | done | release | Create GitHub repo under `iamdevindeng` | Public repo available at `iamdevindeng/obsidian-note-translation-companion`; local `origin` configured. |
| REL-003 | done | release | Verify README installation steps from a clean vault | Verified manual install from release-layout files in `/tmp/ntc-release-smoke-vault`: Obsidian detected `Note Translation Companion` `1.0.0`, enabled it, opened the smoke note, and listed the main command in the command palette. |
| REL-004 | done | release | Create first GitHub Release | Created `v1.0.0` with exactly `main.js`, `manifest.json`, and `styles.css`; verified the public release and badge resolve to `v1.0.0`. |
| REL-006 | done | release | Sanitize public repository before first push | Removed private workspace paths from public docs, added local secret/tool ignores, expanded hygiene tests, and rewrote local history before first push. |
| REL-007 | done | release | Publish repository publicly | Made `iamdevindeng/obsidian-note-translation-companion` public after build, test, secret scan, clean-vault smoke test, and private release verification passed. |

## Product Iteration Backlog

| ID | Status | Type | Title | Source | Notes |
| --- | --- | --- | --- | --- | --- |
| WF-001 | done | workflow | Add repo-side PRD-aftercare docs | 2026-04-24 vault sync discussion | Backlog, iteration note, ADR, and changelog structure added. |
| PROV-001 | done | feature | Add provider request body extensibility | DeepSeek thinking mode discussion | Added Milestone 6, `extraBody`, and request behavior cache validation. |
| DX-001 | todo | devex | Add a quick release checklist command or doc section | development-rhythm | Keep lightweight unless repetition proves a script is needed. |
| QA-001 | todo | testing | Build a small manual test vault fixture set | PRD acceptance criteria | Keep fixtures out of git if they contain private notes. |

## Intake Rules

- Put every new bug or feature here before asking an AI agent to implement it.
- Keep the title user-visible when possible: describe behavior, not just code modules.
- If an item changes product scope, update the public PRD summary after the decision is stable.
- If an item creates a lasting technical decision, write a short ADR under `docs/adr/`.
- When an item ships, update `CHANGELOG.md` and link the relevant commit or release when available.
