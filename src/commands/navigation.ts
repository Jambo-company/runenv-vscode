import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import {
  getApiUrl,
  getEmail,
  getProjectConfigPath,
  getProjectWorkspaceRoot,
  getToken,
  loadProjectConfig,
} from '../config'
import { buildRecentActionFollowUpItems } from '../action-pickers'
import { showMarkdownDocument } from '../markdown-documents'
import { buildRecentActionContent, type RecentAction } from '../recent-actions'
import { getQuickStartPlaceHolder } from '../setup-progress'
import { getExtensionState } from '../core/extension-state'

type RunenvMenuAction =
  | 'quickStart'
  | 'openHome'
  | 'status'
  | 'login'
  | 'loadSecrets'
  | 'run'
  | 'openTerminal'
  | 'viewSecrets'
  | 'switchEnv'
  | 'wrapScripts'
  | 'importEnv'
  | 'generateDotenv'
  | 'applyRecommendedPreset'
  | 'setupFlutterDebug'
  | 'openProjectConfig'
  | 'openRecentAction'
  | 'openReadme'
  | 'doctor'
  | 'smokeChecklist'
  | 'openDashboard'
  | 'openSettings'
  | 'unload'
  | 'init'
  | 'logout'
  | 'learnMore'

interface RunenvMenuItem extends vscode.QuickPickItem {
  action: RunenvMenuAction
}

const MENU_ACTION_COMMANDS: Partial<Record<RunenvMenuAction, string>> = {
  quickStart: 'runenv.quickStart',
  openHome: 'runenv.openHome',
  status: 'runenv.status',
  login: 'runenv.login',
  loadSecrets: 'runenv.loadSecrets',
  run: 'runenv.run',
  openTerminal: 'runenv.openTerminal',
  viewSecrets: 'runenv.viewSecrets',
  switchEnv: 'runenv.switchEnv',
  wrapScripts: 'runenv.wrapScripts',
  importEnv: 'runenv.importEnv',
  generateDotenv: 'runenv.generateDotenv',
  applyRecommendedPreset: 'runenv.applyRecommendedPreset',
  setupFlutterDebug: 'runenv.setupFlutterDebug',
  openProjectConfig: 'runenv.openProjectConfig',
  openReadme: 'runenv.openReadme',
  doctor: 'runenv.doctor',
  smokeChecklist: 'runenv.smokeChecklist',
  openDashboard: 'runenv.openDashboard',
  openSettings: 'runenv.openSettings',
  unload: 'runenv.unload',
  init: 'runenv.init',
  logout: 'runenv.logout',
}

async function runMenuAction(action: RunenvMenuAction | undefined) {
  if (!action || action === 'openRecentAction') {
    return
  }

  if (action === 'learnMore') {
    await vscode.env.openExternal(vscode.Uri.parse('https://runenv.dev'))
    return
  }

  const commandId = MENU_ACTION_COMMANDS[action]
  if (commandId) {
    await vscode.commands.executeCommand(commandId)
  }
}

export async function showNextStepPicker(
  project: {
    project: string
    env: string
  },
  insights: ReturnType<typeof getExtensionState>['getWorkspaceInsights'] extends (
    ...args: never[]
  ) => infer T
    ? T
    : never
) {
  const { session, hasLoadedSession } = getExtensionState()
  const items: RunenvMenuItem[] = []
  const issue = session.issue

  if (issue?.command) {
    items.push({
      label: `$(warning) ${vscode.l10n.t('Fix: {0}', issue.command.title)}`,
      description: vscode.l10n.t('Resolve the current RunEnv issue first'),
      detail: issue.detail,
      action: issue.command.id.replace('runenv.', '') as RunenvMenuAction,
    })
  }

  if (insights.envFiles.length > 0) {
    items.push({
      label: `$(file-symlink-file) ${vscode.l10n.t('Import .env File')}`,
      description: vscode.l10n.t('Recommended'),
      detail: vscode.l10n.t(
        'Detected: {0}. Upload values from an existing local file into RunEnv.',
        insights.envFiles
          .slice(0, 3)
          .map((file) => file.name)
          .join(', ')
      ),
      action: 'importEnv',
    })
  }

  items.push({
    label: `$(home) ${vscode.l10n.t('Open Home')}`,
    description: `${project.project} / ${project.env}`,
    detail: vscode.l10n.t('Open the main RunEnv sidebar for this workspace.'),
    action: 'openHome',
  })

  items.push({
    label: `$(terminal) ${vscode.l10n.t('Open a terminal')}`,
    description:
      insights.envFiles.length > 0
        ? vscode.l10n.t('Skip import for now')
        : vscode.l10n.t('Recommended'),
    detail: vscode.l10n.t(
      'Your secrets are already active in this VS Code window.'
    ),
    action: 'openTerminal',
  })

  if (insights.packageScriptCount > 0) {
    items.push({
      label: `$(play) ${vscode.l10n.t('Run Script')}`,
      description: vscode.l10n.t(
        '{0} package script{1} detected',
        insights.packageScriptCount,
        insights.packageScriptCount === 1 ? '' : 's'
      ),
      detail: vscode.l10n.t(
        'Choose a package.json script and run it with RunEnv secrets.'
      ),
      action: 'run',
    })
  }

  items.push({
    label: `$(pulse) ${vscode.l10n.t('Doctor Report')}`,
    description: vscode.l10n.t('Open a workspace health report'),
    detail: vscode.l10n.t(
      'Summarize connection, setup progress, env files, and current issues.'
    ),
    action: 'doctor',
  })

  items.push({
    label: `$(list-unordered) ${vscode.l10n.t('Open Workspace Actions')}`,
    description: `${project.project} / ${project.env}`,
    action: 'status',
  })

  const quickStartPlaceHolder = getQuickStartPlaceHolder({
    workspaceOpen: Boolean(insights.workspaceRoot),
    workspaceName: insights.workspaceRoot
      ? path.basename(insights.workspaceRoot)
      : null,
    loggedIn: Boolean(getToken()),
    email: getEmail(),
    projectName: project.project,
    envName: project.env,
    secretsLoaded: hasLoadedSession(project),
    loadedSecretCount: session.loadedSecretCount,
    envFileCount: insights.envFiles.length,
  })

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: quickStartPlaceHolder,
  })

  if (!picked) return
  await runMenuAction(picked.action)
}

