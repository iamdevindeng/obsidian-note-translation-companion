# ADR 0001: Lightweight Repo Markdown Workflow

## Status

Accepted

## Context

The project started from a PRD in the personal wiki, then moved into an external implementation repo. After the MVP, ongoing work needs a clear home for bugs, small feature changes, release tasks, and implementation decisions.

Putting every detail back into the wiki would pollute the long-term knowledge layer. Starting with GitHub Issues would be useful later, but it is heavier than needed before the first public release.

## Decision

Use lightweight Markdown files inside the repo as the default execution system:

- `docs/backlog.md` for bugs, improvements, release tasks, and feature intake.
- `docs/iterations/` for session or milestone notes.
- `docs/adr/` for lasting technical or product decisions.
- `CHANGELOG.md` for user-visible release history.
- git history for exact implementation facts.

The vault PRD remains the long-term product source of truth for intent, invariants, major scope changes, milestones, and releases.

## Consequences

- Agents can work from repo-local context without re-reading the whole vault.
- The wiki stays clean and strategic instead of becoming a task log.
- Manual sync is still required at milestone and release boundaries.
- If public collaboration increases, backlog items can later migrate to GitHub Issues.
