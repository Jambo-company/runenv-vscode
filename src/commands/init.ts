import * as fs from 'fs'
import * as vscode from 'vscode'
import {
  getDefaultWorkspaceRoot,
  getApiUrl,
  getProjectConfigPath,
  getToken,
  loadProjectConfig,
  loadProjectConfigContext,
  loadRawProjectConfig,
  saveProjectConfig,
} from '../config'
import { getEnvFilePreset } from '../env-files'
import {
  fetchCliEnvironments,
  fetchCliProjects,
} from '../core/api-client'
import { getExtensionState } from '../core/extension-state'
import { loadSecretsWithSpinner } from '../core/session'
import { updateStatusBar } from '../core/status-bar'
import { showNextStepPicker } from './navigation'
import { showError } from '../helpers/error'
import { detectWorkspacePreset } from 'runenv-shared/workspace-preset'

export async function cmdSwitchEnv() {
  const { session, recordRecentAction, clearLastIssue } = getExtensionState()
  const project = loadProjectConfig()
  if (!project) {
    vscode.window.showErrorMessage(
      vscode.l10n.t('This folder is not connected to a RunEnv project yet.')
    )
    return
  }

  const token = getToken()
  if (!token) {
    vscode.window.showErrorMessage(vscode.l10n.t('You need to log in first.'))
    return
  }

  try {
    const data = await fetchCliEnvironments(token, project.project)

    const items = data.environments.map((env) => ({
      label: env.name === project.env ? `$(check) ${env.name}` : env.name,
      description: vscode.l10n.t(
        '{0} secret{1}',
        env.secretCount,
        env.secretCount === 1 ? '' : 's'
      ),
      envName: env.name,
    }))

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: vscode.l10n.t(
        'Choose which environment this folder should use'
      ),
    })

    if (!picked) return

    const workspaceRoot = loadProjectConfigContext()?.workspaceRoot || getDefaultWorkspaceRoot()
    if (!workspaceRoot) return

    saveProjectConfig(
      workspaceRoot,
      {
        project: project.project,
        env: picked.envName,
        ...(project.preset ? { preset: project.preset } : {}),
      },
      loadRawProjectConfig(workspaceRoot)
    )

    const loaded = await loadSecretsWithSpinner(
      token,
      project.project,
      picked.envName
    )
    if (!loaded) return

    vscode.window.showInformationMessage(
      vscode.l10n.t(
        'This folder now uses {0}. {1} secret{2} were refreshed.',
        picked.envName,
        session.loadedSecretCount,
        session.loadedSecretCount === 1 ? '' : 's'
      )
    )
    await recordRecentAction(
      'Switch Environment',
      `${project.project}: ${project.env} -> ${picked.envName}`,
      'success',
      'runenv.switchEnv',
      [
        `Project: ${project.project}`,
        `Previous environment: ${project.env}`,
        `Current environment: ${picked.envName}`,
        `Secrets refreshed: ${session.loadedSecretCount}`,
      ].join('\n')
    )
    clearLastIssue()
    updateStatusBar()
  } catch (err) {
    showError(vscode.l10n.t('Failed to switch environment'), err)
  }
}

