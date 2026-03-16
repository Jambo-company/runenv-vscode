import * as fs from 'fs'
import * as vscode from 'vscode'
import { apiRequest } from '../api'
import {
  getApiUrl,
  getToken,
  loadProjectConfigContext,
  loadRawProjectConfig,
  saveProjectConfig,
} from '../config'
import { fetchCliSecrets } from '../core/api-client'
import { getExtensionState } from '../core/extension-state'
import { loadSecretsIntoTerminals, startRefreshTimer } from '../core/session'
import { updateStatusBar } from '../core/status-bar'
import { getRunenvEditorFileKind } from '../editor-ux'
import { getEnvFilePreset, resolveEnvFilePresetId, type EnvFileProfile } from '../env-files'
import { parseEnvFile } from '../helpers/env-parser'
import { showError } from '../helpers/error'
import { getProfileMeaning, pickImportProfile, pickPreset } from '../helpers/pickers'
import {
  buildImportPlan,
} from '../import-diff'
import { buildImportResultContent } from '../preview'
import { collectWorkspaceEnvFiles } from '../workspace-context'
import {
  confirmImportPreview,
  showImportCompletionPicker,
  showImportResultSummary,
} from './import-env-ui'

export async function cmdImportEnv(
  selectedFile?: vscode.Uri | { fsPath?: string } | string
) {
  const { clearLastIssue, recordRecentAction, setLastIssue } = getExtensionState()
  const token = getToken()
  if (!token) {
    const loginLabel = vscode.l10n.t('Login')
    const login = await vscode.window.showErrorMessage(
      vscode.l10n.t('You need to log in before RunEnv can import this file.'),
      loginLabel
    )
    if (login === loginLabel) {
      await vscode.commands.executeCommand('runenv.login')
    }
    return
  }

  const projectContext = loadProjectConfigContext()
  if (!projectContext) {
    const initProjectLabel = vscode.l10n.t('Init Project')
    const action = await vscode.window.showErrorMessage(
      vscode.l10n.t('This folder is not connected to RunEnv yet.'),
      initProjectLabel
    )
    if (action === initProjectLabel) {
      await vscode.commands.executeCommand('runenv.init')
    }
    return
  }
  const { workspaceRoot, ...project } = projectContext

  const envFiles = collectWorkspaceEnvFiles(workspaceRoot, project.env)

  if (envFiles.length === 0) {
    vscode.window.showInformationMessage(
      vscode.l10n.t('No .env files were found in the top level of this folder.')
    )
    return
  }

  const selectedPath =
    typeof selectedFile === 'string'
      ? selectedFile
      : selectedFile && typeof selectedFile === 'object' && 'fsPath' in selectedFile
        ? selectedFile.fsPath
        : null
  const activeEditorPath =
    !selectedPath &&
    getRunenvEditorFileKind({
      filePath: vscode.window.activeTextEditor?.document.uri.fsPath,
      environmentName: project.env,
    }) === 'envFile'
      ? vscode.window.activeTextEditor?.document.uri.fsPath || null
      : null

  const preselected = selectedPath
    ? envFiles.find((file) => file.fullPath === selectedPath)
    : activeEditorPath
      ? envFiles.find((file) => file.fullPath === activeEditorPath)
      : null

  const preselectedPick: { label: string; detail: string } | null = preselected
    ? {
        label: preselected.name,
        detail: preselected.fullPath,
      }
    : null

  const picked: { label: string; detail: string } | undefined =
    preselectedPick ||
    (await vscode.window.showQuickPick<{ label: string; detail: string }>(
      envFiles.map((file) => ({
        label: file.name,
        detail: file.fullPath,
      })),
      {
        placeHolder: vscode.l10n.t(
          'Choose the file you want to bring into RunEnv'
        ),
      }
    ))
  if (!picked) return

  const currentPresetId = resolveEnvFilePresetId(project.preset)
  const presetId = await pickPreset(workspaceRoot, currentPresetId)
  if (!presetId) return

  const profile = await pickImportProfile(project.env, presetId, picked.detail!)
  if (!profile || profile.importTarget === null) return

  const envContent = fs.readFileSync(picked.detail!, 'utf-8')
  const secrets = parseEnvFile(envContent)

  if (Object.keys(secrets).length === 0) {
    vscode.window.showInformationMessage(
      vscode.l10n.t('No secrets found in the file.')
    )
    setLastIssue({
      title: vscode.l10n.t('Import preview found no keys'),
      detail: vscode.l10n.t(
        '{0} does not contain any importable KEY=value pairs.',
        picked.label
      ),
    })
    return
  }

  try {
    const existingTarget = await fetchCliSecrets(token, project.project, project.env, {
      presetId,
      profileId: profile.id,
      resolve: false,
    })

    const confirmed = await confirmImportPreview({
      fileName: picked.label,
      fullPath: picked.detail!,
      project: project.project,
      env: project.env,
      profile,
      secrets,
      existingSecrets: existingTarget.secrets,
    })
    if (!confirmed) return

    const importPlan = buildImportPlan(secrets, confirmed.diff, confirmed.mode)
    const importModeLabel =
      confirmed.mode === 'overwrite'
        ? vscode.l10n.t('Overwrite existing values')
        : vscode.l10n.t('Only add missing keys')

    await apiRequest(getApiUrl(), '/api/cli/secrets', {
      method: 'POST',
      token,
      body: {
        project: project.project,
        env: project.env,
        operation: 'push',
        secrets: importPlan.secrets,
        importContext: {
          presetId,
          profileId: profile.id,
          filename: profile.filename,
        },
      },
    })

    if (presetId !== currentPresetId) {
      saveProjectConfig(
        workspaceRoot,
        {
          project: project.project,
          env: project.env,
          preset: presetId,
        },
        loadRawProjectConfig(workspaceRoot)
      )
    }

    await loadSecretsIntoTerminals(token, project.project, project.env)
    startRefreshTimer()
    updateStatusBar()

    vscode.window.showInformationMessage(
      vscode.l10n.t(
        'Imported {0} value{1} from {2}.',
        importPlan.importedKeys.length,
        importPlan.importedKeys.length === 1 ? '' : 's',
        picked.label
      )
    )
    await recordRecentAction(
      'Import .env File',
      `${picked.label} -> ${project.project}/${project.env} (+${importPlan.addedCount}${importPlan.updatedCount ? `, ~${importPlan.updatedCount}` : ''})`,
      'success',
      'runenv.importEnv',
      buildImportResultContent({
        fileName: picked.label,
        fullPath: picked.detail!,
        project: project.project,
        env: project.env,
        presetTitle: getEnvFilePreset(presetId).title,
        profileLabel: profile.title,
        profileDescription: getProfileMeaning(profile),
        keys: importPlan.importedKeys,
        sourceFileStillExists: fs.existsSync(picked.detail!),
        importModeLabel,
        addedCount: importPlan.addedCount,
        updatedCount: importPlan.updatedCount,
        skippedConflictCount: importPlan.skippedConflictCount,
        skippedUnchangedCount: importPlan.skippedUnchangedCount,
      })
    )
    clearLastIssue()
    await showImportResultSummary({
      fileName: picked.label,
      fullPath: picked.detail!,
      project: project.project,
      env: project.env,
      presetTitle: getEnvFilePreset(presetId).title,
      profile,
      keys: importPlan.importedKeys,
      importModeLabel,
      addedCount: importPlan.addedCount,
      updatedCount: importPlan.updatedCount,
      skippedConflictCount: importPlan.skippedConflictCount,
      skippedUnchangedCount: importPlan.skippedUnchangedCount,
    })
    await showImportCompletionPicker({
      fileName: picked.label,
      fullPath: picked.detail!,
    })
  } catch (err) {
    showError(vscode.l10n.t('Import failed'), err)
  }
}
