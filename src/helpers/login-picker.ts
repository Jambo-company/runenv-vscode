import * as vscode from 'vscode'
import { apiRequest } from '../api'

type AuthProviderId = 'github' | 'google' | 'apple'

interface AuthProvidersResponse {
  github: boolean
  google: boolean
  apple: boolean
}

export async function pickLoginProvider(
  apiUrl: string
): Promise<AuthProviderId | null> {
  let providers: AuthProvidersResponse | null = null

  try {
    providers = await apiRequest<AuthProvidersResponse>(apiUrl, '/api/auth/providers')
  } catch {
    // Older deployments may not expose provider discovery yet.
  }

  const enabledProviders: AuthProviderId[] = providers
    ? (Object.entries(providers)
        .filter(([, enabled]) => enabled)
        .map(([provider]) => provider) as AuthProviderId[])
    : ['github', 'google', 'apple']

  if (enabledProviders.length === 0) {
    vscode.window.showErrorMessage(
      vscode.l10n.t('No OAuth providers are configured on this RunEnv server.')
    )
    return null
  }

  if (enabledProviders.length === 1) {
    return enabledProviders[0]
  }

  const labels: Record<AuthProviderId, string> = {
    github: 'GitHub',
    google: 'Google',
    apple: 'Apple',
  }

  const picked = await vscode.window.showQuickPick(
    enabledProviders.map((provider) => ({
      label: labels[provider],
      description:
        providers === null
          ? vscode.l10n.t('Provider discovery unavailable on this server')
          : '',
      provider,
    })),
    { placeHolder: vscode.l10n.t('Choose how you want to sign in') }
  )

  return picked?.provider ?? null
}
