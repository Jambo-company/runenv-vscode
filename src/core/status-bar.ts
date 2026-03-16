import * as path from 'path'
import * as vscode from 'vscode'
import { getApiUrl, getToken } from '../config'
import { type WorkspaceSurfaceState } from '../workspace-context'
import {
  buildStatusBarTooltipContent,
} from '../workspace-ux'
import { getExtensionState } from './extension-state'

export function createStatusBarTooltip(options: {
  surface: WorkspaceSurfaceState
  secretsLabel: string
  nextStep?: { label: string; description: string; commandId: string } | null
}) {
  const { session } = getExtensionState()
  const nextStep = options.nextStep || options.surface.nextStep
  const markdown = new vscode.MarkdownString(
    buildStatusBarTooltipContent({
      setupSummaryLabel: options.surface.setupSummary.label,
      setupSummaryDetail: options.surface.setupSummary.detail,
      apiUrl: getApiUrl(),
      projectLabel: options.surface.project
        ? `${options.surface.project.project}/${options.surface.project.env}`
        : options.surface.insights.workspaceRoot
          ? path.basename(options.surface.insights.workspaceRoot)
          : 'Not connected',
      secretsLabel: options.secretsLabel,
      nextStepLabel: nextStep.label,
      nextStepDescription: nextStep.description,
      nextStepCommandId: nextStep.commandId,
      presetRecommendation: options.surface.presetRecommendation
        ? {
            title: options.surface.presetRecommendation.targetTitle,
            description: options.surface.presetRecommendation.detail,
          }
        : null,
      issue: session.issue
        ? {
            title: session.issue.title,
            detail: session.issue.detail,
            commandId: session.issue.command?.id || null,
            commandTitle: session.issue.command?.title || null,
          }
        : null,
      loggedIn: Boolean(getToken()),
      setupIncomplete: options.surface.setupIncomplete,
    }),
    true
  )
  markdown.isTrusted = true
  return markdown
}

export function setStatusBarState(options: {
  text: string
  surface: WorkspaceSurfaceState
  secretsLabel: string
  command: string
  nextStep?: { label: string; description: string; commandId: string } | null
  warning?: boolean
}) {
  const { statusBarItem } = getExtensionState()
  statusBarItem.text = options.text
  statusBarItem.tooltip = createStatusBarTooltip({
    surface: options.surface,
    secretsLabel: options.secretsLabel,
    nextStep: options.nextStep,
  })
  statusBarItem.command = options.command
  statusBarItem.backgroundColor = options.warning
    ? new vscode.ThemeColor('statusBarItem.warningBackground')
    : undefined
  statusBarItem.show()
}

export function updateStatusBar() {
  const token = getToken()
  const { getWorkspaceSurfaceState, session } = getExtensionState()
  const surface = getWorkspaceSurfaceState()
  const activeSession = surface.secretsLoaded

  if (!token) {
    setStatusBarState({
      text: '$(key) RunEnv: Not logged in',
      surface,
      secretsLabel: vscode.l10n.t('Not loaded'),
      command: 'runenv.openHome',
    })
    return
  }

  if (session.isLoading) {
    setStatusBarState({
      text: '$(sync~spin) RunEnv: Loading...',
      surface,
      secretsLabel: vscode.l10n.t('Loading...'),
      nextStep: {
        label: vscode.l10n.t('Load Secrets'),
        description: vscode.l10n.t(
          'Fetching the latest secret values from RunEnv.'
        ),
        commandId: 'runenv.loadSecrets',
      },
      command: 'runenv.openHome',
    })
    return
  }

  if (activeSession) {
    setStatusBarState({
      text: `$(pass-filled) RunEnv: ${session.loadedProject}/${session.loadedEnv} (${session.loadedSecretCount})`,
      surface,
      secretsLabel:
        session.loadedSecretCount > 0
          ? vscode.l10n.t('Active ({0})', session.loadedSecretCount)
          : vscode.l10n.t('Active (0 secrets)'),
      command: 'runenv.openHome',
    })
    return
  }

  if (surface.project) {
    setStatusBarState({
      text: `$(circle-slash) RunEnv: ${surface.project.project}/${surface.project.env}`,
      surface,
      secretsLabel: vscode.l10n.t('Not loaded'),
      command: 'runenv.openHome',
    })
    return
  }

  setStatusBarState({
    text: '$(cloud) RunEnv',
    surface,
    secretsLabel: vscode.l10n.t('Not loaded'),
    command: 'runenv.openHome',
  })
}
