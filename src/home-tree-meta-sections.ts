import * as vscode from 'vscode'
import {
  type HomeSectionId,
  type RunenvHomeState,
  HomeItem,
  createActionItem,
  createSection,
} from './home-tree-model'
import { buildActionItems } from './home-tree-action-items'
import {
  buildFileItems,
  buildProgressItems,
  buildRecentItems,
  buildStatusItems,
  buildTroubleshootingItems,
} from './home-tree-structured-sections'

const advancedActionDefs: Array<{
  label: string
  desc: string
  command: string
  icon: string
}> = [
  { label: 'Generate .env File', desc: 'Create a local file for tools that still need one', command: 'runenv.generateDotenv', icon: 'file-code' },
  { label: 'Open README', desc: 'Read extension docs and usage notes in the editor', command: 'runenv.openReadme', icon: 'book' },
  { label: 'Smoke Test Checklist', desc: 'Open a manual verification checklist for this workspace', command: 'runenv.smokeChecklist', icon: 'checklist' },
  { label: 'Open Dashboard', desc: 'Open the current RunEnv server in your browser', command: 'runenv.openDashboard', icon: 'globe' },
  { label: 'Open Settings', desc: 'Review the RunEnv API URL and extension settings', command: 'runenv.openSettings', icon: 'settings-gear' },
  { label: 'Open .runenv.json', desc: 'Review the stored project, environment, and preset', command: 'runenv.openProjectConfig', icon: 'json' },
  { label: 'Wrap Scripts (CLI mode)', desc: 'Add runenv run to package.json scripts', command: 'runenv.wrapScripts', icon: 'package' },
  { label: 'Setup Flutter Debug (F5)', desc: 'Generate and clean .env files during Flutter debug sessions', command: 'runenv.setupFlutterDebug', icon: 'debug-alt' },
]

export function buildAdvancedItems(state: RunenvHomeState): HomeItem[] {
  if (!state.loggedIn) {
    return []
  }

  const items: HomeItem[] = [
    new HomeItem(
      vscode.l10n.t('Account: {0}', state.email || vscode.l10n.t('unknown')),
      vscode.l10n.t('Signed in account for this VS Code window'),
      vscode.TreeItemCollapsibleState.None,
      { command: 'runenv.openDashboard', title: vscode.l10n.t('Open Dashboard') },
      'action',
      undefined,
      'person'
    ),
    new HomeItem(
      vscode.l10n.t('Server: {0}', state.apiUrl),
      vscode.l10n.t('Current RunEnv API server for this VS Code window'),
      vscode.TreeItemCollapsibleState.None,
      { command: 'runenv.openSettings', title: vscode.l10n.t('Open Settings') },
      'action',
      undefined,
      'server'
    ),
    ...advancedActionDefs.map((d) =>
      createActionItem(vscode.l10n.t(d.label), vscode.l10n.t(d.desc), d.command, vscode.l10n.t(d.label), d.icon)
    ),
  ]

  if (state.secretsLoaded) {
    items.push(
      createActionItem(
        vscode.l10n.t('Unload Secrets'),
        vscode.l10n.t('Remove RunEnv values from terminals in this window'),
        'runenv.unload',
        vscode.l10n.t('Unload Secrets'),
        'circle-slash'
      )
    )
  }

  items.push(
    createActionItem(
      vscode.l10n.t('Logout'),
      vscode.l10n.t('Sign out of RunEnv in VS Code'),
      'runenv.logout',
      vscode.l10n.t('Logout'),
      'sign-out'
    )
  )

  return items
}

export function buildHomeRootItems(state: RunenvHomeState): HomeItem[] {
  const progressState =
    !state.workspaceOpen || !state.loggedIn || !state.project || !state.secretsLoaded
  const sections = [
    createSection(vscode.l10n.t('Status'), 'status'),
    createSection(vscode.l10n.t('Actions'), 'actions'),
  ]

  if (state.issue) {
    sections.push(
      createSection(vscode.l10n.t('Troubleshooting'), 'troubleshooting')
    )
  }

  sections.push(
    createSection(
      vscode.l10n.t('Progress'),
      'progress',
      progressState
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed
    )
  )

  if ((state.recentActions?.length || 0) > 0) {
    sections.push(
      createSection(
        vscode.l10n.t('Recent'),
        'recent',
        vscode.TreeItemCollapsibleState.Collapsed
      )
    )
  }

  if (buildFileItems(state).length > 0) {
    sections.push(
      createSection(
        vscode.l10n.t('Files'),
        'files',
        vscode.TreeItemCollapsibleState.Collapsed
      )
    )
  }

  if (buildAdvancedItems(state).length > 0) {
    sections.push(
      createSection(
        vscode.l10n.t('Advanced'),
        'advanced',
        vscode.TreeItemCollapsibleState.Collapsed
      )
    )
  }

  return sections
}

export function buildHomeSectionItems(
  state: RunenvHomeState,
  sectionId?: HomeSectionId
): HomeItem[] {
  switch (sectionId) {
    case 'status':
      return buildStatusItems(state)
    case 'actions':
      return buildActionItems(state)
    case 'troubleshooting':
      return buildTroubleshootingItems(state)
    case 'progress':
      return buildProgressItems(state)
    case 'recent':
      return buildRecentItems(state)
    case 'files':
      return buildFileItems(state)
    case 'advanced':
      return buildAdvancedItems(state)
    default:
      return buildHomeRootItems(state)
  }
}
