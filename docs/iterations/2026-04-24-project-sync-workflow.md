# 2026-04-24 Project Sync Workflow

## Goal

Make the post-PRD workflow explicit so this repo can keep moving after the initial implementation without losing sync with the personal wiki.

## Context

The first PRD was created in the main Obsidian vault, then implementation moved into this external repo. After the MVP was built locally, the missing process was how to handle bugs, small adjustments, new features, and release work without duplicating every detail back into the vault.

## Decisions

- Use repo Markdown as the task entry point for execution-level work.
- Keep the vault PRD focused on product intent, scope changes, milestones, and releases.
- Add a lightweight backlog, iteration notes, and ADRs instead of starting with GitHub Issues.
- Use `CHANGELOG.md` and git history as the release-facing record.

## Changes Made

- Added `docs/backlog.md` for bugs, improvements, release tasks, and feature intake.
- Added this iteration note as the first concrete example of session-level project memory.
- Added `docs/adr/0001-lightweight-repo-markdown-workflow.md` for the workflow decision.
- Updated repo agent instructions to read the backlog before coding.
- Added an `[Unreleased]` section to `CHANGELOG.md`.

## Verification

- A new agent session should be able to read `AGENTS.md`, `docs/prd-summary.md`, and `docs/backlog.md` to identify the next task.
- The vault should only need milestone/release summaries, not every execution detail.

## Remaining Work

- Git initialized on `main`; first reviewable commit created.
- Push the public repo under `iamdevindeng`.
- Validate install and release instructions from a clean Obsidian vault.
