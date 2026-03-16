import * as vscode from 'vscode'
import { cmdLogin, cmdLogout } from './commands/auth'
import {
  cmdApplyRecommendedPreset,
  cmdDoctor,
  cmdSmokeChecklist,
  cmdStatus,
} from './commands/diagnostics'
import {
  autoDetectFlutterProject,
  cmdGenerateDotenv,
  cmdSetupFlutterDebug,
} from './commands/generate-dotenv'
import { cmdImportEnv } from './commands/import-env'
import { cmdInit, cmdSwitchEnv } from './commands/init'
import {
  cmdOpenDashboard,
  cmdOpenHome,
  cmdOpenProjectConfig,
  cmdOpenReadme,
  cmdOpenRecentAction,
  cmdOpenSettings,
  cmdQuickStart,
} from './commands/navigation'
import { cmdOpenTerminal, cmdRun, cmdWrapScripts } from './commands/run'
import { cmdLoadSecrets, cmdUnload, cmdViewSecrets } from './commands/secrets'
import {
  getToken,
  loadProjectConfig,
} from './config'
import {
  clearLastIssue,
  getRecentActions,
  getWorkspaceInsights,
  getWorkspaceSurfaceState,
  hasLoadedSession,
  initExtensionState,
  recordRecentAction,
  refreshTreeView,
  setLastIssue,
  updateActiveEditorContext,
} from './core/extension-state'
import {
  clearSecretsFromTerminals,
  loadSecretsWithSpinner,
  onConfigFileChanged,
  stopRefreshTimer,
} from './core/session'
import { updateStatusBar } from './core/status-bar'
import {
  EnvCompletionProvider,
  EnvDiagnosticsProvider,
} from './env-intellisense'
import { clearRunenvEnvironmentCollection } from './helpers/environment-collection'
import { HomeTreeProvider } from './home-tree'
import { SecretsTreeProvider } from './secrets-tree'
import { ProjectConfigEditorDiagnosticsProvider } from './project-config-editor'
import { WorkspaceSessionStore } from './workspace-session'

let extensionContext: vscode.ExtensionContext
let statusBarItem: vscode.StatusBarItem
let homeTreeProvider: HomeTreeProvider
let secretsTreeProvider: SecretsTreeProvider
let completionProvider: EnvCompletionProvider
let diagnosticsProvider: EnvDiagnosticsProvider
let projectConfigDiagnosticsProvider: ProjectConfigEditorDiagnosticsProvider
const session = new WorkspaceSessionStore()

