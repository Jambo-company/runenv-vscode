import * as vscode from 'vscode'

export type SetupStepStatus = 'done' | 'current' | 'pending' | 'recommended'

export interface SetupProgressInput {
  workspaceOpen: boolean
  workspaceName?: string | null
  loggedIn: boolean
  email?: string | null
  projectName?: string | null
  envName?: string | null
  secretsLoaded: boolean
  loadedSecretCount: number
  envFileCount: number
}

export interface SetupStep {
  id: 'workspace' | 'login' | 'connect' | 'load' | 'import'
  title: string
  description: string
  status: SetupStepStatus
  command?: {
    id: string
    title: string
  }
}

export interface SetupSummary {
  label: string
  detail: string
  completedRequiredSteps: number
  totalRequiredSteps: number
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function getSetupSteps(input: SetupProgressInput): SetupStep[] {
  const steps: SetupStep[] = []

  const workspaceDone = input.workspaceOpen
  const loginDone = workspaceDone && input.loggedIn
  const connectDone = loginDone && !!input.projectName && !!input.envName
  const loadDone = connectDone && input.secretsLoaded

  steps.push({
    id: 'workspace',
    title: vscode.l10n.t('Open Folder'),
    description: workspaceDone
      ? vscode.l10n.t('Done · {0}', input.workspaceName || vscode.l10n.t('Workspace open'))
      : vscode.l10n.t('Current · Open a folder in VS Code first'),
    status: workspaceDone ? 'done' : 'current',
  })

  steps.push({
    id: 'login',
    title: vscode.l10n.t('Login'),
    description: loginDone
      ? vscode.l10n.t('Done · {0}', input.email || vscode.l10n.t('Signed in'))
      : workspaceDone
        ? vscode.l10n.t('Current · Sign in to RunEnv')
        : vscode.l10n.t('Pending · Available after opening a folder'),
    status: loginDone ? 'done' : workspaceDone ? 'current' : 'pending',
    command: workspaceDone
      ? { id: 'runenv.login', title: vscode.l10n.t('Login') }
      : undefined,
  })

  steps.push({
    id: 'connect',
    title: vscode.l10n.t('Init Project'),
    description: connectDone
      ? vscode.l10n.t(
          'Done · {0}/{1}',
          input.projectName || '',
          input.envName || ''
        )
      : loginDone
        ? vscode.l10n.t('Current · Connect this folder to a RunEnv project')
        : vscode.l10n.t('Pending · Available after login'),
    status: connectDone ? 'done' : loginDone ? 'current' : 'pending',
    command:
      workspaceDone && input.loggedIn
        ? { id: 'runenv.init', title: vscode.l10n.t('Init Project') }
        : undefined,
  })

  steps.push({
    id: 'load',
    title: vscode.l10n.t('Load Secrets'),
    description: loadDone
      ? input.loadedSecretCount > 0
        ? vscode.l10n.t('Done · {0} active', pluralize(input.loadedSecretCount, 'secret'))
        : vscode.l10n.t('Done · Connected with 0 secrets')
      : connectDone
        ? vscode.l10n.t('Current · Inject environment variables into this window')
        : vscode.l10n.t('Pending · Available after project setup'),
    status: loadDone ? 'done' : connectDone ? 'current' : 'pending',
    command: connectDone
      ? { id: 'runenv.loadSecrets', title: vscode.l10n.t('Load Secrets') }
      : undefined,
  })

  if (input.workspaceOpen && input.envFileCount > 0) {
    steps.push({
      id: 'import',
      title: vscode.l10n.t('Import .env File'),
      description: loadDone
        ? vscode.l10n.t(
            'Recommended · {0} still detected',
            pluralize(input.envFileCount, 'local env file')
          )
        : vscode.l10n.t('Pending · Available after secrets are loaded'),
      status: loadDone ? 'recommended' : 'pending',
      command: loadDone
        ? { id: 'runenv.importEnv', title: vscode.l10n.t('Import .env File') }
        : undefined,
    })
  }

  return steps
}

export function getSetupSummary(input: SetupProgressInput): SetupSummary {
  const requiredStepsDone = [
    input.workspaceOpen,
    input.workspaceOpen && input.loggedIn,
    input.workspaceOpen && input.loggedIn && !!input.projectName && !!input.envName,
    input.workspaceOpen &&
      input.loggedIn &&
      !!input.projectName &&
      !!input.envName &&
      input.secretsLoaded,
  ].filter(Boolean).length

  if (!input.workspaceOpen) {
    return {
      label: vscode.l10n.t('Setup: 0/4 complete'),
      detail: vscode.l10n.t('Open a folder in VS Code to begin Quick Start.'),
      completedRequiredSteps: 0,
      totalRequiredSteps: 4,
    }
  }

  if (!input.loggedIn) {
    return {
      label: vscode.l10n.t('Setup: {0}/4 complete', requiredStepsDone),
      detail: vscode.l10n.t('Next: Login'),
      completedRequiredSteps: requiredStepsDone,
      totalRequiredSteps: 4,
    }
  }

  if (!input.projectName || !input.envName) {
    return {
      label: vscode.l10n.t('Setup: {0}/4 complete', requiredStepsDone),
      detail: vscode.l10n.t('Next: Init Project'),
      completedRequiredSteps: requiredStepsDone,
      totalRequiredSteps: 4,
    }
  }

  if (!input.secretsLoaded) {
    return {
      label: vscode.l10n.t('Setup: {0}/4 complete', requiredStepsDone),
      detail: vscode.l10n.t('Next: Load Secrets'),
      completedRequiredSteps: requiredStepsDone,
      totalRequiredSteps: 4,
    }
  }

  if (input.envFileCount > 0) {
    return {
      label: vscode.l10n.t('Setup: 4/4 complete'),
      detail: vscode.l10n.t(
        '{0} can still be imported',
        pluralize(input.envFileCount, 'local env file')
      ),
      completedRequiredSteps: 4,
      totalRequiredSteps: 4,
    }
  }

  return {
    label: vscode.l10n.t('Setup: 4/4 complete'),
    detail: vscode.l10n.t('Quick Start is complete. This workspace is ready to use.'),
    completedRequiredSteps: 4,
    totalRequiredSteps: 4,
  }
}

export function getQuickStartPlaceHolder(input: SetupProgressInput) {
  if (!input.workspaceOpen) {
    return vscode.l10n.t(
      'Quick Start: step 1 of 4 — open a folder in VS Code first'
    )
  }

  if (!input.loggedIn) {
    return vscode.l10n.t('Quick Start: step 2 of 4 — sign in to RunEnv')
  }

  if (!input.projectName || !input.envName) {
    return vscode.l10n.t(
      'Quick Start: step 3 of 4 — connect this folder to a project'
    )
  }

  if (!input.secretsLoaded) {
    return vscode.l10n.t(
      'Quick Start: step 4 of 4 — load secrets into this window'
    )
  }

  if (input.envFileCount > 0) {
    return vscode.l10n.t(
      'Quick Start: setup complete — {0} still detected',
      pluralize(input.envFileCount, 'local env file')
    )
  }

  return vscode.l10n.t(
    'Quick Start: setup complete — choose the next step for this workspace'
  )
}
