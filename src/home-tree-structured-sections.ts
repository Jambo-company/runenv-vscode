import * as vscode from 'vscode'
import { getSetupSteps } from './setup-progress'
import {
  type RunenvHomeState,
  HomeItem,
  createCommand,
  getWorkspaceLabel,
} from './home-tree-model'
import { getConnectionStatus, getNextAction } from './home-tree-state'

export function buildStatusItems(state: RunenvHomeState): HomeItem[] {
  const connectionStatus = getConnectionStatus(state)
  const nextAction = getNextAction(state)
  const projectLabel = state.project
    ? `${state.project.name} / ${state.project.env}`
    : vscode.l10n.t('Not configured')
  const projectDescription = state.project?.presetTitle
    ? vscode.l10n.t('Preset: {0}', state.project.presetTitle)
    : vscode.l10n.t('Connect this folder to a RunEnv project and environment.')
  const lastSyncLabel = state.lastRefreshTime?.toLocaleTimeString() || vscode.l10n.t('just now')
  const secretsDescription = state.secretsLoaded
    ? state.loadedSecretCount > 0
      ? vscode.l10n.t('Active in every terminal. Last sync: {0}', lastSyncLabel)
      : vscode.l10n.t(
          'This environment is active and currently has no secret values.'
        )
    : vscode.l10n.t(
        'Fetch secrets from RunEnv and activate them in this VS Code window.'
      )

  const items: HomeItem[] = [
    new HomeItem(
      vscode.l10n.t('Connection: {0}', connectionStatus.label),
      connectionStatus.description,
      vscode.TreeItemCollapsibleState.None,
      connectionStatus.command,
      'status'
    ),
    new HomeItem(
      state.workspaceOpen
        ? vscode.l10n.t('Workspace: {0}', getWorkspaceLabel(state))
        : vscode.l10n.t('Workspace: {0}', vscode.l10n.t('Not open')),
      state.workspaceOpen
        ? state.workspace?.rootPath ||
            vscode.l10n.t('Open a project folder before using RunEnv.')
        : vscode.l10n.t('Open a folder in VS Code first.'),
      vscode.TreeItemCollapsibleState.None,
      state.workspace?.configPath
        ? createCommand('runenv.openProjectConfig', vscode.l10n.t('Open .runenv.json'))
        : undefined,
      'status'
    ),
    new HomeItem(
      vscode.l10n.t('Project: {0}', projectLabel),
      projectDescription,
      vscode.TreeItemCollapsibleState.None,
      state.project
        ? createCommand('runenv.switchEnv', vscode.l10n.t('Switch Environment'))
        : createCommand('runenv.init', vscode.l10n.t('Init Project')),
      'status'
    ),
    new HomeItem(
      state.secretsLoaded
        ? vscode.l10n.t('Secrets: Active ({0})', state.loadedSecretCount)
        : vscode.l10n.t('Secrets: Not loaded'),
      secretsDescription,
      vscode.TreeItemCollapsibleState.None,
      createCommand('runenv.loadSecrets', vscode.l10n.t('Load Secrets')),
      'status'
    ),
  ]

  if (state.presetRecommendation) {
    items.push(
      new HomeItem(
        vscode.l10n.t(
          'Preset recommendation: {0}',
          state.presetRecommendation.targetTitle
        ),
        state.presetRecommendation.detail,
        vscode.TreeItemCollapsibleState.None,
        createCommand(
          'runenv.applyRecommendedPreset',
          vscode.l10n.t(
            'Switch preset to {0}',
            state.presetRecommendation.targetTitle
          )
        ),
        'status',
        undefined,
        'sparkle'
      )
    )
  }

  if (nextAction) {
    items.push(
      new HomeItem(
        vscode.l10n.t('Next: {0}', nextAction.label),
        nextAction.description,
        vscode.TreeItemCollapsibleState.None,
        nextAction.command,
        'status'
      )
    )
  }

  return items
}

export function buildProgressItems(state: RunenvHomeState): HomeItem[] {
  const steps = getSetupSteps({
    workspaceOpen: state.workspaceOpen,
    workspaceName: state.workspace?.rootPath || null,
    loggedIn: state.loggedIn,
    email: state.email,
    projectName: state.project?.name,
    envName: state.project?.env,
    secretsLoaded: state.secretsLoaded,
    loadedSecretCount: state.loadedSecretCount,
    envFileCount: state.workspace?.envFiles?.length || 0,
  })

  return steps.map((step, index) => {
    const iconId =
      step.status === 'done'
        ? 'check'
        : step.status === 'current'
          ? 'arrow-right'
          : step.status === 'recommended'
            ? 'sparkle'
            : 'circle-large-outline'

    return new HomeItem(
      `${index + 1}. ${step.title}`,
      step.description,
      vscode.TreeItemCollapsibleState.None,
      step.command
        ? createCommand(step.command.id, step.command.title)
        : undefined,
      'status',
      undefined,
      iconId
    )
  })
}

export function buildRecentItems(state: RunenvHomeState): HomeItem[] {
  return (state.recentActions || []).map((action) => {
    const iconId =
      action.status === 'success'
        ? 'history'
        : action.status === 'error'
          ? 'error'
          : 'info'

    return new HomeItem(
      action.label,
      vscode.l10n.t('{0} · {1}', action.timestamp, action.detail),
      vscode.TreeItemCollapsibleState.None,
      createCommand('runenv.openRecentAction', action.label, [action]),
      'status',
      undefined,
      iconId,
      `${action.timestamp}\n${action.detail}`
    )
  })
}

export function buildFileItems(state: RunenvHomeState): HomeItem[] {
  if (!state.workspaceOpen || !state.workspace) {
    return []
  }

  const items: HomeItem[] = []

  if (state.workspace.configPath) {
    items.push(
      new HomeItem(
        vscode.l10n.t('Open .runenv.json'),
        vscode.l10n.t(
          'Review the stored project, environment, and preset'
        ),
        vscode.TreeItemCollapsibleState.None,
        createCommand('runenv.openProjectConfig', vscode.l10n.t('Open .runenv.json')),
        'action',
        undefined,
        'json',
        state.workspace.configPath
      )
    )
  }

  for (const envFile of state.workspace.envFiles) {
    items.push(
      new HomeItem(
        vscode.l10n.t('Import {0}', envFile.name),
        vscode.l10n.t('Move values from an existing local file into RunEnv'),
        vscode.TreeItemCollapsibleState.None,
        createCommand('runenv.importEnv', vscode.l10n.t('Import .env File'), [
          vscode.Uri.file(envFile.fullPath),
        ]),
        'action',
        undefined,
        'cloud-upload',
        envFile.fullPath
      )
    )
  }

  return items
}

export function buildTroubleshootingItems(state: RunenvHomeState): HomeItem[] {
  if (!state.issue) {
    return []
  }

  return [
    new HomeItem(
      state.issue.title,
      state.issue.detail,
      vscode.TreeItemCollapsibleState.None,
      state.issue.command
        ? createCommand(state.issue.command.id, state.issue.command.title)
        : undefined,
      'warning',
      undefined,
      'warning'
    ),
  ]
}
