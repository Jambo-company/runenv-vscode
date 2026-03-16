import * as vscode from 'vscode'
import { type WorkspaceSurfaceAdvancedAction } from './workspace-context'
import {
  type ConnectionStatus,
  type RecommendedAction,
  type RunenvHomeState,
  HomeItem,
  createCommand,
} from './home-tree-model'

export function getConnectionStatus(state: RunenvHomeState): ConnectionStatus {
  if (!state.workspaceOpen) {
    return {
      label: vscode.l10n.t('Open Folder'),
      description: vscode.l10n.t(
        'RunEnv needs a workspace folder before setup can continue.'
      ),
      command: createCommand(
        'workbench.action.files.openFolder',
        vscode.l10n.t('Open Folder')
      ),
    }
  }

  if (!state.loggedIn) {
    return {
      label: vscode.l10n.t('Login'),
      description: vscode.l10n.t(
        'Authenticate before this workspace can connect to RunEnv.'
      ),
      command: createCommand('runenv.login', vscode.l10n.t('Login')),
    }
  }

  if (!state.project) {
    return {
      label: vscode.l10n.t('Init Project'),
      description: vscode.l10n.t(
        'Connect this folder to a RunEnv project and environment.'
      ),
      command: createCommand('runenv.init', vscode.l10n.t('Init Project')),
    }
  }

  if (!state.secretsLoaded) {
    return {
      label: vscode.l10n.t('Load Secrets'),
      description: vscode.l10n.t(
        'Inject environment variables into terminals in this window.'
      ),
      command: createCommand('runenv.loadSecrets', vscode.l10n.t('Load Secrets')),
    }
  }

  if (state.loadedSecretCount > 0) {
    return {
      label: vscode.l10n.t('Secrets active'),
      description: vscode.l10n.t(
        'Environment variables are active in terminals, tasks, and debug sessions.'
      ),
    }
  }

  return {
    label: vscode.l10n.t('Connected with 0 secrets'),
    description: vscode.l10n.t(
      'This environment is active but no secret values are currently stored.'
    ),
  }
}

export function getRecommendedAction(
  state: RunenvHomeState
): RecommendedAction | null {
  if (state.issue?.command) {
    return {
      label: state.issue.command.title,
      description: state.issue.detail,
      command: createCommand(state.issue.command.id, state.issue.command.title),
    }
  }

  if (!state.workspaceOpen) {
    return {
      label: vscode.l10n.t('Open Folder'),
      description: vscode.l10n.t(
        'RunEnv needs a workspace folder before setup can continue.'
      ),
      command: createCommand(
        'workbench.action.files.openFolder',
        vscode.l10n.t('Open Folder')
      ),
    }
  }

  if (!state.loggedIn) {
    return {
      label: vscode.l10n.t('Login'),
      description: vscode.l10n.t(
        'Authenticate before this workspace can load secrets'
      ),
      command: createCommand('runenv.login', vscode.l10n.t('Login')),
    }
  }

  if (!state.project) {
    return {
      label: vscode.l10n.t('Init Project'),
      description: vscode.l10n.t(
        'Connect this folder to a RunEnv project and environment'
      ),
      command: createCommand('runenv.init', vscode.l10n.t('Init Project')),
    }
  }

  if (!state.secretsLoaded) {
    return {
      label: vscode.l10n.t('Load Secrets'),
      description: vscode.l10n.t(
        'Inject environment variables into terminals in this window'
      ),
      command: createCommand('runenv.loadSecrets', vscode.l10n.t('Load Secrets')),
    }
  }

  if ((state.workspace?.envFiles.length || 0) > 0) {
    return {
      label: vscode.l10n.t('Import .env File'),
      description: vscode.l10n.t(
        'Bring existing local values into RunEnv so they are easier to share and sync'
      ),
      command: createCommand('runenv.importEnv', vscode.l10n.t('Import .env File')),
    }
  }

  if ((state.workspace?.packageScriptCount || 0) > 0) {
    return {
      label: vscode.l10n.t('Run Script'),
      description: vscode.l10n.t(
        'Choose a package.json script and run it with secrets already active'
      ),
      command: createCommand('runenv.run', vscode.l10n.t('Run Script')),
    }
  }

  return {
    label: vscode.l10n.t('Open Terminal'),
    description: vscode.l10n.t(
      'Start working with secrets already active in this window'
    ),
    command: createCommand('runenv.openTerminal', vscode.l10n.t('Open Terminal')),
  }
}

export function getNextAction(state: RunenvHomeState) {
  if (state.nextStep) {
    return {
      label: state.nextStep.label,
      description: state.nextStep.description,
      command: createCommand(state.nextStep.commandId, state.nextStep.label),
    }
  }

  return getRecommendedAction(state)
}

export function isSetupIncomplete(state: RunenvHomeState) {
  return (
    state.setupIncomplete ??
    (!state.workspaceOpen ||
      !state.loggedIn ||
      !state.project ||
      !state.secretsLoaded)
  )
}

function getHighlightedAdvancedActionCommand(
  action: WorkspaceSurfaceAdvancedAction
): vscode.Command {
  switch (action.id) {
    case 'generateDotenv':
      return createCommand('runenv.generateDotenv', action.label)
    case 'setupFlutterDebug':
      return createCommand('runenv.setupFlutterDebug', action.label)
    case 'wrapScripts':
      return createCommand('runenv.wrapScripts', action.label)
    case 'smokeChecklist':
      return createCommand('runenv.smokeChecklist', action.label)
  }
}

export function buildHighlightedAdvancedActionItems(state: RunenvHomeState) {
  return (state.highlightedAdvancedActions || []).map((action) => {
    const command = getHighlightedAdvancedActionCommand(action)
    return new HomeItem(
      action.label,
      action.description,
      vscode.TreeItemCollapsibleState.None,
      command,
      'action',
      undefined,
      action.iconId
    )
  })
}
