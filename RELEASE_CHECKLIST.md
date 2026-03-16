# RunEnv VS Code Release Checklist

## 1. Automated Verification (CI-ready)

```bash
cd runenv-vscode && npm test
python3 ../run_vscode_dist.py
```

What automated verification covers:

- [ ] `npm test` passes (compile → l10n sync → 111 unit tests)
- [ ] VSIX created (`runenv-vscode/release/runenv-<version>.vsix`)
- [ ] Required files: `dist/extension.js`, `resources/runenv-sidebar.svg`, `l10n/bundle.l10n.*.json`
- [ ] Required commands: `runenv.quickStart`, `runenv.openHome`, `runenv.status`, `runenv.doctor`, `runenv.smokeChecklist`
- [ ] Required views: `runenvHome`, `runenvSecrets`
- [ ] Required walkthrough: `runenv.gettingStarted`
- [ ] Welcome states ≥ 3
- [ ] No duplicate command/view IDs
- [ ] Excluded files not present: `src/`, `test/`, `RELEASE_CHECKLIST.md`, `IMPLEMENTATION_SUMMARY.md`, `check_l10n_sync.js`, `todo.md`
- [ ] l10n key consistency: EN + 8 translated locales stay in sync (currently 425 keys per locale)

## 2. Manual Verification: Clean Install

> **Prerequisites**: The local API server must be running.
> ```bash
> python3 run_dev.py          # run in a separate terminal first
> ```

### 2-1. Clean Profile Installation

```bash
python3 run_vscode_dev.py     # launches Extension Development Host
```

Or install the VSIX manually:

```bash
rm -rf /tmp/runenv-vsix-verify
mkdir -p /tmp/runenv-vsix-verify/{user-data,extensions}
code --install-extension runenv-vscode/release/runenv-0.1.0.vsix \
     --extensions-dir /tmp/runenv-vsix-verify/extensions --force
code --new-window \
     --user-data-dir /tmp/runenv-vsix-verify/user-data \
     --extensions-dir /tmp/runenv-vsix-verify/extensions \
     /path/to/test/workspace
```

Verify:

- [ ] RunEnv icon (cloud) appears in the Activity Bar
- [ ] `Home` and `Secrets` views render correctly
- [ ] Status bar shows `RunEnv: Not logged in`
- [ ] Clicking the status bar opens `Home`
- [ ] Command Palette includes `Quick Start`, `Doctor Report`, `Smoke Test Checklist`

### 2-2. Core Flow (requires server)

- [ ] Run `Quick Start` → browser login → success message
- [ ] `Home > Progress` shows login checkmark
- [ ] `Init Project` → select project/environment → `.runenv.json` created
- [ ] `Load Secrets` → status bar shows `✅ RunEnv: project/env (N)`
- [ ] Open terminal → `echo $SECRET_KEY` confirms secret injection
- [ ] `Doctor Report` reflects current workspace state
- [ ] `Home > Recent` shows last action and is clickable

### 2-3. File Flow (requires server)

- [ ] Import `.env` file → diff preview shows `new / changed / unchanged`
- [ ] Test both `Overwrite Existing Values` and `Only Add Missing Keys`
- [ ] Generate `.env` → `.gitignore` updated automatically
- [ ] Logout / reload after load → stale secrets do not remain active without valid auth/project state
- [ ] Preset recommendation → one-click apply works
- [ ] Open `.env` file → editor title shows import/doctor actions
- [ ] Open `.runenv.json` → editor title actions appear
- [ ] Break `.runenv.json` intentionally → RunEnv diagnostics appear

## 3. Manual Verification: Update Install

- [ ] Install new VSIX over a previous version
- [ ] Existing commands, views, walkthrough, welcome states, and status bar still work
- [ ] No duplicate command/view registration errors
- [ ] F5 debug → same behavior in development mode

## 4. Localization Verification (optional)

- [ ] Switch VS Code display language to Korean → UI labels in Korean
- [ ] Switch VS Code display language to Japanese → UI labels in Japanese
- [ ] Switch VS Code display language to Spanish → UI labels in Spanish
- [ ] Switch VS Code display language to one of `ar`, `bn`, `hi`, `jv`, `sw` → bundle loads without missing-string regressions
- [ ] Use an unsupported language → English fallback

## 5. Release Decision

- [ ] Sections 1–3 all pass
- [ ] Built-in `Smoke Test Checklist` fully checked off
- [ ] Publish **only** after both clean-install and update-install pass
