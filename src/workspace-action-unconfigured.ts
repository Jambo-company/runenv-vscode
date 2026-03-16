import * as vscode from 'vscode'
import {
  createAction,
  pushUniqueAction,
  type WorkspaceActionDescriptor,
} from './workspace-action-utils'

export function buildUnconfiguredWorkspaceActions(input: {
  loggedIn: boolean
  issue?:
    | {
        detail: string
        command?: {
          id: string
          title: string
        }
      }
    | null
  items: WorkspaceActionDescriptor[]
  seen: Set<string>
}) {
  if (input.issue?.command) {
    pushUniqueAction(
      input.items,
      input.seen,
      createAction(
        vscode.l10n.t('$(warning) Fix: {0}', input.issue.command.title),
        vscode.l10n.t('Resolve the current RunEnv issue first'),
        input.issue.command.id,
        input.issue.detail
      )
    )
  }

  pushUniqueAction(
    input.items,
    input.seen,
    createAction(
      vscode.l10n.t('$(home) Open Home'),
      vscode.l10n.t('Open the main RunEnv sidebar for this workspace'),
      'runenv.openHome',
      vscode.l10n.t(
        'Use Home for status, onboarding, files, and troubleshooting.'
      )
    )
  )

  pushUniqueAction(
    input.items,
    input.seen,
    createAction(
      vscode.l10n.t('$(rocket) Quick Start'),
      vscode.l10n.t('Sign in and connect this folder'),
      'runenv.quickStart',
      vscode.l10n.t('Guided flow for login, project setup, and loading secrets.')
    )
  )

  if (input.loggedIn) {
    pushUniqueAction(
      input.items,
      input.seen,
      createAction(
        vscode.l10n.t('$(add) Init Project'),
        vscode.l10n.t('Choose the project and environment for this workspace'),
        'runenv.init',
        vscode.l10n.t('Create or update `.runenv.json` for this folder.')
      )
    )
  }

  pushUniqueAction(
    input.items,
    input.seen,
    createAction(
      vscode.l10n.t('$(pulse) Doctor Report'),
      vscode.l10n.t('Open a workspace health report'),
      'runenv.doctor',
      vscode.l10n.t(
        'Summarize connection, setup progress, env files, and current issues.'
      )
    )
  )
}

export function appendWorkspaceFooterActions(input: {
  loggedIn: boolean
  items: WorkspaceActionDescriptor[]
  seen: Set<string>
}) {
  if (!input.loggedIn) {
    return
  }

  pushUniqueAction(
    input.items,
    input.seen,
    createAction(
      vscode.l10n.t('$(browser) Open Dashboard'),
      vscode.l10n.t('Open the current RunEnv server in your browser'),
      'runenv.openDashboard'
    )
  )
  pushUniqueAction(
    input.items,
    input.seen,
    createAction(
      vscode.l10n.t('$(settings-gear) Open Settings'),
      vscode.l10n.t('Review the RunEnv API URL and extension settings'),
      'runenv.openSettings'
    )
  )
  pushUniqueAction(
    input.items,
    input.seen,
    createAction(
      vscode.l10n.t('$(sign-out) Logout'),
      vscode.l10n.t('Disconnect this VS Code window from RunEnv'),
      'runenv.logout'
    )
  )
}
