import * as path from 'path'
import * as vscode from 'vscode'
import {
  getApiUrl,
  getProjectWorkspaceRoot,
  getEmail,
  getProjectConfigPath,
  getToken,
  loadProjectConfig,
} from '../config'
import { getRunenvEditorFileKind } from '../editor-ux'
import { getEnvFilePreset, type EnvFilePresetId } from '../env-files'
import {
  type EnvCompletionProvider,
  type EnvDiagnosticsProvider,
} from '../env-intellisense'
import { type HomeTreeProvider } from '../home-tree'
import { type ProjectConfigEditorDiagnosticsProvider } from '../project-config-editor'
import { type RecentAction } from '../recent-actions'
import {
  appendRecentAction,
  getStoredRecentActions,
} from '../recent-actions-store'
import { type SecretsTreeProvider } from '../secrets-tree'
import {
  type RunenvIssueState,
  type WorkspaceSessionStore,
} from '../workspace-session'
import {
  buildWorkspaceSurfaceState,
  getWorkspaceInsights as buildWorkspaceInsights,
  type WorkspaceInsights,
  type WorkspaceSurfaceState,
} from '../workspace-context'

export interface ExtensionState {
  context: vscode.ExtensionContext
  session: WorkspaceSessionStore
  statusBarItem: vscode.StatusBarItem
  homeTreeProvider: HomeTreeProvider
  secretsTreeProvider: SecretsTreeProvider
  completionProvider: EnvCompletionProvider
  diagnosticsProvider: EnvDiagnosticsProvider
  projectConfigDiagnosticsProvider: ProjectConfigEditorDiagnosticsProvider
  refreshTreeView: () => void
  updateActiveEditorContext: () => void
  hasLoadedSession: (
    project?: { project: string; env: string } | null
  ) => boolean
  getRecentActions: () => RecentAction[]
  recordRecentAction: (
    label: string,
    detail: string,
    status?: RecentAction['status'],
    commandId?: string,
    summaryMarkdown?: string
  ) => Promise<void>
  getWorkspaceInsights: (project?: { env?: string } | null) => WorkspaceInsights
  getWorkspaceSurfaceState: (
    project?: { project: string; env: string; preset?: EnvFilePresetId } | null
  ) => WorkspaceSurfaceState
  setLastIssue: (issue: RunenvIssueState | null) => void
  clearLastIssue: () => void
  autoDetectFlutterProject: () => void | Promise<void>
}

let state: ExtensionState | null = null

export function initExtensionState(nextState: ExtensionState) {
  state = nextState
}

export function getExtensionState(): ExtensionState {
  if (!state) {
    throw new Error('RunEnv extension state is not initialized')
  }

  return state
}

export function hasLoadedSession(
  project?: { project: string; env: string } | null
) {
  return getExtensionState().session.hasLoadedSession(project)
}

export function getCurrentWorkspaceRoot() {
  return getProjectWorkspaceRoot()
}

export function getRecentActions(): RecentAction[] {
  const { context } = getExtensionState()
  return getStoredRecentActions(context.workspaceState, getCurrentWorkspaceRoot())
}

export async function recordRecentAction(
  label: string,
  detail: string,
  status: RecentAction['status'] = 'success',
  commandId?: string,
  summaryMarkdown?: string
) {
  const { context } = getExtensionState()
  await appendRecentAction(context.workspaceState, getCurrentWorkspaceRoot(), {
    label,
    detail,
    timestamp: new Date().toLocaleTimeString(),
    status,
    ...(commandId ? { commandId } : {}),
    ...(summaryMarkdown ? { summaryMarkdown } : {}),
  })
  refreshTreeView()
}

export function refreshTreeView() {
  const token = getToken()
  const { homeTreeProvider, secretsTreeProvider, session } = getExtensionState()
  const surface = getWorkspaceSurfaceState()

  void vscode.commands.executeCommand(
    'setContext',
    'runenv.workspaceOpen',
    !!surface.insights.workspaceRoot
  )
  void vscode.commands.executeCommand('setContext', 'runenv.loggedIn', !!token)
  void vscode.commands.executeCommand(
    'setContext',
    'runenv.projectConfigured',
    !!surface.project
  )
  void vscode.commands.executeCommand(
    'setContext',
    'runenv.secretsLoaded',
    surface.secretsLoaded
  )
  void vscode.commands.executeCommand(
    'setContext',
    'runenv.hasEnvFiles',
    surface.insights.envFiles.length > 0
  )
  void vscode.commands.executeCommand(
    'setContext',
    'runenv.hasPresetRecommendation',
    !!surface.presetRecommendation
  )

  homeTreeProvider.refresh({
    loggedIn: !!token,
    email: getEmail(),
    apiUrl: getApiUrl(),
    workspaceOpen: !!surface.insights.workspaceRoot,
    project: surface.project
      ? {
          name: surface.project.project,
          env: surface.project.env,
          presetTitle: getEnvFilePreset(surface.project.preset).title,
        }
      : null,
    workspace: surface.insights.workspaceRoot
      ? {
          rootPath: surface.insights.workspaceRoot,
          envFiles: surface.insights.envFiles,
          packageScriptCount: surface.insights.packageScriptCount,
          configPath: surface.insights.hasProjectConfig
            ? getProjectConfigPath(surface.insights.workspaceRoot)
            : null,
        }
      : null,
    secretsLoaded: surface.secretsLoaded,
    loadedSecretCount: session.loadedSecretCount,
    lastRefreshTime: session.lastRefreshTime,
    recentActions: getRecentActions(),
    presetRecommendation: surface.presetRecommendation,
    nextStep: surface.nextStep,
    setupIncomplete: surface.setupIncomplete,
    highlightedAdvancedActions: surface.highlightedAdvancedActions,
    issue: session.issue,
  })

  secretsTreeProvider.refresh(
    surface.secretsLoaded ? session.activeSecrets : null,
    !!token,
    surface.project
      ? {
          project: surface.project.project,
          env: surface.project.env,
        }
      : null
  )

  updateActiveEditorContext()
}

export function updateActiveEditorContext() {
  const activeEditor = vscode.window.activeTextEditor
  const project = loadProjectConfig()
  const fileKind = getRunenvEditorFileKind({
    filePath: activeEditor?.document.uri.fsPath,
    environmentName: project?.env || 'development',
  })

  void vscode.commands.executeCommand(
    'setContext',
    'runenv.activeEditorIsEnvFile',
    fileKind === 'envFile'
  )
  void vscode.commands.executeCommand(
    'setContext',
    'runenv.activeEditorIsProjectConfig',
    fileKind === 'projectConfig'
  )
}

export function setLastIssue(issue: RunenvIssueState | null) {
  getExtensionState().session.setIssue(issue)
  refreshTreeView()
}

export function clearLastIssue() {
  getExtensionState().session.clearIssue()
  refreshTreeView()
}

export function getWorkspaceInsights(project?: { env?: string } | null) {
  return buildWorkspaceInsights({
    workspaceRoot: getCurrentWorkspaceRoot(),
    environmentName: project?.env || 'development',
  })
}

export function getWorkspaceSurfaceState(
  project: { project: string; env: string; preset?: EnvFilePresetId } | null =
    loadProjectConfig()
) {
  const { session } = getExtensionState()
  return buildWorkspaceSurfaceState({
    project,
    workspaceRoot: getCurrentWorkspaceRoot(),
    loggedIn: Boolean(getToken()),
    email: getEmail(),
    issue: session.issue,
    sessionLoaded: hasLoadedSession(project),
    loadedSecretCount: session.loadedSecretCount,
  })
}
