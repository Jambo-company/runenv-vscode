import * as vscode from 'vscode'
import {
  type RunenvHomeState,
  HomeItem,
  createActionItem,
} from './home-tree-model'
import {
  buildHighlightedAdvancedActionItems,
  getNextAction,
  isSetupIncomplete,
} from './home-tree-state'

function pushUniqueAction(
  items: HomeItem[],
  seen: Set<string>,
  item: HomeItem
) {
  const key = `${item.label}:${item.command?.command || ''}`
  if (seen.has(key)) {
    return
  }
  seen.add(key)
  items.push(item)
}

export function buildActionItems(state: RunenvHomeState): HomeItem[] {
  const items: HomeItem[] = []
  const seen = new Set<string>()
  const recommended = getNextAction(state)

  if (state.issue?.command) {
    pushUniqueAction(
      items,
      seen,
      createActionItem(
        vscode.l10n.t('Fix: {0}', state.issue.command.title),
        state.issue.detail,
        state.issue.command.id,
        state.issue.command.title,
        'warning'
      )
    )
  }

  if (state.presetRecommendation) {
    pushUniqueAction(
      items,
      seen,
      createActionItem(
        vscode.l10n.t(
          'Switch preset to {0}',
          state.presetRecommendation.targetTitle
        ),
        state.presetRecommendation.detail,
        'runenv.applyRecommendedPreset',
        vscode.l10n.t(
          'Switch preset to {0}',
          state.presetRecommendation.targetTitle
        ),
        'sparkle'
      )
    )
  }

  if (recommended) {
    pushUniqueAction(
      items,
      seen,
      new HomeItem(
        recommended.label,
        recommended.description,
        vscode.TreeItemCollapsibleState.None,
        recommended.command,
        'action',
        undefined,
        'play-circle'
      )
    )
  }

  if (isSetupIncomplete(state)) {
    pushUniqueAction(
      items,
      seen,
      createActionItem(
        vscode.l10n.t('Quick Start'),
        vscode.l10n.t('Guided flow for login, setup, and recovery.'),
        'runenv.quickStart',
        vscode.l10n.t('Quick Start'),
        'rocket'
      )
    )
  }

  if (state.project && !state.secretsLoaded) {
    pushUniqueAction(
      items,
      seen,
      createActionItem(
        vscode.l10n.t('Load Secrets'),
        vscode.l10n.t(
          'Fetch secrets from RunEnv and activate them in this VS Code window.'
        ),
        'runenv.loadSecrets',
        vscode.l10n.t('Load Secrets'),
        'cloud-download'
      )
    )
  }

  if ((state.workspace?.envFiles.length || 0) > 0) {
    pushUniqueAction(
      items,
      seen,
      createActionItem(
        vscode.l10n.t('Import .env File'),
        vscode.l10n.t(
          '{0} detected local env file{1}',
          state.workspace?.envFiles.length || 0,
          state.workspace?.envFiles.length === 1 ? '' : 's'
        ),
        'runenv.importEnv',
        vscode.l10n.t('Import .env File'),
        'cloud-upload'
      )
    )
  }

  if (state.secretsLoaded && (state.workspace?.packageScriptCount || 0) > 0) {
    pushUniqueAction(
      items,
      seen,
      createActionItem(
        vscode.l10n.t('Run Script'),
        vscode.l10n.t('Choose a script from package.json'),
        'runenv.run',
        vscode.l10n.t('Run Script'),
        'play'
      )
    )
  }

  if (state.secretsLoaded) {
    pushUniqueAction(
      items,
      seen,
      createActionItem(
        vscode.l10n.t('Open Terminal'),
        vscode.l10n.t('Use your secrets right away'),
        'runenv.openTerminal',
        vscode.l10n.t('Open Terminal'),
        'terminal'
      )
    )
    pushUniqueAction(
      items,
      seen,
      createActionItem(
        vscode.l10n.t('View Secrets'),
        vscode.l10n.t('Show masked secret values'),
        'runenv.viewSecrets',
        vscode.l10n.t('View Secrets'),
        'list-unordered'
      )
    )
  }

  if (state.project) {
    pushUniqueAction(
      items,
      seen,
      createActionItem(
        vscode.l10n.t('Switch Environment'),
        vscode.l10n.t('Switch this folder to another environment'),
        'runenv.switchEnv',
        vscode.l10n.t('Switch Environment'),
        'arrow-swap'
      )
    )
  }

  for (const advancedAction of buildHighlightedAdvancedActionItems(state)) {
    pushUniqueAction(items, seen, advancedAction)
  }

  pushUniqueAction(
    items,
    seen,
    createActionItem(
      vscode.l10n.t('Doctor Report'),
      vscode.l10n.t('Open a workspace health report'),
      'runenv.doctor',
      vscode.l10n.t('Doctor Report'),
      'pulse'
    )
  )

  return items
}
