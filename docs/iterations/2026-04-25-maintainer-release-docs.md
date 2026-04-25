# 2026-04-25 Maintainer Release Docs

## Scope

Document the repeatable maintainer release and manual smoke-test process after the first public `v1.0.0` release.

This was documentation-only work. It did not create a release, change repository visibility, commit files, or add automation.

## Changes

- Added `docs/maintainer-release-checklist.md` for future maintainer release passes.
- Added `docs/manual-test-vault.md` for building a local throwaway Obsidian vault outside the repository.
- Added sanitized fixture notes under `docs/fixtures/manual-test-notes/`.
- Updated README development links, backlog status, and changelog documentation notes.

## Boundaries

- No full Obsidian vault is committed.
- No `.obsidian/` state is committed.
- No provider key, generated translation result, or real note content is committed.
- Release automation remains deferred until the manual process repeats enough times to justify a script.
