# Manual Test Vault

Use this guide to create a reusable local Obsidian vault for manual testing. The vault is intentionally outside this repository so plugin state, workspace state, API keys, real notes, and generated translations cannot be committed by accident.

## What Is Safe To Commit

The reusable fixtures in `docs/fixtures/manual-test-notes/` are safe to commit because they are synthetic Markdown examples with no private content.

Do not commit any of these local artifacts:

- a complete Obsidian vault
- `.obsidian/workspace.json`
- `.obsidian/plugins/note-translation-companion/data.json`
- real notes from a personal vault
- API keys or provider account identifiers
- generated `_translations/` output from a manual test run

## Create The Vault

Create a local test vault outside the repository. This example uses a generic sandbox path:

```bash
mkdir -p ~/sandbox/ntc-test-vault/.obsidian/plugins/note-translation-companion
```

Build the plugin and copy the release-layout files into the test vault:

```bash
npm run build
cp main.js manifest.json styles.css ~/sandbox/ntc-test-vault/.obsidian/plugins/note-translation-companion/
```

Copy the fixture notes into the root of the test vault:

```bash
cp docs/fixtures/manual-test-notes/*.md ~/sandbox/ntc-test-vault/
```

Open `~/sandbox/ntc-test-vault` in Obsidian, then enable **Note Translation Companion** from **Settings -> Community plugins**.

## Provider Setup

For install-only smoke tests, do not configure a provider. Confirm the plugin loads and the command appears.

For translation smoke tests, configure an OpenAI-compatible provider in **Settings -> Note Translation Companion**. Use a disposable local test key when possible. Do not paste the key into any file in this repository.

## Manual Scenarios

### English Translation

- Open `english-basic.md`.
- Run **Note Translation Companion: Open Chinese Translation In New Pane**.
- Expected result: a companion note is created at `_translations/english-basic.zh-Hans.md` and opens in a right-side pane.
- Confirm `english-basic.md` is unchanged.

### Chinese Skip

- Open `chinese-skip.md`.
- Run **Note Translation Companion: Open Chinese Translation In New Pane**.
- Expected result: the plugin shows a skip notice and does not create a translation file for the note.

### Cache Reuse

- Open `english-basic.md`.
- Run the translation command once and wait for the translation to finish.
- Run the same command again without editing the source note.
- Expected result: the existing companion note opens without regenerating the translation.
- If your provider dashboard exposes request logs, confirm the second run did not make another API call.

### Refresh

- Open `english-basic.md`.
- Run **Note Translation Companion: Refresh Translation For Current Note**.
- Expected result: the companion translation is regenerated even if the source note has not changed.

### Markdown Structure Protection

- Open `markdown-structure.md`.
- Run the translation command.
- Expected result: the visible prose is translated while these structures remain valid:
  - YAML frontmatter keys
  - fenced code blocks
  - inline code
  - inline and display math
  - Markdown link URLs
  - wiki link targets
  - tags
  - table syntax
  - callout markers

### Right-Side Pane Behavior

- Open any English fixture.
- Run the translation command.
- Expected result: the translation opens beside the source note, preferably on the right.
- Run the command again.
- Expected result: the plugin reuses the already-open translation tab when possible.

## Cleanup

When the test vault is no longer useful, delete the local sandbox vault. Do not copy its `.obsidian/` directory, plugin settings, or generated `_translations/` directory back into this repository.
