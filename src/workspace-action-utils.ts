import {
  type WorkspaceSurfaceAdvancedAction,
} from './workspace-context'

export interface WorkspaceActionDescriptor {
  label: string
  description?: string
  detail?: string
  commandId?: string
  separator?: boolean
}

export function createAction(
  label: string,
  description: string,
  commandId: string,
  detail?: string
): WorkspaceActionDescriptor {
  return {
    label,
    description,
    commandId,
    ...(detail ? { detail } : {}),
  }
}

export function createSeparator(): WorkspaceActionDescriptor {
  return { label: '', separator: true }
}

export function pushUniqueAction(
  items: WorkspaceActionDescriptor[],
  seen: Set<string>,
  item: WorkspaceActionDescriptor
) {
  if (!item.commandId) {
    items.push(item)
    return
  }

  if (seen.has(item.commandId)) {
    return
  }

  seen.add(item.commandId)
  items.push(item)
}

export function getCommandIdForHighlightedAction(
  action: WorkspaceSurfaceAdvancedAction
) {
  switch (action.id) {
    case 'generateDotenv':
      return 'runenv.generateDotenv'
    case 'setupFlutterDebug':
      return 'runenv.setupFlutterDebug'
    case 'wrapScripts':
      return 'runenv.wrapScripts'
    case 'smokeChecklist':
      return 'runenv.smokeChecklist'
  }
}