export async function cmdQuickStart() {
  const { getWorkspaceInsights, hasLoadedSession, setLastIssue } =
    getExtensionState()
  const initialInsights = getWorkspaceInsights(loadProjectConfig())
  if (!initialInsights.workspaceRoot) {
    vscode.window.showErrorMessage(
      vscode.l10n.t('Open a folder in VS Code first.')
    )
    setLastIssue({
      title: vscode.l10n.t('No workspace folder'),
      detail: vscode.l10n.t('Open a project folder before using Quick Start.'),
    })
    return
  }

  if (!getToken()) {
    await vscode.commands.executeCommand('runenv.login')
    if (!getToken()) return
  }

  let project = loadProjectConfig()
  if (!project) {
    await vscode.commands.executeCommand('runenv.init', false)
    project = loadProjectConfig()
  }
  if (!project) return

  if (!hasLoadedSession(project)) {
    await vscode.commands.executeCommand('runenv.loadSecrets')
  }

  project = loadProjectConfig()
  if (project && hasLoadedSession(project)) {
    await showNextStepPicker(project, getWorkspaceInsights(project))
  }
}

export async function cmdOpenHome() {
  await vscode.commands.executeCommand('workbench.view.extension.runenv')
  await vscode.commands.executeCommand('runenvHome.focus')
}

export async function cmdOpenDashboard() {
  const dashboardUrl = new URL('/dashboard/projects', getApiUrl()).toString()
  await vscode.env.openExternal(vscode.Uri.parse(dashboardUrl))
}

export async function cmdOpenSettings() {
  await vscode.commands.executeCommand('workbench.action.openSettings', 'runenv')
}

export async function cmdOpenProjectConfig() {
  const { setLastIssue } = getExtensionState()
  const workspaceRoot = getProjectWorkspaceRoot()
  if (!workspaceRoot) {
    vscode.window.showErrorMessage(
      vscode.l10n.t('Open a folder in VS Code first.')
    )
    setLastIssue({
      title: vscode.l10n.t('No workspace folder'),
      detail: vscode.l10n.t('Open a project folder before using RunEnv.'),
    })
    return
  }

  const configPath = getProjectConfigPath(workspaceRoot)
  if (!fs.existsSync(configPath)) {
    const initProjectLabel = vscode.l10n.t('Init Project')
    const action = await vscode.window.showInformationMessage(
      vscode.l10n.t('.runenv.json does not exist in this folder yet.'),
      initProjectLabel
    )
    if (action === initProjectLabel) {
      await vscode.commands.executeCommand('runenv.init')
    }
    return
  }

  const doc = await vscode.workspace.openTextDocument(configPath)
  await vscode.window.showTextDocument(doc, { preview: true })
}

export async function cmdOpenRecentAction(action?: RecentAction) {
  if (!action) {
    return
  }

  await showMarkdownDocument(buildRecentActionContent(action))

  const picked = await vscode.window.showQuickPick(
    buildRecentActionFollowUpItems(action),
    {
      placeHolder: vscode.l10n.t('Recent action: choose what to do next'),
    }
  )

  if (picked?.commandId) {
    await vscode.commands.executeCommand(picked.commandId)
  }
}

export async function cmdOpenReadme() {
  const { context } = getExtensionState()
  const readmePath = path.join(context.extensionPath, 'README.md')
  const doc = await vscode.workspace.openTextDocument(readmePath)
  await vscode.window.showTextDocument(doc, { preview: false })
}
