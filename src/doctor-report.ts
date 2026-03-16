import * as vscode from 'vscode'

export interface DoctorReportInput {
  generatedAt: string
  apiUrl: string
  workspaceRoot: string | null
  configPresent: boolean
  loggedIn: boolean
  email?: string | null
  projectName?: string | null
  envName?: string | null
  presetTitle?: string | null
  secretsLoaded: boolean
  loadedSecretCount: number
  lastRefreshTime?: string | null
  setupSummaryLabel: string
  setupSummaryDetail: string
  envFiles: string[]
  packageScriptCount: number
  configDiagnostics?: string[]
  envGuidance?: string[]
  presetRecommendation?:
    | {
        title: string
        detail: string
      }
    | null
  issue?:
    | {
        title: string
        detail: string
        actionTitle?: string | null
      }
    | null
  recentActions?: Array<{
    label: string
    detail: string
    timestamp: string
    status: 'success' | 'error' | 'info'
  }>
  nextStepLabel: string
  nextStepDescription: string
}

function formatList(items: string[], emptyMessage: string) {
  if (items.length === 0) {
    return `- ${emptyMessage}`
  }

  return items.map((item) => `- ${item}`).join('\n')
}

export function buildDoctorReport(input: DoctorReportInput) {
  const recentActions =
    input.recentActions && input.recentActions.length > 0
      ? input.recentActions
          .map(
            (action) =>
              `- [${action.timestamp}] ${action.label} (${action.status})${action.detail ? `: ${action.detail}` : ''}`
          )
          .join('\n')
      : `- ${vscode.l10n.t('No recent RunEnv actions recorded for this workspace')}`

  return [
    `# ${vscode.l10n.t('RunEnv Doctor')}`,
    '',
    vscode.l10n.t('Generated: {0}', input.generatedAt),
    '',
    `## ${vscode.l10n.t('Summary')}`,
    `- ${input.setupSummaryLabel}`,
    `- ${input.setupSummaryDetail}`,
    vscode.l10n.t('- Next step: {0}', input.nextStepLabel),
    vscode.l10n.t('- Why: {0}', input.nextStepDescription),
    input.issue
      ? vscode.l10n.t(
          '- Current issue: {0}{1}',
          input.issue.title,
          input.issue.actionTitle ? ` (${input.issue.actionTitle})` : ''
        )
      : `- ${vscode.l10n.t('Current issue: None')}`,
    '',
    `## ${vscode.l10n.t('Connection')}`,
    vscode.l10n.t('- Server: {0}', input.apiUrl),
    vscode.l10n.t(
      '- Account: {0}',
      input.loggedIn ? input.email || vscode.l10n.t('Signed in') : vscode.l10n.t('Not logged in')
    ),
    vscode.l10n.t('- Workspace: {0}', input.workspaceRoot || vscode.l10n.t('Not open')),
    vscode.l10n.t('- Project: {0}', input.projectName || vscode.l10n.t('Not configured')),
    vscode.l10n.t('- Environment: {0}', input.envName || vscode.l10n.t('Not configured')),
    vscode.l10n.t('- Preset: {0}', input.presetTitle || vscode.l10n.t('Not configured')),
    input.presetRecommendation
      ? vscode.l10n.t(
          '- Preset recommendation: {0}',
          input.presetRecommendation.title
        )
      : `- ${vscode.l10n.t('Preset recommendation: None')}`,
    input.secretsLoaded
      ? vscode.l10n.t('- Secrets: Active ({0})', input.loadedSecretCount)
      : `- ${vscode.l10n.t('Secrets: Not loaded')}`,
    vscode.l10n.t(
      '- Last sync: {0}',
      input.lastRefreshTime || vscode.l10n.t('Not synced yet')
    ),
    '',
    `## ${vscode.l10n.t('Workspace Files')}`,
    vscode.l10n.t(
      '- .runenv.json: {0}',
      input.configPresent ? vscode.l10n.t('Present') : vscode.l10n.t('Missing')
    ),
    ...(input.configDiagnostics?.length
      ? input.configDiagnostics.map((line) => `- ${line}`)
      : []),
    ...(input.presetRecommendation
      ? [
          vscode.l10n.t(
            '- Recommended preset change: {0}',
            input.presetRecommendation.title
          ),
          vscode.l10n.t('- Why: {0}', input.presetRecommendation.detail),
        ]
      : []),
    vscode.l10n.t('- package.json scripts: {0}', input.packageScriptCount),
    vscode.l10n.t('Local env files'),
    formatList(input.envFiles, vscode.l10n.t('No local env files detected')),
    ...(input.envGuidance?.length
      ? ['', vscode.l10n.t('Env file guidance'), ...input.envGuidance.map((line) => `- ${line}`)]
      : []),
    '',
    `## ${vscode.l10n.t('Recovery')}`,
    input.issue
      ? `- ${input.issue.title}: ${input.issue.detail}`
      : `- ${vscode.l10n.t('No blocking issue is currently recorded')}`,
    `- ${vscode.l10n.t('Use Home as the main workspace surface for status, actions, and troubleshooting')}`,
    `- ${vscode.l10n.t('Use Quick Start only when you want RunEnv to finish setup or recover the workspace for you')}`,
    `- ${vscode.l10n.t('Use Home > Progress to verify the current setup stage')}`,
    '',
    `## ${vscode.l10n.t('Recent Actions')}`,
    recentActions,
  ].join('\n')
}
