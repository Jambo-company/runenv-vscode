import * as vscode from 'vscode'
import {
  getEnvFileGuidance,
  type EnvFileGuidance,
} from './env-file-guidance'
import {
  getEnvFilePreset,
  type EnvFilePresetId,
} from './env-files'
import {
  type WorkspaceInsights,
} from './workspace-insights'
import {
  type PresetRecommendation,
  type RecommendedMenuAction,
  type RecommendedMenuActionInput,
} from './workspace-surface-types'

export function getWorkspaceEnvFileGuidance(
  project?: {
    env: string
    preset?: EnvFilePresetId | null
  } | null,
  insights?: WorkspaceInsights | null
): EnvFileGuidance | null {
  if (!project) {
    return null
  }

  const currentInsights = insights || {
    workspaceRoot: null,
    envFiles: [],
    packageScriptCount: 0,
    hasPackageJson: false,
    hasProjectConfig: false,
    hasFlutterProject: false,
    hasFlutterEnvAsset: false,
  }

  return getEnvFileGuidance({
    environmentName: project.env || 'development',
    envFiles: currentInsights.envFiles.map((file) => file.name),
    configuredPresetId: project.preset || null,
  })
}

export function getPresetRecommendation(
  guidance: EnvFileGuidance | null
): PresetRecommendation | null {
  if (
    !guidance?.recommendedPresetId ||
    guidance.recommendedPresetId === guidance.configuredPresetId
  ) {
    return null
  }

  const recommendedPresetTitle =
    guidance.recommendedPresetTitle ||
    getEnvFilePreset(guidance.recommendedPresetId).title
  const matchSummary =
    guidance.matches.length > 0
      ? guidance.matches.slice(0, 2).join(', ')
      : vscode.l10n.t(
          'Detected local env files align better with {0}',
          recommendedPresetTitle
        )
  const extraCount = Math.max(guidance.matches.length - 2, 0)

  return {
    targetTitle: recommendedPresetTitle,
    detail:
      extraCount > 0
        ? vscode.l10n.t('{0} (+{1} more)', matchSummary, extraCount)
        : matchSummary,
  }
}

export function getRecommendedMenuAction(
  options: RecommendedMenuActionInput
): RecommendedMenuAction {
  if (options.issue?.command) {
    return {
      commandId: options.issue.command.id,
      label: options.issue.command.title,
      description: options.issue.detail,
    }
  }

  if (!options.workspaceRoot) {
    return {
      commandId: 'workbench.action.files.openFolder',
      label: vscode.l10n.t('Open Folder'),
      description: vscode.l10n.t(
        'RunEnv needs a workspace folder before setup can continue.'
      ),
    }
  }

  if (!options.loggedIn) {
    return {
      commandId: 'runenv.login',
      label: vscode.l10n.t('Login'),
      description: vscode.l10n.t(
        'Authenticate before this workspace can connect to RunEnv.'
      ),
    }
  }

  if (!options.projectConfigured) {
    return {
      commandId: 'runenv.init',
      label: vscode.l10n.t('Init Project'),
      description: vscode.l10n.t(
        'Connect this folder to a RunEnv project and environment.'
      ),
    }
  }

  if (!options.sessionLoaded) {
    return {
      commandId: 'runenv.loadSecrets',
      label: vscode.l10n.t('Load Secrets'),
      description: vscode.l10n.t(
        'Inject environment variables into terminals in this window.'
      ),
    }
  }

  if (options.envFileCount > 0) {
    return {
      commandId: 'runenv.importEnv',
      label: vscode.l10n.t('Import .env File'),
      description: vscode.l10n.t('Move existing local env files into RunEnv.'),
    }
  }

  if (options.packageScriptCount > 0) {
    return {
      commandId: 'runenv.run',
      label: vscode.l10n.t('Run Script'),
      description: vscode.l10n.t(
        'Choose a package.json script with secrets already active.'
      ),
    }
  }

  return {
    commandId: 'runenv.openTerminal',
    label: vscode.l10n.t('Open Terminal'),
    description: vscode.l10n.t(
      'Start working with secrets already active in this window.'
    ),
  }
}

export function isWorkspaceSetupIncomplete(options: {
  workspaceRoot: string | null
  loggedIn: boolean
  projectConfigured: boolean
  sessionLoaded: boolean
}) {
  return (
    !options.workspaceRoot ||
    !options.loggedIn ||
    !options.projectConfigured ||
    !options.sessionLoaded
  )
}
