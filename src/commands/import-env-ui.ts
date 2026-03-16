import * as fs from 'fs'
import * as vscode from 'vscode'
import { buildImportCompletionItems } from '../action-pickers'
import { type EnvFileProfile } from '../env-files'
import { getProfileMeaning } from '../helpers/pickers'
import {
  buildImportDiff,
  buildImportPlan,
  type ImportDiff,
  type ImportMode,
} from '../import-diff'
import { showMarkdownDocument } from '../markdown-documents'
import {
  buildImportPreviewContent,
  buildImportResultContent,
} from '../preview'

export async function confirmImportPreview(options: {
  fileName: string
  fullPath: string
  project: string
  env: string
  profile: EnvFileProfile
  secrets: Record<string, string>
  existingSecrets: Record<string, string>
}): Promise<{
  mode: ImportMode
  diff: ImportDiff
  secrets: Record<string, string>
} | null> {
  const diff = buildImportDiff(options.secrets, options.existingSecrets)

  await showMarkdownDocument(
    buildImportPreviewContent({
      fileName: options.fileName,
      fullPath: options.fullPath,
      project: options.project,
      env: options.env,
      profileLabel: options.profile.title,
      profileDescription: getProfileMeaning(options.profile),
      keys: Object.keys(options.secrets).sort(),
      existingValueCount: diff.existingCount,
      newKeys: diff.newKeys,
      changedKeys: diff.changedKeys,
      unchangedKeys: diff.unchangedKeys,
    })
  )

  if (diff.newKeys.length === 0 && diff.changedKeys.length === 0) {
    vscode.window.showInformationMessage(
      vscode.l10n.t(
        '{0} does not contain anything new for this RunEnv target.',
        options.fileName
      )
    )
    return null
  }

  if (diff.changedKeys.length === 0) {
    const importNewKeysLabel = vscode.l10n.t('Import New Keys')
    const confirm = await vscode.window.showWarningMessage(
      vscode.l10n.t(
        'Import {0} new value{1} from {2} into {3}/{4} as {5}?',
        diff.newKeys.length,
        diff.newKeys.length === 1 ? '' : 's',
        options.fileName,
        options.project,
        options.env,
        options.profile.scope === 'local'
          ? vscode.l10n.t('local overrides')
          : vscode.l10n.t('shared secrets')
      ),
      importNewKeysLabel,
      vscode.l10n.t('Cancel')
    )

    if (confirm !== importNewKeysLabel) {
      return null
    }

    return {
      mode: 'addOnly',
      diff,
      secrets: buildImportPlan(options.secrets, diff, 'addOnly').secrets,
    }
  }

  const modeItems: Array<{
    label: string
    description: string
    detail: string
    mode: ImportMode
  }> = [
    {
      label: vscode.l10n.t('Overwrite Existing Values'),
      description: vscode.l10n.t(
        'Import {0} key{1}',
        diff.newKeys.length + diff.changedKeys.length,
        diff.newKeys.length + diff.changedKeys.length === 1 ? '' : 's'
      ),
      detail: vscode.l10n.t(
        '{0} new, {1} changed, {2} unchanged skipped',
        diff.newKeys.length,
        diff.changedKeys.length,
        diff.unchangedKeys.length
      ),
      mode: 'overwrite',
    },
    {
      label: vscode.l10n.t('Only Add Missing Keys'),
      description: vscode.l10n.t(
        'Import {0} new key{1}',
        diff.newKeys.length,
        diff.newKeys.length === 1 ? '' : 's'
      ),
      detail: vscode.l10n.t(
        '{0} changed key{1} will be skipped',
        diff.changedKeys.length,
        diff.changedKeys.length === 1 ? '' : 's'
      ),
      mode: 'addOnly',
    },
  ]

  const pickedMode = await vscode.window.showQuickPick(modeItems, {
    placeHolder: vscode.l10n.t(
      'Import preview found existing RunEnv values. Choose how to handle changed keys.'
    ),
  })
  if (!pickedMode) return null

  const plan = buildImportPlan(options.secrets, diff, pickedMode.mode)
  if (Object.keys(plan.secrets).length === 0) {
    vscode.window.showInformationMessage(
      vscode.l10n.t('No keys remain after skipping existing values.')
    )
    return null
  }

  return { mode: pickedMode.mode, diff, secrets: plan.secrets }
}

export async function showImportCompletionPicker(options: {
  fileName: string
  fullPath: string
}) {
  const picked = await vscode.window.showQuickPick(
    buildImportCompletionItems(
      options.fileName,
      fs.existsSync(options.fullPath)
    ),
    { placeHolder: vscode.l10n.t('Import complete. What do you want to do next?') }
  )
  if (!picked) return

  switch (picked.action) {
    case 'deleteSource': {
      const confirmed = await vscode.window.showWarningMessage(
        vscode.l10n.t('Delete {0}?', options.fileName),
        vscode.l10n.t('Delete'),
        vscode.l10n.t('Cancel')
      )
      if (confirmed !== vscode.l10n.t('Delete')) return

      fs.unlinkSync(options.fullPath)
      vscode.window.showInformationMessage(
        vscode.l10n.t(
          '{0} was deleted. These values are now managed by RunEnv.',
          options.fileName
        )
      )
      return
    }
    case 'openTerminal':
      await vscode.commands.executeCommand('runenv.openTerminal')
      return
    case 'viewSecrets':
      await vscode.commands.executeCommand('runenv.viewSecrets')
      return
    case 'openConfig':
      await vscode.commands.executeCommand('runenv.openProjectConfig')
      return
  }
}

export async function showImportResultSummary(options: {
  fileName: string
  fullPath: string
  project: string
  env: string
  presetTitle: string
  profile: EnvFileProfile
  keys: string[]
  importModeLabel: string
  addedCount: number
  updatedCount: number
  skippedConflictCount: number
  skippedUnchangedCount: number
}) {
  await showMarkdownDocument(
    buildImportResultContent({
      fileName: options.fileName,
      fullPath: options.fullPath,
      project: options.project,
      env: options.env,
      presetTitle: options.presetTitle,
      profileLabel: options.profile.title,
      profileDescription: getProfileMeaning(options.profile),
      keys: [...options.keys].sort(),
      sourceFileStillExists: fs.existsSync(options.fullPath),
      importModeLabel: options.importModeLabel,
      addedCount: options.addedCount,
      updatedCount: options.updatedCount,
      skippedConflictCount: options.skippedConflictCount,
      skippedUnchangedCount: options.skippedUnchangedCount,
    }),
    false
  )
}
