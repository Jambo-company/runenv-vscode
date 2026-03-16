import * as vscode from 'vscode'

export interface DoctorFollowUpAction {
  label: string
  description: string
  commandId: string
}

export interface StatusBarTooltipInput {
  setupSummaryLabel: string
  setupSummaryDetail: string
  apiUrl: string
  projectLabel: string
  secretsLabel: string
  nextStepLabel: string
  nextStepDescription: string
  nextStepCommandId?: string | null
  presetRecommendation?:
    | {
        title: string
        description: string
      }
    | null
  issue?:
    | {
        title: string
        detail: string
        commandId?: string | null
        commandTitle?: string | null
      }
    | null
  loggedIn: boolean
  setupIncomplete?: boolean
}

function commandLink(commandId: string, label: string) {
  return `[${label}](command:${commandId})`
}

export function buildDoctorFollowUpActions(options: {
  presetRecommendation?:
    | {
        title: string
        description: string
      }
    | null
  issue?:
    | {
        detail: string
        commandId?: string | null
        commandTitle?: string | null
      }
    | null
  nextStepLabel: string
  nextStepDescription: string
  nextStepCommandId: string
  loggedIn: boolean
  setupIncomplete?: boolean
}): DoctorFollowUpAction[] {
  const actions: DoctorFollowUpAction[] = []
  const seen = new Set<string>()

  const push = (action: DoctorFollowUpAction | null) => {
    if (!action || seen.has(action.commandId)) {
      return
    }
    seen.add(action.commandId)
    actions.push(action)
  }

  if (options.issue?.commandId && options.issue.commandTitle) {
    push({
      label: vscode.l10n.t('Fix: {0}', options.issue.commandTitle),
      description: options.issue.detail,
      commandId: options.issue.commandId,
    })
  }

  if (options.presetRecommendation) {
    push({
      label: vscode.l10n.t(
        'Switch preset to {0}',
        options.presetRecommendation.title
      ),
      description: options.presetRecommendation.description,
      commandId: 'runenv.applyRecommendedPreset',
    })
  }

  push({
    label: vscode.l10n.t('Next: {0}', options.nextStepLabel),
    description: options.nextStepDescription,
    commandId: options.nextStepCommandId,
  })

  push({
    label: vscode.l10n.t('Open Home'),
    description: vscode.l10n.t('Open the main RunEnv sidebar for this workspace.'),
    commandId: 'runenv.openHome',
  })

  if (options.setupIncomplete) {
    push({
      label: vscode.l10n.t('Quick Start'),
      description: vscode.l10n.t('Guided flow for login, setup, and recovery.'),
      commandId: 'runenv.quickStart',
    })
  }

  push({
    label: vscode.l10n.t('Open Settings'),
    description: vscode.l10n.t('Review the RunEnv API URL and extension settings.'),
    commandId: 'runenv.openSettings',
  })

  if (options.loggedIn) {
    push({
      label: vscode.l10n.t('Open Dashboard'),
      description: vscode.l10n.t('Open the current RunEnv server in your browser.'),
      commandId: 'runenv.openDashboard',
    })
  }

  return actions
}

export function buildStatusBarTooltipContent(input: StatusBarTooltipInput) {
  const lines = [
    '**RunEnv**',
    '',
    `- ${input.setupSummaryLabel}`,
    `- ${input.setupSummaryDetail}`,
    vscode.l10n.t('- Server: {0}', input.apiUrl),
    vscode.l10n.t('- Workspace: {0}', input.projectLabel),
    vscode.l10n.t('- Secrets: {0}', input.secretsLabel),
    vscode.l10n.t('- Next: {0}', input.nextStepLabel),
  ]

  if (input.presetRecommendation) {
    lines.push(
      vscode.l10n.t(
        '- Preset recommendation: {0}',
        input.presetRecommendation.title
      )
    )
  }

  if (input.issue) {
    lines.push(vscode.l10n.t('- Issue: {0}', input.issue.title))
  }

  const links = [
    commandLink('runenv.openHome', vscode.l10n.t('Home')),
    commandLink('runenv.status', vscode.l10n.t('Actions')),
    commandLink('runenv.doctor', vscode.l10n.t('Doctor Report')),
  ]

  if (input.setupIncomplete) {
    links.push(commandLink('runenv.quickStart', vscode.l10n.t('Quick Start')))
  }

  if (input.presetRecommendation) {
    links.push(
      commandLink('runenv.applyRecommendedPreset', vscode.l10n.t('Switch preset'))
    )
  }

  if (input.issue?.commandId && input.issue.commandTitle) {
    links.push(
      commandLink(
        input.issue.commandId,
        vscode.l10n.t('Fix: {0}', input.issue.commandTitle)
      )
    )
  } else if (input.nextStepCommandId) {
    links.push(
      commandLink(
        input.nextStepCommandId,
        vscode.l10n.t('Run: {0}', input.nextStepLabel)
      )
    )
  }

  if (input.loggedIn) {
    links.push(commandLink('runenv.openDashboard', vscode.l10n.t('Dashboard')))
  }

  links.push(commandLink('runenv.openSettings', vscode.l10n.t('Settings')))
  lines.push('', links.join(' · '))

  return lines.join('\n')
}
