import * as vscode from 'vscode'
import type { RecentAction } from './recent-actions'

export type ImportCompletionAction =
  | 'deleteSource'
  | 'openTerminal'
  | 'viewSecrets'
  | 'openConfig'

export type GenerateCompletionAction =
  | 'openFile'
  | 'openTerminal'
  | 'openConfig'

export type PresetUpdateCompletionAction =
  | 'importEnv'
  | 'generateDotenv'
  | 'openConfig'

export interface ActionPickerItem<Action extends string> {
  label: string
  description: string
  action: Action
}

export interface RecentActionFollowUpItem {
  label: string
  description: string
  commandId: string
}

export function buildImportCompletionItems(
  fileName: string,
  sourceFileExists: boolean
): ActionPickerItem<ImportCompletionAction>[] {
  const items: ActionPickerItem<ImportCompletionAction>[] = [
    {
      label: vscode.l10n.t('Open Terminal'),
      description: vscode.l10n.t('Use the imported secrets right away'),
      action: 'openTerminal',
    },
    {
      label: vscode.l10n.t('View Secrets'),
      description: vscode.l10n.t('Verify the imported keys in RunEnv'),
      action: 'viewSecrets',
    },
    {
      label: vscode.l10n.t('Open .runenv.json'),
      description: vscode.l10n.t(
        'Review the project, environment, and preset for this folder'
      ),
      action: 'openConfig',
    },
  ]

  if (sourceFileExists) {
    items.unshift({
      label: vscode.l10n.t('Delete Old File'),
      description: vscode.l10n.t(
        '{0} is now optional if RunEnv is the source of truth',
        fileName
      ),
      action: 'deleteSource',
    })
  }

  return items
}

export function buildGenerateCompletionItems(
  filename: string
): ActionPickerItem<GenerateCompletionAction>[] {
  return [
    {
      label: vscode.l10n.t('Open Generated File'),
      description: vscode.l10n.t('Review {0} in the editor', filename),
      action: 'openFile',
    },
    {
      label: vscode.l10n.t('Open Terminal'),
      description: vscode.l10n.t(
        'Start working with secrets active in this window'
      ),
      action: 'openTerminal',
    },
    {
      label: vscode.l10n.t('Open .runenv.json'),
      description: vscode.l10n.t(
        'Review the project, environment, and preset for this folder'
      ),
      action: 'openConfig',
    },
  ]
}

export function buildPresetUpdateCompletionItems(): ActionPickerItem<PresetUpdateCompletionAction>[] {
  return [
    {
      label: vscode.l10n.t('Import .env File'),
      description: vscode.l10n.t(
        'Migrate detected local env files into RunEnv'
      ),
      action: 'importEnv',
    },
    {
      label: vscode.l10n.t('Generate .env File'),
      description: vscode.l10n.t(
        'Create a local file using the updated preset'
      ),
      action: 'generateDotenv',
    },
    {
      label: vscode.l10n.t('Open .runenv.json'),
      description: vscode.l10n.t(
        'Review the stored project, environment, and preset'
      ),
      action: 'openConfig',
    },
  ]
}

export function buildRecentActionFollowUpItems(
  action: RecentAction
): RecentActionFollowUpItem[] {
  const items: RecentActionFollowUpItem[] = [
    {
      label: vscode.l10n.t('Open Home'),
      description: vscode.l10n.t(
        'Open the main RunEnv sidebar view for this workspace'
      ),
      commandId: 'runenv.openHome',
    },
    {
      label: vscode.l10n.t('Doctor Report'),
      description: vscode.l10n.t('Open the workspace health report'),
      commandId: 'runenv.doctor',
    },
  ]

  if (action.commandId) {
    items.unshift({
      label: vscode.l10n.t('Run Again: {0}', action.label),
      description: vscode.l10n.t(
        'Repeat this action for the current workspace'
      ),
      commandId: action.commandId,
    })
  }

  return items
}