export async function activate(context: vscode.ExtensionContext) {
  extensionContext = context
  context.environmentVariableCollection.persistent = false
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    50
  )
  statusBarItem.command = 'runenv.openHome'

  homeTreeProvider = new HomeTreeProvider()
  secretsTreeProvider = new SecretsTreeProvider()
  completionProvider = new EnvCompletionProvider()
  diagnosticsProvider = new EnvDiagnosticsProvider()
  projectConfigDiagnosticsProvider = new ProjectConfigEditorDiagnosticsProvider()

  context.subscriptions.push(statusBarItem)
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('runenvHome', homeTreeProvider)
  )
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('runenvSecrets', secretsTreeProvider)
  )

  const langSelectors = [
    'javascript',
    'typescript',
    'javascriptreact',
    'typescriptreact',
    'python',
    'go',
    'rust',
  ]
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      langSelectors,
      completionProvider,
      '.'
    )
  )
  diagnosticsProvider.startWatching()
  projectConfigDiagnosticsProvider.startWatching()
  context.subscriptions.push({ dispose: () => diagnosticsProvider.dispose() })
  context.subscriptions.push({
    dispose: () => projectConfigDiagnosticsProvider.dispose(),
  })

  initExtensionState({
    context,
    session,
    statusBarItem,
    homeTreeProvider,
    secretsTreeProvider,
    completionProvider,
    diagnosticsProvider,
    projectConfigDiagnosticsProvider,
    refreshTreeView,
    updateActiveEditorContext,
    hasLoadedSession,
    getRecentActions,
    recordRecentAction,
    getWorkspaceInsights,
    getWorkspaceSurfaceState,
    setLastIssue,
    clearLastIssue,
    autoDetectFlutterProject,
  })

  context.subscriptions.push(
    vscode.commands.registerCommand('runenv.refreshTree', refreshTreeView),
    vscode.commands.registerCommand('runenv.quickStart', cmdQuickStart),
    vscode.commands.registerCommand('runenv.openHome', cmdOpenHome),
    vscode.commands.registerCommand('runenv.login', cmdLogin),
    vscode.commands.registerCommand('runenv.logout', cmdLogout),
    vscode.commands.registerCommand('runenv.init', cmdInit),
    vscode.commands.registerCommand('runenv.loadSecrets', cmdLoadSecrets),
    vscode.commands.registerCommand('runenv.run', cmdRun),
    vscode.commands.registerCommand('runenv.openTerminal', cmdOpenTerminal),
    vscode.commands.registerCommand('runenv.switchEnv', cmdSwitchEnv),
    vscode.commands.registerCommand('runenv.viewSecrets', cmdViewSecrets),
    vscode.commands.registerCommand('runenv.unload', cmdUnload),
    vscode.commands.registerCommand('runenv.wrapScripts', cmdWrapScripts),
    vscode.commands.registerCommand('runenv.importEnv', cmdImportEnv),
    vscode.commands.registerCommand('runenv.generateDotenv', cmdGenerateDotenv),
    vscode.commands.registerCommand(
      'runenv.applyRecommendedPreset',
      cmdApplyRecommendedPreset
    ),
    vscode.commands.registerCommand(
      'runenv.openProjectConfig',
      cmdOpenProjectConfig
    ),
    vscode.commands.registerCommand(
      'runenv.openRecentAction',
      cmdOpenRecentAction
    ),
    vscode.commands.registerCommand('runenv.openReadme', cmdOpenReadme),
    vscode.commands.registerCommand('runenv.doctor', cmdDoctor),
    vscode.commands.registerCommand('runenv.smokeChecklist', cmdSmokeChecklist),
    vscode.commands.registerCommand('runenv.openDashboard', cmdOpenDashboard),
    vscode.commands.registerCommand('runenv.openSettings', cmdOpenSettings),
    vscode.commands.registerCommand(
      'runenv.setupFlutterDebug',
      cmdSetupFlutterDebug
    ),
    vscode.commands.registerCommand('runenv.status', cmdStatus)
  )

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateActiveEditorContext)
  )
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(updateActiveEditorContext)
  )

  const watcher = vscode.workspace.createFileSystemWatcher('**/.runenv.json')
  watcher.onDidChange(() => void onConfigFileChanged())
  watcher.onDidCreate(() => void onConfigFileChanged())
  watcher.onDidDelete(() => {
    clearSecretsFromTerminals()
    updateStatusBar()
  })
  context.subscriptions.push(watcher)

  const token = getToken()
  const project = loadProjectConfig()
  if (!token || !project) {
    clearRunenvEnvironmentCollection(context.environmentVariableCollection)
  }
  if (token && project) {
    void loadSecretsWithSpinner(token, project.project, project.env)
    return
  }

  updateStatusBar()
  refreshTreeView()
  updateActiveEditorContext()

  const welcomed = context.globalState.get<boolean>('runenv.welcomed')
  if (!welcomed && !token) {
    const openHomeLabel = vscode.l10n.t('Open Home')
    const quickStartLabel = vscode.l10n.t('Quick Start')
    const openReadmeLabel = vscode.l10n.t('Open README')
    void context.globalState.update('runenv.welcomed', true)
    void vscode.window
      .showInformationMessage(
        vscode.l10n.t(
          'RunEnv keeps secret values out of files. Connect this folder to get started.'
        ),
        openHomeLabel,
        quickStartLabel,
        openReadmeLabel
      )
      .then(async (action) => {
        if (action === openHomeLabel) await cmdOpenHome()
        if (action === quickStartLabel) await cmdQuickStart()
        if (action === openReadmeLabel) {
          await cmdOpenReadme()
        }
      })
  }
}

export function deactivate() {
  stopRefreshTimer()
  if (extensionContext) {
    clearRunenvEnvironmentCollection(extensionContext.environmentVariableCollection)
  }
  statusBarItem?.dispose()
}
