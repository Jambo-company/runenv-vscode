import * as vscode from 'vscode'
import { getToken, loadProjectConfig } from '../config'
import { fetchCliSecrets } from '../core/api-client'
import { getExtensionState } from '../core/extension-state'
import {
  clearSecretsFromTerminals,
  loadSecretsIntoTerminals,
  startRefreshTimer,
} from '../core/session'
import { updateStatusBar } from '../core/status-bar'
import { showError } from '../helpers/error'

export async function cmdLoadSecrets() {
  const { session, recordRecentAction, clearLastIssue } = getExtensionState()
  const token = getToken()
  if (!token) {
    const loginLabel = vscode.l10n.t('Login')
    const login = await vscode.window.showErrorMessage(
      vscode.l10n.t('You need to log in before RunEnv can load secrets.'),
      loginLabel
    )
    if (login === loginLabel) {
      await vscode.commands.executeCommand('runenv.login')
    }
    return
  }

  const project = loadProjectConfig()
  if (!project) {
    const initProjectLabel = vscode.l10n.t('Init Project')
    const action = await vscode.window.showErrorMessage(
      vscode.l10n.t('This folder is not connected to a RunEnv project yet.'),
      initProjectLabel
    )
    if (action === initProjectLabel) {
      await vscode.commands.executeCommand('runenv.init')
    }
    return
  }

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: vscode.l10n.t(
          'RunEnv: Loading secrets for {0}/{1}...',
          project.project,
          project.env
        ),
      },
      async () => {
        await loadSecretsIntoTerminals(token, project.project, project.env)
      }
    )

    vscode.window.showInformationMessage(
      session.loadedSecretCount > 0
        ? vscode.l10n.t(
            '{0} secret{1} are now active in every terminal in this VS Code window.',
            session.loadedSecretCount,
            session.loadedSecretCount === 1 ? '' : 's'
          )
        : vscode.l10n.t(
            'This environment is now active in every terminal in this VS Code window. No secrets are currently stored for it.'
          )
    )
    await recordRecentAction(
      'Load Secrets',
      `${project.project}/${project.env} (${session.loadedSecretCount})`,
      'success',
      'runenv.loadSecrets',
      [
        `Workspace: ${project.project}/${project.env}`,
        `Secrets active: ${session.loadedSecretCount}`,
        'Environment variables are now available in terminals, tasks, and debug sessions.',
      ].join('\n')
    )
    clearLastIssue()
    startRefreshTimer()
    updateStatusBar()
  } catch (err) {
    showError(vscode.l10n.t('Failed to load secrets'), err)
  }
}

export async function cmdViewSecrets() {
  const { clearLastIssue } = getExtensionState()
  const token = getToken()
  if (!token) {
    vscode.window.showErrorMessage(vscode.l10n.t('You need to log in first.'))
    return
  }

  const project = loadProjectConfig()
  if (!project) {
    vscode.window.showErrorMessage(
      vscode.l10n.t('This folder is not connected to a RunEnv project yet.')
    )
    return
  }

  try {
    const data = await fetchCliSecrets(token, project.project, project.env)

    const lines = Object.entries(data.secrets)
      .map(([key, value]) => {
        const masked =
          value.length > 8
            ? value.slice(0, 4) + '••••' + value.slice(-4)
            : '••••••••'
        return `${key} = ${masked}`
      })
      .join('\n')

    const header = `# ${project.project} / ${project.env}\n# ${vscode.l10n.t(
      '{0} secret{1}',
      data.count,
      data.count === 1 ? '' : 's'
    )}\n\n`
    const doc = await vscode.workspace.openTextDocument({
      content: header + lines,
      language: 'properties',
    })
    await vscode.window.showTextDocument(doc, { preview: true })
    clearLastIssue()
  } catch (err) {
    showError(vscode.l10n.t('Failed to view secrets'), err)
  }
}

export async function cmdUnload() {
  const { recordRecentAction } = getExtensionState()
  clearSecretsFromTerminals()
  await recordRecentAction(
    'Unload Secrets',
    'Cleared RunEnv values from all terminals',
    'info',
    'runenv.unload'
  )
  vscode.window.showInformationMessage(
    vscode.l10n.t(
      'RunEnv secrets were removed from every terminal in this VS Code window.'
    )
  )
  updateStatusBar()
}
