# RunEnv — VS Code Extension

**Inject secrets into all terminals at runtime — zero-disk secret management.**

RunEnv eliminates `.env` files. Secrets are fetched from the server and injected directly into your terminal's environment — they never touch the filesystem.

## Release Readiness

Verified on March 13, 2026.

- Status: pre-publish / release-candidate for `0.1.0`
- Automated validation passed: `npm test` (111 tests), `python3 ../run_vscode_dist.py`, and VSIX internal validation
- Final hardening completed in this pass:
  - disabled persistent env caching so stale secrets do not survive reloads without a valid login/project
  - restored auto-refresh after `Init Project` and `Switch Environment`
  - switched Flutter debug tasks and script wrapping to safer command generation
  - added JSONC parsing for `.vscode/tasks.json` and `.vscode/launch.json`
  - aligned file-writing commands with the workspace that owns `.runenv.json` in multi-root setups
- Remaining before publish: clean-profile install, update-install, and manual smoke verification from [RELEASE_CHECKLIST.md](https://github.com/Jambo-company/runenv/blob/main/runenv-vscode/RELEASE_CHECKLIST.md)

## Features

| Feature                    | Description                                                             |
| -------------------------- | ----------------------------------------------------------------------- |
| **Auto-inject on startup** | Open VS Code → secrets are automatically loaded into every terminal     |
| **Zero-disk**              | Secrets live only in process memory, never written to disk              |
| **Tree View sidebar**      | Browse all secrets (masked) in the RunEnv panel                         |
| **Home view**              | Main workspace surface for status, primary actions, files, and troubleshooting |
| **Setup progress**         | Track login, project connection, secret loading, and import readiness     |
| **Connection status**      | See server, account, project, environment, and active secret state at a glance |
| **Doctor report**          | Open a workspace health report with current issues, env-file guidance, and suggested next steps |
| **Preset guidance**        | Detect when local env files fit a different preset and switch the workspace mapping in one click |
| **Editor actions**         | Open `.env` or `.runenv.json` and trigger import, doctor, preset fixes, or load directly from the editor title |
| **Smoke checklist**        | Open a workspace-specific manual verification checklist before packaging or release |
| **Actionable status bar**  | See setup state, next action, preset fixes, and clickable recovery links from the status bar |
| **Recent actions**         | Review recent RunEnv actions, open their summaries, and re-run them            |
| **Secrets welcome states** | Show native empty-state actions until a folder is connected and loaded    |
| **Step-by-step imports**   | Choose shared vs local import targets with guided native pickers        |
| **Import conflict handling** | Compare existing RunEnv values and choose overwrite vs add-only before importing |
| **Run Script**             | Pick scripts from your `package.json` and run with secrets injected     |
| **Switch Environment**     | Swap between environments in one click                                  |
| **View Secrets**           | Preview masked secret values (read-only)                                |
| **Safe previews**          | Preview imports and generated files before changing anything             |
| **Result summaries**       | See what changed, where it landed, and what to do next after each action |
| **Next action pickers**    | Open a terminal, inspect files, or clean up old `.env` files right away |
| **Auto-refresh**           | Secrets re-fetch every 15 minutes (configurable)                        |
| **Token expiry detection** | Automatic session expiry handling with re-login prompt                  |
| **Loading spinner**        | Visual feedback while secrets are being fetched                         |
| **Shared auth**            | Login once — works across CLI and VS Code (via `~/.runenv/config.json`) |
| **Flutter auto-detect**    | Detects Flutter projects and auto-writes `.env` from loaded secrets     |
| **Generate .env**          | Write cached secrets to `.env` for Flutter / React Native (no API call) |
| **F5 debug setup**         | One-click setup: preLaunchTask writes `.env`, postDebugTask deletes it  |

## How It Works

1. **First time setup** (once per workspace):
   - Open **RunEnv > Home** in the sidebar first
   - Use **RunEnv: Quick Start** only if you want guided setup or recovery
   - Sign in in the browser, then choose the project and environment for this folder
   - Watch **Home > Progress** to see which setup step is done and what comes next

2. **Every time after** (automatic):
   - Open VS Code → secrets auto-load on startup
   - Open any terminal → `npm run dev` just works
   - Debug, tasks, integrated terminal — all have secrets injected

## Tree View Sidebar

The RunEnv panel appears in the activity bar (cloud icon). It includes two native VS Code views:

- **Home** — current status, setup progress, recommended actions, selected advanced actions, detected files, advanced tools
- **Secrets** — read-only secret keys with masked values

Inside these views you can:

- See the **current project**, **environment**, and **sync state**
- See a **step-by-step setup checklist** for login, init, secret loading, and import readiness
- Use **Home** as the main entry point for setup, daily actions, files, and troubleshooting
- Use **Quick Start** only when you want RunEnv to guide setup or recovery
- Use **Workspace Actions** when you want a compact command-palette menu of common actions
- Use **Secrets** only after setup when you want to inspect masked secret values
- Expect **Home > Actions** to show only the current next step, core daily actions, and a few selected advanced tools
- Use **Home > Advanced** for settings, docs, dashboard links, and the full operations toolbox
- See the current **server URL**, **signed-in account**, and whether secrets are actually active
- Detect existing **.env files**, **package scripts**, and the current **.runenv.json**
- Open `.runenv.json` or jump straight into importing a detected `.env` file
- Open `.env` or `.runenv.json` and use the editor title actions for import, doctor, preset fixes, and load
- Use native welcome actions in the **Secrets** view before login, before project setup, and before the first load
- Recover faster with direct actions like **Open Dashboard** and **Open Settings**
- Open **Doctor Report** for a one-page health summary of the current workspace
- See `.runenv.json` validation details and env-file preset guidance inside **Doctor Report**
- Get inline `.runenv.json` diagnostics when project, env, or preset values are invalid
- Apply a recommended env-file preset directly from **Home**, **Doctor Report**, or the **status bar**
- Open **Smoke Test Checklist** before packaging a VSIX or testing a release build
- Use the **status bar tooltip** for quick links to Home, Workspace Actions, Doctor Report, and recovery actions
- Check **Home > Recent** to open the last action summary and re-run it if needed
- Run common actions like **Load Secrets**, **Switch Environment**, **Import .env File**, and **Generate .env File**
- Review import diffs before upload and choose whether changed keys should overwrite existing RunEnv values
- Read a result summary after **Import .env File** and **Generate .env File** before choosing the next action
- Browse **secret keys** with **masked values** (`KEY = abcd••••efgh`)
- Use the **Refresh** button in the title bar to re-fetch from server

## Status Bar

The status bar (bottom-left) shows the current state:

| Icon                          | Meaning                                           |
| ----------------------------- | ------------------------------------------------- |
| ✅ `RunEnv: project/dev (25)` | 25 secrets active in all terminals                |
| ⊘ `RunEnv: project/dev`       | Project found, secrets not loaded — click to load |
| ⚠ `RunEnv: Session expired`   | Token expired — click to re-login                 |
| 🔑 `RunEnv: Not logged in`    | Click to start setup                              |
| 🔄 `RunEnv: Loading...`       | Fetching secrets from server                      |

Click the status bar to open **RunEnv > Home**. Use the tooltip links for **Workspace Actions** and recovery commands.

## Commands

| Command                      | Shortcut      | Description                                        |
| ---------------------------- | ------------- | -------------------------------------------------- |
| `RunEnv: Quick Start`        | —             | Guided setup and recovery flow                     |
| `RunEnv: Open Home`          | —             | Open the main RunEnv sidebar for this workspace    |
| `RunEnv: Login`              | —             | Authenticate via browser                           |
| `RunEnv: Logout`             | —             | Sign out and clear secrets from terminals          |
| `RunEnv: Init Project`       | —             | Pick project + environment, creates `.runenv.json` |
| `RunEnv: Load Secrets`       | `Cmd+Shift+L` | Fetch secrets and inject into all terminals        |
| `RunEnv: Run Script`         | `Cmd+Shift+R` | Pick a `package.json` script to run with secrets   |
| `RunEnv: Open Terminal`      | —             | Open a terminal with secrets already active        |
| `RunEnv: Switch Environment` | —             | Change environment and reload secrets              |
| `RunEnv: View Secrets`       | —             | Show masked secret values                          |
| `RunEnv: Import .env File`   | —             | Import an existing `.env` file into RunEnv         |
| `RunEnv: Generate .env File` | —             | Create a local file for tools that still need one  |
| `RunEnv: Apply Recommended Preset` | —       | Update `.runenv.json` to match detected env files  |
| `RunEnv: Setup Flutter Debug (F5)` | —       | Auto-configure preLaunchTask + postDebugTask       |
| `RunEnv: Open Dashboard`     | —             | Open the current RunEnv server in the browser      |
| `RunEnv: Open Settings`      | —             | Review the RunEnv API URL and extension settings   |
| `RunEnv: Open README`        | —             | Open local extension docs in the editor            |
| `RunEnv: Doctor Report`      | —             | Open a workspace health report                     |
| `RunEnv: Smoke Test Checklist` | —           | Open a workspace-specific manual verification guide |
| `RunEnv: Unload Secrets`     | —             | Clear secrets from all terminals                   |
| `RunEnv: Workspace Actions`  | —             | Compact quick-pick menu for common workspace actions |

### Flutter / React Native Support

For frameworks that need a `.env` file as a bundled asset:

1. **Auto-detect**: If your workspace has `pubspec.yaml` with `.env` in assets, the extension auto-writes `.env` when secrets load.
2. **Manual**: `Cmd+Shift+P` → **RunEnv: Generate .env File** to write secrets from memory.
3. **F5 setup**: `Cmd+Shift+P` → **RunEnv: Setup Flutter Debug (F5)** to create:
   - `preLaunchTask`: writes `.env` before debug starts
   - `postDebugTask`: deletes `.env` after debugging stops

> 🛡️ `.env` is always added to `.gitignore` automatically.

## Localization

All user-facing strings use `vscode.l10n.t()`. The extension ships with translation bundles for English plus 8 translated locales:

| Locale | Language   | File                        |
| ------ | ---------- | --------------------------- |
| `en`   | English    | `bundle.l10n.json` (base)   |
| `ar`   | Arabic     | `bundle.l10n.ar.json`       |
| `bn`   | Bengali    | `bundle.l10n.bn.json`       |
| `es`   | Español    | `bundle.l10n.es.json`       |
| `hi`   | Hindi      | `bundle.l10n.hi.json`       |
| `ja`   | 日本語     | `bundle.l10n.ja.json`       |
| `jv`   | Javanese   | `bundle.l10n.jv.json`       |
| `ko`   | 한국어     | `bundle.l10n.ko.json`       |
| `sw`   | Swahili    | `bundle.l10n.sw.json`       |

VS Code automatically picks the matching bundle based on the user's display language setting. If no matching bundle is found, English is used as the fallback.

## Settings

| Setting                  | Default              | Description                                |
| ------------------------ | -------------------- | ------------------------------------------ |
| `runenv.apiUrl`          | `https://runenv.dev` | RunEnv server URL                          |
| `runenv.refreshInterval` | `15`                 | Secret re-fetch interval in minutes (1–60) |

## Security

- Secrets are injected via VS Code's `EnvironmentVariableCollection` API — **never written to disk**
- Each VS Code window has its own isolated set of secrets (no cross-project leakage)
- Auth tokens expire after 4 hours
- Secrets auto-refresh from the server to stay current
- 401 responses trigger automatic re-login prompt
- Logout clears both token and all injected secrets
- API requests have a 10-second timeout

## Install

```bash
code --install-extension runenv-0.1.0.vsix
```

## Local Development

```bash
python3 ../run_vscode_dev.py
```

Use `--workspace /path/to/project` if you want the Extension Development Host to open a different test folder.

## VSIX Packaging

```bash
python3 ../run_vscode_dist.py
```

This packaging flow now validates the generated VSIX contents automatically, including required commands, views, walkthroughs, and packaged files.

Useful options:

```bash
python3 ../run_vscode_dist.py --dry-run
python3 ../run_vscode_dist.py --skip-tests
python3 ../run_vscode_dist.py --out /tmp/runenv.vsix
```

Use [RELEASE_CHECKLIST.md](https://github.com/Jambo-company/runenv/blob/main/runenv-vscode/RELEASE_CHECKLIST.md) for clean-install, update-install, and final release verification.

## Requirements

- VS Code 1.85+
- A [RunEnv](https://runenv.dev) account with at least one project
