# Maintainer Release Checklist

This checklist is for maintainers preparing a GitHub Release. Regular contributors do not need to run the full release flow unless a maintainer explicitly asks for it.

Keep this as a manual checklist until the release process has repeated enough times to justify automation.

## Before Starting

- Confirm the intended release version in `manifest.json`, `package.json`, and `versions.json`.
- Read `CHANGELOG.md` and make sure the release notes match the current build.
- Check `docs/backlog.md` for open release, documentation, or QA items that should block the release.
- Start from a clean working tree or write down every expected local change before continuing.
- Do not place API keys, real vault content, generated translations, `.obsidian/workspace.json`, or `.obsidian/plugins/note-translation-companion/data.json` in the repository.

## Build And Assets

- Run `npm run build`.
- Confirm the release-layout files exist:
  - `main.js`
  - `manifest.json`
  - `styles.css`
- Confirm `manifest.json` contains the intended `id`, `name`, `version`, and `minAppVersion`.
- Confirm `versions.json` maps the release version to the supported Obsidian app version.
- Attach exactly `main.js`, `manifest.json`, and `styles.css` to the GitHub Release unless the release notes explain a deliberate change.

## Automated Checks

- Run `npm test`.
- Run Gitleaks against the repository history:

  ```bash
  gitleaks git .
  ```

- Run TruffleHog against the repository history:

  ```bash
  trufflehog --no-update git file://"$PWD"
  ```

- If you create a temporary release snapshot for review, run secret scans against that snapshot before uploading assets.
- Treat any secret-shaped finding as blocking until it is explained and removed or documented as a false positive.

## Clean-Vault Smoke Test

- Follow `docs/manual-test-vault.md` to create a local throwaway vault outside this repository.
- Install the freshly built `main.js`, `manifest.json`, and `styles.css` into the test vault.
- Start Obsidian with that vault and confirm the plugin appears as `Note Translation Companion`.
- Enable the plugin and confirm the command palette lists `Note Translation Companion: Open Chinese Translation In New Pane`.
- Open a fixture note and confirm the command opens or attempts to open the companion translation in a right-side pane.
- If running a full provider smoke test, use a disposable local provider key and do not record it in any repository file, screenshot, terminal output, or issue.

## GitHub Release

- Create the release tag using the expected version format, for example `v1.0.0`.
- Use a release title that matches the release version.
- Attach only the expected release assets.
- Confirm the release is not a draft when it is intended to be public.
- Confirm the release is not marked as a prerelease unless that is intentional.
- Re-open the public release page and verify the asset list contains exactly the expected files.
- If the repository visibility changed during release preparation, verify the final visibility is intentional.
- Verify README links and badges resolve to the public repository and release page.

## Documentation Closeout

- Update `CHANGELOG.md`.
- Update `docs/backlog.md` for release, QA, or documentation items completed during the release.
- Add or update an iteration note under `docs/iterations/` when the release work produced useful operational knowledge.
- Update README installation, provider, or troubleshooting notes if the release changes user-facing behavior.
- Leave local-only test vaults, generated translation files, and plugin data outside git.
