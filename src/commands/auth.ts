import * as vscode from 'vscode'
import { apiRequest } from '../api'
import {
  clearToken,
  getApiUrl,
  getEmail,
  getToken,
  loadProjectConfig,
  saveCliConfig,
} from '../config'
import { getExtensionState } from '../core/extension-state'
import {
  clearSecretsFromTerminals,
  loadSecretsIntoTerminals,
  startRefreshTimer,
} from '../core/session'
import { updateStatusBar } from '../core/status-bar'
import { showError } from '../helpers/error'
import { pickLoginProvider } from '../helpers/pickers'
import { sleep } from '../helpers/utils'

export async function cmdLogin() {
  const { clearLastIssue, recordRecentAction } = getExtensionState()
  const apiUrl = getApiUrl()

  const existingToken = getToken()
  if (existingToken) {
    const email = getEmail()
    const loginAgainLabel = vscode.l10n.t('Login Again')
    const choice = await vscode.window.showInformationMessage(
      vscode.l10n.t(
        'You are already logged in as {0}. Login again?',
        email || vscode.l10n.t('unknown')
      ),
      loginAgainLabel,
      vscode.l10n.t('Cancel')
    )
    if (choice !== loginAgainLabel) return
  }

  try {
    const provider = await pickLoginProvider(apiUrl)
    if (!provider) return

    const device = await apiRequest<{
      deviceCode: string
      verifyUrl: string
      expiresIn: number
    }>(apiUrl, '/api/cli/auth/device', {
      method: 'POST',
      body: { provider },
    })

    const fullUrl = device.verifyUrl.startsWith('http')
      ? device.verifyUrl
      : `${apiUrl}${device.verifyUrl}`

    await vscode.env.openExternal(vscode.Uri.parse(fullUrl))

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: vscode.l10n.t('RunEnv: Waiting for browser authentication...'),
        cancellable: true,
      },
      async (progress, cancellation) => {
        const maxAttempts = 150
        for (let i = 0; i < maxAttempts; i++) {
          if (cancellation.isCancellationRequested) {
            vscode.window.showInformationMessage(vscode.l10n.t('Login cancelled.'))
            return
          }

          await sleep(2000)
          progress.report({ increment: 100 / maxAttempts })

          try {
            const poll = await apiRequest<{
              status: string
              token?: string
              expiresIn?: number
              user?: { id: string; name: string; email: string }
            }>(apiUrl, `/api/cli/auth/poll?code=${device.deviceCode}`)

            if (poll.status === 'complete' && poll.token && poll.user) {
              const expiresAt = new Date(
                Date.now() + (poll.expiresIn || 14400) * 1000
              ).toISOString()

              saveCliConfig({
                apiUrl,
                token: poll.token,
                email: poll.user.email,
                expiresAt,
              })
              clearLastIssue()

              vscode.window.showInformationMessage(
                vscode.l10n.t(
                  'Logged in as {0} ({1})',
                  poll.user.name,
                  poll.user.email
                )
              )
              await recordRecentAction(
                'Login',
                `${poll.user.email} on ${apiUrl}`,
                'success',
                'runenv.login',
                `Signed in as ${poll.user.name} (${poll.user.email}) on ${apiUrl}.`
              )

              const project = loadProjectConfig()
              if (project) {
                await loadSecretsIntoTerminals(
                  poll.token,
                  project.project,
                  project.env
                )
                startRefreshTimer()
              }

              updateStatusBar()
              return
            }

            if (poll.status === 'expired') {
              vscode.window.showErrorMessage(
                vscode.l10n.t('Login session expired. Please try again.')
              )
              return
            }
          } catch {
            // Network error, keep polling
          }
        }

        vscode.window.showErrorMessage(
          vscode.l10n.t('Login timed out. Please try again.')
        )
      }
    )
  } catch (err) {
    showError(vscode.l10n.t('Login failed'), err)
  }
}

export async function cmdLogout() {
  const { clearLastIssue, recordRecentAction } = getExtensionState()
  clearToken()
  clearSecretsFromTerminals()
  clearLastIssue()
  await recordRecentAction(
    'Logout',
    'Disconnected this VS Code window',
    'info',
    'runenv.logout'
  )
  vscode.window.showInformationMessage(
    vscode.l10n.t(
      'Logged out. Secrets were cleared from every terminal in this VS Code window.'
    )
  )
  updateStatusBar()
}
