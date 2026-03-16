import * as vscode from 'vscode'
import {
  appendWorkspaceFooterActions,
  buildConfiguredWorkspaceActions,
  buildUnconfiguredWorkspaceActions,
} from './workspace-action-sections'
import {
  createSeparator,
  type WorkspaceActionDescriptor,
} from './workspace-action-utils'
import {
  type WorkspaceSurfaceState,
} from './workspace-context'

export type { WorkspaceActionDescriptor } from './workspace-action-utils'

export function buildWorkspaceActionItems(input: {
  loggedIn: boolean
  email?: string | null
  apiUrl: string
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
}): WorkspaceActionDescriptor[] {
  const items: WorkspaceActionDescriptor[] = []
  const seen = new Set<string>()
  const project = input.surface.project

  if (input.loggedIn && input.email) {
    items.push({
      label: `$(person) ${input.email}`,
      description: vscode.l10n.t('Logged in'),
      detail: vscode.l10n.t('Server: {0}', input.apiUrl),
    })
  } else {
    items.push({
      label: vscode.l10n.t('$(key) Not logged in'),
      description: vscode.l10n.t('Quick Start'),
      detail: vscode.l10n.t(
        'Use Home or Quick Start to authenticate and connect this workspace.'
      ),
    })
  }

  items.push(createSeparator())

  if (project) {
    items.push({
      label: `$(file-directory) ${project.project}`,
      description: `${project.env} · ${
        input.surface.presetTitle || vscode.l10n.t('Preset not set')
      }`,
    })
    items.push(createSeparator())
    buildConfiguredWorkspaceActions({
      surface: input.surface,
      issue: input.issue,
      items,
      seen,
    })
  } else {
    buildUnconfiguredWorkspaceActions({
      loggedIn: input.loggedIn,
      issue: input.issue,
      items,
      seen,
    })
  }

  if (input.loggedIn) {
    items.push(createSeparator())
  }

  appendWorkspaceFooterActions({
    loggedIn: input.loggedIn,
    items,
    seen,
  })

  return items
}
