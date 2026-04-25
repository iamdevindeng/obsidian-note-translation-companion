# 2026-04-25 Release Self-Check

## Scope

Local-only release readiness check for the first public release of `obsidian-note-translation-companion`.

This check did not create a GitHub repo, configure remotes, push commits, create a GitHub Release, or modify plugin code.

## Overall Conclusion

`almost ready`

The plugin passes the required local build and test checks, public README links point to `iamdevindeng/obsidian-note-translation-companion`, and the expected release assets are clear. The remaining issues are release hygiene items that should be reviewed before publishing the first public release.

## Morning Follow-Up

After this self-check, the local release hygiene items were addressed:

- Added `package.json` repository metadata for `iamdevindeng/obsidian-note-translation-companion`.
- Folded the current provider extensibility and request-behavior cache validation notes into the `1.0.0` changelog entry.
- Updated the changelog cache metadata wording to describe hidden terminal HTML comment metadata instead of visible YAML frontmatter metadata.
- Updated the README technical architecture note for `frontmatter.ts` so it describes source property protection and legacy cache metadata migration.

Validation after the follow-up changes:

- `npm run build`: passed.
- `npm test`: passed, 24 tests passing.

## Public Repository Hygiene Follow-Up

Before the first push to GitHub, the public repository content was sanitized:

- Removed private local workspace paths from repo docs.
- Replaced private planning-vault references with repo-local public documentation guidance.
- Added `.env`, `.env.*`, `.claude/`, and `.codex/` to `.gitignore`.
- Expanded the hygiene test to scan all tracked files for local absolute paths, private workspace references, private email identifiers, and secret-shaped tokens.
- Planned local history rewrite before first push so GitHub does not receive earlier private author metadata or earlier doc contents.

## Required Inputs Read

- `README.md`
- `manifest.json`
- `package.json`
- `CHANGELOG.md`
- `versions.json`
- `docs/backlog.md`
- `docs/iterations/`
- `docs/adr/`
- `AGENTS.md`
- `CLAUDE.md`
- `docs/prd-summary.md`

## Required Commands

### `git status --short`

Result: clean before checks.

### `git diff -- README.md manifest.json package.json CHANGELOG.md versions.json`

Result: no diff.

### `npm run build`

Result: passed.

Command output summary:

```text
> obsidian-note-translation-companion@1.0.0 build
> tsc -noEmit -skipLibCheck && node esbuild.config.mjs production
```

### `npm test`

Result: passed.

Command output summary:

```text
tests 24
pass 24
fail 0
duration_ms 52.229
```

### Post-check working tree

`git status --short` remained clean after build and test.

## Checks

### README Links

Pass.

The README release badge, Releases link, BRAT install URL, Issue link, Discussion link, and author link all point to `iamdevindeng/obsidian-note-translation-companion` or `iamdevindeng` as expected.

Key locations:

- Release badge and releases: `README.md` lines 9-10, 58
- BRAT URL: `README.md` line 68
- Issue and Discussions: `README.md` lines 242-243
- Author link: `README.md` line 254

### Manifest

Pass.

Current values:

- `id`: `note-translation-companion`
- `name`: `Note Translation Companion`
- `version`: `1.0.0`
- `author`: `Devin Deng`
- `authorUrl`: `https://github.com/iamdevindeng`

`versions.json` maps `1.0.0` to `0.15.0`, matching `manifest.json` `minAppVersion`.

### Package Metadata

Mostly pass, with one release hygiene issue.

Current values:

- `name`: `obsidian-note-translation-companion`
- `version`: `1.0.0`
- `author`: `Devin Deng`
- `main`: `main.js`
- `scripts`: `dev`, `build`, `test`

Issue: `package.json` does not currently include a `repository` field, even though the README and release path are now public-repo oriented.

### Changelog

Needs release cleanup before publishing.

`CHANGELOG.md` has enough raw content to support a first release, but its current shape is not fully aligned with a first public `1.0.0` release from the current working tree:

