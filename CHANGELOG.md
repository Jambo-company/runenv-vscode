# Changelog

## [Unreleased]

### Added

- **Release hardening helpers** — added environment collection, JSONC, and run-command helpers for safer runtime behavior
- **Expanded test coverage** — release hardening tests for env persistence, JSONC parsing, command generation, and multi-root project resolution
- **Bilingual release handoff docs** — release handoff details added to `todo.md`, `IMPLEMENTATION_SUMMARY.md`, and `IMPLEMENTATION_SUMMARY_KO.md`

### Changed

- **Home tree module split** — `home-tree-sections.ts` → 7 smaller modules (model, state, action-items, meta-sections, structured-sections, facade, sections)
- **Workspace module split** — `workspace-context.ts` → 5 modules, `workspace-actions.ts` → 4 modules
- **Data-driven `buildAdvancedItems`** — extracted 8 static action definitions to a declarative array (213→167 lines)
- **Barrel rename** — `home-tree-action-sections.ts` → `home-tree-facade.ts`
- **l10n consistency** — normalized KO/JA translations (Home→홈/ホーム, Quick Start→빠른 시작/クイックスタート)
- **Release docs** — README and implementation summaries now reflect release-candidate status and current validation results
- **Localization coverage** — user-facing docs now reflect English base plus 8 translated locales
- All user-facing strings wrapped with `vscode.l10n.t()`
- Label comparisons switched from text to `commandId` for translation resilience

### Fixed

- **Stale secret persistence** — terminal env values no longer survive reloads without valid auth/project state
- **Refresh scheduling** — auto-refresh resumes after `Init Project` and `Switch Environment`
- **Shell command generation** — Flutter debug setup and wrapped scripts no longer embed project/env names directly into shell command strings
- **JSONC workspace config support** — Flutter debug setup now handles comments and trailing commas in `tasks.json` and `launch.json`
- **Multi-root file targeting** — file-writing commands now target the workspace that owns `.runenv.json`
- Missing `l10n.t()` mock in `home-tree.test.js`
- Files section label assertion updated for l10n-ified label

## [0.1.0] — 2026-03-10

### Features

- **Zero-disk secret injection** — secrets injected via `EnvironmentVariableCollection`, never written to disk
- **Auto-load on startup** — open VS Code, secrets are ready in every terminal
- **Auto-refresh** — secrets re-fetch every 15 minutes (configurable)
- **Tree View sidebar** — browse all secrets (masked) in the RunEnv activity bar panel
- **Run Script** — pick a `package.json` script and run with secrets injected
- **Switch Environment** — swap dev/staging/production in one click
- **View Secrets** — preview masked secret values (read-only)
- **Secret Autocomplete** — `process.env.` shows loaded secret keys as IntelliSense suggestions
- **Missing Secret Diagnostics** — yellow warning on `process.env.TYPO` not found in loaded secrets
- **Import .env file** — migrate existing `.env` files to RunEnv with one command
- **Wrap Scripts (CLI mode)** — add `runenv run` prefix to `package.json` scripts
- **Browser OAuth login** — one-click Google login via browser
- **Init Project** — guided setup to pick project and environment
- **Token expiry detection** — automatic session expiry handling with re-login prompt
- **Loading spinner** — visual feedback while fetching secrets
- **Smart `.runenv.json` watcher** — auto-reload on config changes
- **First-run welcome** — helpful onboarding for new users
- **API timeout** — 10-second timeout with clear error messages
- **Keyboard shortcuts** — `Cmd+Shift+L` (Load Secrets), `Cmd+Shift+R` (Run Script)
