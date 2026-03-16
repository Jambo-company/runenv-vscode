import * as path from 'path'
import * as vscode from 'vscode'
import { type WorkspaceSurfaceAdvancedAction } from './workspace-context'

export interface RunenvHomeState {
  loggedIn: boolean
  email?: string
  apiUrl: string
  workspaceOpen: boolean
  project?: {
    name: string
    env: string
    presetTitle?: string
  } | null
  workspace?: {
    rootPath?: string | null
    envFiles: Array<{
      name: string
      fullPath: string
    }>
    packageScriptCount: number
    configPath?: string | null
  } | null
  secretsLoaded: boolean
  loadedSecretCount: number
  lastRefreshTime: Date | null
  recentActions?: Array<{
    label: string
    detail: string
    timestamp: string
    status: 'success' | 'error' | 'info'
    commandId?: string
  }>
  nextStep?:
    | {
        label: string
        description: string
        commandId: string
      }
    | null
  setupIncomplete?: boolean
  presetRecommendation?:
    | {
        targetTitle: string
        detail: string
      }
    | null
  highlightedAdvancedActions?: WorkspaceSurfaceAdvancedAction[]
  issue?:
    | {
        title: string
        detail: string
        command?: {
          id: string
          title: string
        }
      }
    | null
}

export type HomeSectionId =
  | 'status'
  | 'actions'
  | 'troubleshooting'
  | 'progress'
  | 'recent'
  | 'files'
  | 'advanced'

export type HomeItemKind = 'section' | 'status' | 'action' | 'warning'

export type RecommendedAction = {
  label: string
  description: string
  command: vscode.Command
}

export type ConnectionStatus = {
  label: string
  description: string
  command?: vscode.Command
}

export class HomeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
    public readonly itemKind: HomeItemKind = 'status',
    public readonly sectionId?: HomeSectionId,
    public readonly iconId?: string,
    public readonly tooltipText?: string
  ) {
    super(label, collapsibleState)
    this.description = description
    this.tooltip = tooltipText || description

    if (itemKind === 'section') {
      this.iconPath = new vscode.ThemeIcon('list-tree')
      this.contextValue = 'section'
      return
    }

    this.contextValue = itemKind
    this.iconPath = new vscode.ThemeIcon(
      iconId ||
        (itemKind === 'action'
          ? 'play-circle'
          : itemKind === 'warning'
            ? 'warning'
            : 'info')
    )
  }
}

export function createSection(
  label: string,
  sectionId: HomeSectionId,
  collapsibleState = vscode.TreeItemCollapsibleState.Expanded
) {
  return new HomeItem(
    label,
    '',
    collapsibleState,
    undefined,
    'section',
    sectionId
  )
}

export function createCommand(
  command: string,
  title: string,
  args?: unknown[]
): vscode.Command {
  return args ? { command, title, arguments: args } : { command, title }
}

export function createActionItem(
  label: string,
  description: string,
  command: string,
  title: string,
  iconId?: string,
  tooltipText?: string
) {
  return new HomeItem(
    label,
    description,
    vscode.TreeItemCollapsibleState.None,
    createCommand(command, title),
    'action',
    undefined,
    iconId,
    tooltipText
  )
}

export function getWorkspaceLabel(state: RunenvHomeState) {
  return state.workspace?.rootPath
    ? path.basename(state.workspace.rootPath)
    : vscode.l10n.t('Workspace')
}
