import * as vscode from 'vscode'
import { type WorkspaceSurfaceState } from './workspace-context'
import {
  createAction,
  pushUniqueAction,
  type WorkspaceActionDescriptor,
  getCommandIdForHighlightedAction,
} from './workspace-action-utils'

export function buildConfiguredWorkspaceActions(input: {
  surface: WorkspaceSurfaceState
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
  const activeSession = input.surface.secretsLoaded

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
        'Use Home for status, primary actions, files, and troubleshooting.'
      )
    )
  )

  if (input.surface.setupIncomplete) {
    pushUniqueAction(
      input.items,
      input.seen,
      createAction(
        vscode.l10n.t('$(rocket) Quick Start'),
        vscode.l10n.t('Finish setup or recover this workspace'),
        'runenv.quickStart',
        vscode.l10n.t(
          'Guided flow for login, project setup, secret loading, and recovery.'
        )
      )
    )
  } else {
    pushUniqueAction(
      input.items,
      input.seen,
      createAction(
        vscode.l10n.t('$(arrow-right) Next: {0}', input.surface.nextStep.label),
        input.surface.nextStep.description,
        input.surface.nextStep.commandId,
        vscode.l10n.t(
          'RunEnv thinks this is the highest-value next action for the current workspace.'
        )
      )
    )
  }

  if (input.surface.presetRecommendation) {
    pushUniqueAction(
      input.items,
      input.seen,
      createAction(
        vscode.l10n.t(
          '$(sparkle) Switch preset to {0}',
          input.surface.presetRecommendation.targetTitle
        ),
        vscode.l10n.t('Align this workspace with the detected env files'),
        'runenv.applyRecommendedPreset',
        input.surface.presetRecommendation.detail
      )
    )
  }

  pushUniqueAction(
    input.items,
    input.seen,
    createAction(
      activeSession
        ? vscode.l10n.t('$(sync) Load Secrets')
        : vscode.l10n.t('$(cloud-download) Load Secrets'),
      activeSession
        ? vscode.l10n.t('Refresh values from RunEnv')
        : vscode.l10n.t('Inject secrets into every terminal'),
      'runenv.loadSecrets',
      activeSession
        ? vscode.l10n.t(
            'Fetch the latest secret values and inject them into every terminal.'
          )
        : vscode.l10n.t(
            'Fetch secrets from RunEnv and activate them in this VS Code window.'
          )
    )
  )

  if (activeSession) {
    pushUniqueAction(
      input.items,
      input.seen,
      createAction(
        vscode.l10n.t('$(terminal) Open Terminal'),
        vscode.l10n.t('Use your secrets right away'),
        'runenv.openTerminal',
        vscode.l10n.t(
          'Open an integrated terminal with the current workspace secrets active.'
        )
      )
    )

    pushUniqueAction(
      input.items,
      input.seen,
      createAction(
        vscode.l10n.t('$(list-unordered) View Secrets'),
        vscode.l10n.t('Show masked secret values'),
        'runenv.viewSecrets',
        vscode.l10n.t('Read-only preview of secret keys and masked values.')
      )
    )
  }

  if (activeSession && input.surface.insights.packageScriptCount > 0) {
    pushUniqueAction(
      input.items,
      input.seen,
      createAction(
        vscode.l10n.t('$(play) Run Script'),
        vscode.l10n.t('Choose a script from package.json'),
        'runenv.run',
        vscode.l10n.t(
          'Run a package.json script with RunEnv secrets already active.'
        )
      )
    )
  }

  if (input.surface.insights.envFiles.length > 0 || !activeSession) {
    pushUniqueAction(
      input.items,
      input.seen,
      createAction(
        vscode.l10n.t('$(file-symlink-file) Import .env File'),
        input.surface.insights.envFiles.length
          ? vscode.l10n.t(
              '{0} detected local env file{1}',
              input.surface.insights.envFiles.length,
              input.surface.insights.envFiles.length === 1 ? '' : 's'
            )
          : vscode.l10n.t('Move values from an existing local file into RunEnv'),
        'runenv.importEnv',
        vscode.l10n.t(
          'Upload values from a local `.env` file as shared secrets or local overrides.'
        )
      )
    )
  }

  pushUniqueAction(
    input.items,
    input.seen,
    createAction(
      vscode.l10n.t('$(arrow-swap) Switch Environment'),
      vscode.l10n.t('Switch this folder to another environment'),
      'runenv.switchEnv',
      vscode.l10n.t(
        'Update `.runenv.json` and reload secrets for another environment.'
      )
    )
  )

  for (const action of input.surface.highlightedAdvancedActions) {
    pushUniqueAction(
      input.items,
      input.seen,
      createAction(
        `$(${action.iconId}) ${action.label}`,
        vscode.l10n.t('Selected advanced action'),
        getCommandIdForHighlightedAction(action),
        action.description
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

  if (activeSession) {
    pushUniqueAction(
      input.items,
      input.seen,
      createAction(
        vscode.l10n.t('$(circle-slash) Unload Secrets'),
        vscode.l10n.t('Clear secrets from this VS Code window'),
        'runenv.unload',
        vscode.l10n.t('Remove RunEnv values from all terminals in this window.')
      )
    )
  }
}