- `[Unreleased]` contains user-visible behavior that appears to be part of the current `1.0.0` build: provider `Extra Body` support and request behavior cache validation.
- The `1.0.0` section says cache metadata is stored in frontmatter, while the current README and tests describe terminal hidden-comment metadata.
- Related README note: the Markdown protection section correctly says plugin metadata is written to a hidden terminal comment, but the technical architecture file tree still describes `frontmatter.ts` as cache metadata in YAML frontmatter.

Recommendation: before creating the GitHub Release, either fold the current `[Unreleased]` entries into `1.0.0` or intentionally bump to a new version. For a first public release, folding into `1.0.0` is probably the simpler option if no public `1.0.0` has been published yet.

### Release Assets

Expected release assets are clear:

- `main.js`
- `manifest.json`
- `styles.css`

Notes:

- `main.js` is generated by `npm run build` and ignored by git.
- `manifest.json`, `styles.css`, and `versions.json` are tracked.
- `styles.css` exists and currently contains only a comment, but README manual install instructions include it, so it should be attached if present.

## Must Fix Before Public Release

1. Add or intentionally omit `package.json` `repository` after review. For public release hygiene, adding it is recommended:

```json
"repository": {
  "type": "git",
  "url": "git+https://github.com/iamdevindeng/obsidian-note-translation-companion.git"
}
```

2. Clean up `CHANGELOG.md` so the first published release notes match the current `1.0.0` build. At minimum, resolve the `[Unreleased]` vs `1.0.0` split and the frontmatter-vs-terminal-comment metadata wording.

3. Clean up the README technical architecture note for `frontmatter.ts` so it does not imply current plugin metadata is stored in visible YAML frontmatter.

4. Complete the clean-vault manual install verification from backlog item `REL-003` before calling the release complete.

## Deferrable Issues

- Add a small release checklist command or doc section (`DX-001`) after the first release if the process repeats.
- Build manual test vault fixtures (`QA-001`) later, as long as the clean-vault release smoke test is performed before publishing.
- Consider pinning the `obsidian` dev dependency instead of using `latest` for tighter reproducibility. The current lockfile reduces immediate risk.

## First Release Title Draft

`Note Translation Companion 1.0.0`

## First Release Notes Draft

```markdown
## Note Translation Companion 1.0.0

First public release of Note Translation Companion, an Obsidian plugin for generating Chinese companion translations of English notes.

### Highlights

- Generate a Chinese companion note from the current English note
- Open the translation in a right-side Obsidian pane
- Skip Chinese-dominant notes automatically
- Reuse cached translations when the source note and request behavior have not changed
- Refresh translations on demand
- Preserve Markdown structures such as frontmatter, code, math, links, wiki links, tags, and Obsidian property keys
- Support OpenAI-compatible providers such as DeepSeek, OpenAI, OpenRouter, and compatible custom endpoints
- Configure provider-specific headers and request body fields

### Installation

Download these files from the release assets and place them in `.obsidian/plugins/note-translation-companion/`:

- `main.js`
- `manifest.json`
- `styles.css`

Then restart Obsidian and enable `Note Translation Companion` from Community Plugins.
```

## Minimal Morning Review List

1. Decide whether to add `package.json` `repository`.
2. Clean up `CHANGELOG.md` for the actual first public release version.
3. Fix the README technical architecture wording around metadata storage.
4. Run one clean-vault install smoke test using `main.js`, `manifest.json`, and `styles.css`.
5. Confirm the GitHub repo exists under `iamdevindeng/obsidian-note-translation-companion`.
6. Confirm the release assets are from a fresh `npm run build`.

## External Action Confirmation Gate

If publishing formally, confirm before taking any external action:

1. Create or verify the GitHub repo under `iamdevindeng`.
2. Configure the local remote only after explicit approval.
3. Push the intended branch/tag only after explicit approval.
4. Create the GitHub Release only after explicit approval.
5. Attach exactly the reviewed release assets: `main.js`, `manifest.json`, and `styles.css`.
