import * as vscode from 'vscode'

export interface SmokeChecklistInput {
  generatedAt: string
  apiUrl: string
  workspaceRoot: string | null
  loggedIn: boolean
  projectName?: string | null
  envName?: string | null
  presetTitle?: string | null
  secretsLoaded: boolean
  envFiles: string[]
  hasProjectConfig: boolean
  hasPresetRecommendation: boolean
}

export function buildSmokeChecklist(input: SmokeChecklistInput) {
  return [
    `# ${vscode.l10n.t('RunEnv Smoke Test Checklist')}`,
    '',
    vscode.l10n.t('Generated: {0}', input.generatedAt),
    vscode.l10n.t('Server: {0}', input.apiUrl),
    vscode.l10n.t('Workspace: {0}', input.workspaceRoot || vscode.l10n.t('Not open')),
    vscode.l10n.t('Project: {0}', input.projectName || vscode.l10n.t('Not configured')),
    vscode.l10n.t('Environment: {0}', input.envName || vscode.l10n.t('Not configured')),
    vscode.l10n.t('Preset: {0}', input.presetTitle || vscode.l10n.t('Not configured')),
    '',
    `## ${vscode.l10n.t('Preflight')}`,
    vscode.l10n.t('- [ ] Confirm the expected RunEnv server is selected ({0})', input.apiUrl),
    vscode.l10n.t(
      '- [ ] Confirm login state is correct ({0})',
      input.loggedIn ? vscode.l10n.t('logged in') : vscode.l10n.t('not logged in')
    ),
    vscode.l10n.t(
      '- [ ] Confirm .runenv.json state is correct ({0})',
      input.hasProjectConfig ? vscode.l10n.t('present') : vscode.l10n.t('missing')
    ),
    '',
    `## ${vscode.l10n.t('Core Flow')}`,
    `- [ ] ${vscode.l10n.t('Open Home and verify the primary action and status summary match the workspace state')}`,
    `- [ ] ${vscode.l10n.t('Run `RunEnv: Quick Start` and verify it only advances setup or recovery, not the full action menu')}`,
    `- [ ] ${
      input.projectName
        ? vscode.l10n.t('Switch Environment and verify .runenv.json updates plus secrets reload')
        : vscode.l10n.t('Init Project and verify .runenv.json is created with project/env/preset')
    }`,
    `- [ ] ${
      input.secretsLoaded
        ? vscode.l10n.t('Reload secrets and verify terminals/tasks/debug sessions still receive values')
        : vscode.l10n.t('Load Secrets and verify terminals/tasks/debug sessions receive values')
    }`,
    `- [ ] ${vscode.l10n.t('Open Doctor Report and verify connection, workspace files, recent actions, and next-step guidance')}`,
    '',
    `## ${vscode.l10n.t('File Flow')}`,
    ...(input.envFiles.length > 0
      ? [
          vscode.l10n.t(
            '- [ ] Import a detected env file ({0}) and verify preview, conflict handling, and result summary',
            input.envFiles.join(', ')
          ),
        ]
      : [vscode.l10n.t('- [ ] Generate a .env file and verify preview, gitignore handling, and result summary')]),
    `- [ ] ${vscode.l10n.t('Open Recent and re-open the latest action summary')}`,
    input.hasPresetRecommendation
      ? `- [ ] ${vscode.l10n.t('Apply the recommended preset and verify .runenv.json plus Home/Status/Doctor update immediately')}`
      : `- [ ] ${vscode.l10n.t('Verify preset guidance is absent when the workspace files already match the current preset')}`,
    '',
    `## ${vscode.l10n.t('Editor Flow')}`,
    `- [ ] ${vscode.l10n.t('Open a .env file and verify editor title actions appear for Import / Doctor / Preset fix when applicable')}`,
    `- [ ] ${vscode.l10n.t('Open .runenv.json and verify editor title actions appear for Load Secrets / Doctor / Preset fix when applicable')}`,
    `- [ ] ${vscode.l10n.t('Break .runenv.json intentionally and verify RunEnv diagnostics appear in the editor')}`,
    '',
    `## ${vscode.l10n.t('Release Checks')}`,
    `- [ ] ${vscode.l10n.t('Reload the extension host and verify Home / Secrets / status bar still restore correctly')}`,
    `- [ ] ${vscode.l10n.t('Verify walkthrough and welcome states still point to the right commands')}`,
    `- [ ] ${vscode.l10n.t('Package a VSIX and test install/update in a clean VS Code profile before release')}`,
  ].join('\n')
}