export async function cmdInit(showNextSteps = true) {
  const {
    session,
    setLastIssue,
    recordRecentAction,
    clearLastIssue,
    getWorkspaceInsights,
  } = getExtensionState()
  const token = getToken()
  if (!token) {
    const loginLabel = vscode.l10n.t('Login')
    const login = await vscode.window.showErrorMessage(
      vscode.l10n.t(
        'You need to log in before this folder can connect to RunEnv.'
      ),
      loginLabel
    )
    if (login === loginLabel) {
      await vscode.commands.executeCommand('runenv.login')
    }
    return
  }

  const workspaceRoot =
    loadProjectConfigContext()?.workspaceRoot || getDefaultWorkspaceRoot()
  if (!workspaceRoot) {
    vscode.window.showErrorMessage(
      vscode.l10n.t('Open a folder in VS Code first.')
    )
    return
  }

  const configPath = getProjectConfigPath(workspaceRoot)
  const currentProjectConfig = loadProjectConfig()
  if (fs.existsSync(configPath)) {
    const replaceLabel = vscode.l10n.t('Replace')
    const overwrite = await vscode.window.showWarningMessage(
      vscode.l10n.t(
        'This folder is already connected to RunEnv. Replace the current connection?'
      ),
      replaceLabel,
      vscode.l10n.t('Cancel')
    )
    if (overwrite !== replaceLabel) return
  }

  try {
    const data = await fetchCliProjects(token)

    if (!data.projects || data.projects.length === 0) {
      setLastIssue({
        title: vscode.l10n.t('No RunEnv projects found'),
        detail: vscode.l10n.t(
          'No projects were returned from {0}. Create one in the dashboard or switch the RunEnv API URL.',
          getApiUrl()
        ),
        command: {
          id: 'runenv.openDashboard',
          title: vscode.l10n.t('Open Dashboard'),
        },
      })
      vscode.window.showErrorMessage(
        vscode.l10n.t(
          'No RunEnv projects were found. Create one in the dashboard first.'
        )
      )
      return
    }

    const picked = await vscode.window.showQuickPick(
      data.projects.map((project) => ({
        label: project.name,
        description:
          project.environmentCount !== undefined
            ? vscode.l10n.t(
                '{0} environment{1}',
                project.environmentCount,
                project.environmentCount === 1 ? '' : 's'
              )
            : project.description || '',
        detail: project.description || '',
      })),
      {
        placeHolder: vscode.l10n.t(
          'Choose the RunEnv project for this folder'
        ),
      }
    )
    if (!picked) return

    const environments = await fetchCliEnvironments(token, picked.label)
    if (!environments.environments || environments.environments.length === 0) {
      setLastIssue({
        title: vscode.l10n.t('No environments found'),
        detail: vscode.l10n.t(
          '{0} does not have any environments on {1} yet.',
          picked.label,
          getApiUrl()
        ),
        command: {
          id: 'runenv.openDashboard',
          title: vscode.l10n.t('Open Dashboard'),
        },
      })
      vscode.window.showErrorMessage(
        vscode.l10n.t(
          'This project has no environments yet. Add one in the dashboard first.'
        )
      )
      return
    }

    const envChoice = await vscode.window.showQuickPick(
      environments.environments.map((env) => ({
        label: env.name,
        description: vscode.l10n.t(
          '{0} secret{1}',
          env.secretCount,
          env.secretCount === 1 ? '' : 's'
        ),
        envName: env.name,
      })),
      {
        placeHolder: vscode.l10n.t(
          'Choose the environment this folder should use by default'
        ),
      }
    )
    if (!envChoice) return

    const detectedPreset = detectWorkspacePreset(workspaceRoot)
    const presetId = currentProjectConfig?.preset || detectedPreset.presetId

    saveProjectConfig(
      workspaceRoot,
      {
        project: picked.label,
        env: envChoice.envName,
        preset: presetId,
      },
      loadRawProjectConfig(workspaceRoot)
    )

    const loaded = await loadSecretsWithSpinner(
      token,
      picked.label,
      envChoice.envName
    )
    if (!loaded) return

    vscode.window.showInformationMessage(
      vscode.l10n.t(
        'This folder is now connected to {0}/{1} ({2}). {3} secret{4} are ready in VS Code.',
        picked.label,
        envChoice.envName,
        getEnvFilePreset(presetId).title,
        session.loadedSecretCount,
        session.loadedSecretCount === 1 ? '' : 's'
      )
    )
    await recordRecentAction(
      vscode.l10n.t('Init Project'),
      `${picked.label}/${envChoice.envName} (${getEnvFilePreset(presetId).title})`,
      'success',
      'runenv.init',
      [
        vscode.l10n.t('Project: {0}', picked.label),
        vscode.l10n.t('Environment: {0}', envChoice.envName),
        vscode.l10n.t('Preset: {0}', getEnvFilePreset(presetId).title),
        ...(currentProjectConfig?.preset
          ? []
          : [
              detectedPreset.projectType === detectedPreset.presetId
                ? vscode.l10n.t(
                    'Preset detected from: {0}',
                    detectedPreset.reason
                  )
                : vscode.l10n.t(
                    'Preset detected for {0}: {1}',
                    detectedPreset.projectTypeLabel,
                    detectedPreset.reason
                  ),
            ]),
        vscode.l10n.t(
          'Secrets ready in VS Code: {0}',
          session.loadedSecretCount
        ),
      ].join('\n')
    )
    clearLastIssue()
    updateStatusBar()
    if (showNextSteps) {
      await showNextStepPicker(
        {
          project: picked.label,
          env: envChoice.envName,
        },
        getWorkspaceInsights({
          env: envChoice.envName,
        })
      )
    }
  } catch (err) {
    showError(vscode.l10n.t('Init failed'), err)
  }
}
