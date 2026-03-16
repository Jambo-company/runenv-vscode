import * as vscode from 'vscode'
import { ApiError, NetworkError } from '../api'
import { getExtensionState } from '../core/extension-state'

export function showError(prefix: string, err: unknown) {
  const { session, setLastIssue, recordRecentAction } = getExtensionState()
  let message = 'Unknown error'
  let command:
    | {
        id: string
        title: string
      }
    | undefined

  if (err instanceof NetworkError) {
    if (err.isOffline) {
      message = vscode.l10n.t(
        'Cannot reach the RunEnv server. Check your network connection and verify the API URL in settings.'
      )
      command = {
        id: 'runenv.openSettings',
        title: vscode.l10n.t('Open Settings'),
      }
    } else if (err.isTimeout) {
      message = vscode.l10n.t(
        'The request timed out. The server may be slow or unreachable. Try again later.'
      )
      command = { id: 'runenv.doctor', title: vscode.l10n.t('Doctor Report') }
    } else {
      message = vscode.l10n.t(
        'Network error: {0}. Check your connection and try again.',
        err.message
      )
      command = { id: 'runenv.doctor', title: vscode.l10n.t('Doctor Report') }
    }
    vscode.window.showErrorMessage(`${prefix}: ${message}`)
  } else if (
    err instanceof Error &&
    err.message.startsWith('Invalid JSON response:') &&
    err.message.includes('<!DOCTYPE html>')
  ) {
    message =
      vscode.l10n.t(
        'The current RunEnv API URL returned HTML instead of the CLI JSON API. Check runenv.apiUrl and make sure this server supports /api/cli/* routes.'
      )
    command = { id: 'runenv.openSettings', title: vscode.l10n.t('Open Settings') }
    vscode.window.showErrorMessage(`${prefix}: ${message}`)
  } else if (err instanceof ApiError) {
    message = err.message
    if (err.isUnauthorized) {
      command = { id: 'runenv.login', title: vscode.l10n.t('Login') }
    } else if (session.loadedProject && session.loadedEnv) {
      command = { id: 'runenv.loadSecrets', title: vscode.l10n.t('Load Secrets') }
    }
    vscode.window.showErrorMessage(`${prefix}: ${message}`)
  } else if (err instanceof Error) {
    message = err.message
    vscode.window.showErrorMessage(`${prefix}: ${message}`)
  } else {
    vscode.window.showErrorMessage(`${prefix}: ${message}`)
  }

  setLastIssue({
    title: prefix,
    detail: message,
    ...(command ? { command } : {}),
  })
  void recordRecentAction(prefix, message, 'error', command?.id)
}
