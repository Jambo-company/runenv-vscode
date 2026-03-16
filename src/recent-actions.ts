export type RecentActionStatus = 'success' | 'error' | 'info'

export interface RecentAction {
  label: string
  detail: string
  timestamp: string
  status: RecentActionStatus
  commandId?: string
  summaryMarkdown?: string
}

export function getRecentActionsStorageKey(workspaceRoot: string | null) {
  return workspaceRoot
    ? `runenv.recentActions:${workspaceRoot}`
    : 'runenv.recentActions:global'
}

export function trimRecentActions(
  actions: RecentAction[],
  maxItems = 8
): RecentAction[] {
  return actions.slice(0, maxItems)
}

export function buildRecentActionContent(action: RecentAction) {
  return [
    `# ${action.label}`,
    '',
    `Status: ${action.status}`,
    `Time: ${action.timestamp}`,
    `Detail: ${action.detail}`,
    '',
    action.summaryMarkdown || 'No additional summary was recorded for this action.',
  ].join('\n')
}
