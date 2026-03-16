import * as vscode from 'vscode'
import { ApiError, NetworkError } from '../api'
import { getToken, loadProjectConfig } from '../config'
import { showError } from '../helpers/error'
import {
  applyRunenvEnvironmentCollection,
  clearRunenvEnvironmentCollection,
} from '../helpers/environment-collection'
import { fetchCliSecrets } from './api-client'
import { getExtensionState } from './extension-state'
import { setStatusBarState, updateStatusBar } from './status-bar'

let refreshTimer: ReturnType<typeof setInterval> | null = null
let consecutiveRefreshFailures = 0

export async function loadSecretsIntoTerminals(
  token: string,
  project: string,
  env: string
): Promise<void> {
  const data = await fetchCliSecrets(token, project, env)
  const {
    context,
    session,
    refreshTreeView,
    completionProvider,
    diagnosticsProvider,
  } = getExtensionState()

  const envCollection = context.environmentVariableCollection
  applyRunenvEnvironmentCollection(
    envCollection,
    project,
    env,
    data.secrets,
    data.count
  )

  session.setLoadedSecrets(project, env, data.secrets, data.count)
  refreshTreeView()
  completionProvider.updateKeys(data.secrets)
  diagnosticsProvider.updateKeys(data.secrets)
}

export function clearSecretsFromTerminals() {
  const {
    context,
    session,
    refreshTreeView,
    completionProvider,
    diagnosticsProvider,
  } = getExtensionState()

  stopRefreshTimer()
  clearRunenvEnvironmentCollection(context.environmentVariableCollection)
  session.clearLoadedSecrets()
  refreshTreeView()
  completionProvider.updateKeys({})
  diagnosticsProvider.clear()
}

export async function loadSecretsWithSpinner(
  token: string,
  project: string,
  env: string,
  silent = false
): Promise<boolean> {
  const { session, clearLastIssue, autoDetectFlutterProject } =
    getExtensionState()

  session.setLoading(true)
  updateStatusBar()

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: vscode.l10n.t('RunEnv: Loading secrets for {0}/{1}...', project, env),
        cancellable: false,
      },
      async () => {
        await loadSecretsIntoTerminals(token, project, env)
      }
    )
    clearLastIssue()
    startRefreshTimer()
    session.setLoading(false)
    updateStatusBar()
    await Promise.resolve(autoDetectFlutterProject())
    return true
  } catch (err) {
    session.setLoading(false)
    if (err instanceof ApiError && err.isUnauthorized) {
      await handleExpiredSession(!silent)
      return false
    }
    // On network failure, preserve cached secrets instead of clearing them
    if (err instanceof NetworkError && session.loadedProject) {
      updateStatusBar()
      if (!silent) {
        showError(vscode.l10n.t('Failed to load secrets'), err)
      }
      // Keep existing secrets active — they're still valid
      return false
    }
    updateStatusBar()
    if (!silent) {
      showError(vscode.l10n.t('Failed to load secrets'), err)
    }
    return false
  }
}

export async function onConfigFileChanged() {
  const project = loadProjectConfig()
  if (!project) {
    clearSecretsFromTerminals()
    updateStatusBar()
    return
  }

  const { session } = getExtensionState()
  if (
    project.project !== session.loadedProject ||
    project.env !== session.loadedEnv
  ) {
    const token = getToken()
    if (token) {
      await loadSecretsWithSpinner(token, project.project, project.env, true)
    } else {
      updateStatusBar()
    }
  }
}

export function startRefreshTimer() {
  stopRefreshTimer()
  consecutiveRefreshFailures = 0
  const intervalMinutes =
    vscode.workspace
      .getConfiguration('runenv')
      .get<number>('refreshInterval') || 15
  const baseIntervalMs = intervalMinutes * 60 * 1000

  function scheduleNext() {
    // Progressive backoff: 1x, 2x, 4x, 8x (capped at 8x base interval)
    const multiplier = Math.min(
      Math.pow(2, consecutiveRefreshFailures),
      8
    )
    const intervalMs = baseIntervalMs * multiplier

    refreshTimer = setTimeout(async () => {
      const token = getToken()
      const { session } = getExtensionState()
      if (!token || !session.loadedProject || !session.loadedEnv) {
        stopRefreshTimer()
        return
      }

      try {
        await loadSecretsIntoTerminals(
          token,
          session.loadedProject,
          session.loadedEnv
        )
        updateStatusBar()
        consecutiveRefreshFailures = 0
      } catch (err) {
        if (err instanceof ApiError && err.isUnauthorized) {
          await handleExpiredSession(false)
          return
        }
        consecutiveRefreshFailures++
      }
      scheduleNext()
    }, intervalMs)
  }

  scheduleNext()
}

export function stopRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
  consecutiveRefreshFailures = 0
}

export async function handleExpiredSession(interactive: boolean) {
  const { getWorkspaceSurfaceState, setLastIssue } = getExtensionState()
  const surface = getWorkspaceSurfaceState()

  setLastIssue({
    title: vscode.l10n.t('Session expired'),
    detail: vscode.l10n.t(
      'Your RunEnv session expired. Login again to reload secrets.'
    ),
    command: { id: 'runenv.login', title: vscode.l10n.t('Login') },
  })
  clearSecretsFromTerminals()
  setStatusBarState({
    text: '$(warning) RunEnv: Session expired',
    surface,
    secretsLabel: vscode.l10n.t('Session expired'),
    nextStep: {
      label: vscode.l10n.t('Login'),
      description: vscode.l10n.t('Sign in again to reload secrets.'),
      commandId: 'runenv.login',
    },
    command: 'runenv.login',
    warning: true,
  })

  if (!interactive) {
    return
  }

  const login = await vscode.window.showWarningMessage(
    vscode.l10n.t('RunEnv session expired. Please re-login.'),
    vscode.l10n.t('Login')
  )
  if (login === vscode.l10n.t('Login')) {
    await vscode.commands.executeCommand('runenv.login')
  }
}
