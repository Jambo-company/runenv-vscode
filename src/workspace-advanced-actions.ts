import * as vscode from 'vscode'
import { type WorkspaceInsights } from './workspace-insights'
import { type WorkspaceSurfaceAdvancedAction } from './workspace-surface-types'

export function getHighlightedAdvancedActions(options: {
  workspaceRoot: string | null
  loggedIn: boolean
  projectConfigured: boolean
  setupIncomplete: boolean
  insights: WorkspaceInsights
}): WorkspaceSurfaceAdvancedAction[] {
  if (!options.workspaceRoot || !options.loggedIn || !options.projectConfigured) {
    return []
  }

  const actions: WorkspaceSurfaceAdvancedAction[] = [
    {
      id: 'generateDotenv',
      label: vscode.l10n.t('Generate .env File'),
      description: vscode.l10n.t(
        'Create a local env file for tools that still need one on disk.'
      ),
      iconId: 'file-code',
    },
  ]

  if (options.insights.hasFlutterProject || options.insights.hasFlutterEnvAsset) {
    actions.push({
      id: 'setupFlutterDebug',
      label: vscode.l10n.t('Setup Flutter Debug (F5)'),
      description: vscode.l10n.t(
        'Prepare launch/tasks for Flutter projects that need `.env` during debug.'
      ),
      iconId: 'debug-alt',
    })
  }

  if (options.insights.hasPackageJson || options.insights.packageScriptCount > 0) {
    actions.push({
      id: 'wrapScripts',
      label: vscode.l10n.t('Wrap Scripts (CLI mode)'),
      description: vscode.l10n.t(
        'Add `runenv run` wrappers to package.json scripts for CLI-first teams.'
      ),
      iconId: 'package',
    })
  }

  if (!options.setupIncomplete) {
    actions.push({
      id: 'smokeChecklist',
      label: vscode.l10n.t('Smoke Test Checklist'),
      description: vscode.l10n.t(
        'Open the manual verification checklist before packaging or release.'
      ),
      iconId: 'checklist',
    })
  }

  return actions
}
