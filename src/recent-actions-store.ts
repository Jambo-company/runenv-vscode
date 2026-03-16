import {
  getRecentActionsStorageKey,
  trimRecentActions,
  type RecentAction,
} from './recent-actions'

export interface RecentActionsState {
  get<T>(key: string): T | undefined
  update(key: string, value: RecentAction[]): Thenable<void> | Promise<void>
}

export function getStoredRecentActions(
  state: RecentActionsState,
  workspaceRoot: string | null
): RecentAction[] {
  const key = getRecentActionsStorageKey(workspaceRoot)
  const value = state.get<RecentAction[]>(key)
  return Array.isArray(value) ? value : []
}

export async function appendRecentAction(
  state: RecentActionsState,
  workspaceRoot: string | null,
  action: RecentAction
): Promise<RecentAction[]> {
  const key = getRecentActionsStorageKey(workspaceRoot)
  const nextActions = trimRecentActions([
    action,
    ...getStoredRecentActions(state, workspaceRoot),
  ])
  await state.update(key, nextActions)
  return nextActions
}
