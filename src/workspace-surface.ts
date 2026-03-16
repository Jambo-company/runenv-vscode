import * as path from 'path'
import {
  getEnvFilePreset,
} from './env-files'
import { getSetupSummary } from './setup-progress'
import {
  getWorkspaceInsights,
} from './workspace-insights'
import {
  getHighlightedAdvancedActions,
} from './workspace-advanced-actions'
import {
  getPresetRecommendation,
  getRecommendedMenuAction,
  getWorkspaceEnvFileGuidance,
  isWorkspaceSetupIncomplete,
} from './workspace-recommendations'
import {
  type WorkspaceSurfaceState,
  type WorkspaceSurfaceStateInput,
} from './workspace-surface-types'

export function buildWorkspaceSurfaceState(
  input: WorkspaceSurfaceStateInput
): WorkspaceSurfaceState {
  const insights = getWorkspaceInsights({
    workspaceRoot: input.workspaceRoot,
    environmentName: input.project?.env || 'development',
  })
  const envGuidance = getWorkspaceEnvFileGuidance(input.project, insights)
  const presetRecommendation = getPresetRecommendation(envGuidance)
  const setupIncomplete = isWorkspaceSetupIncomplete({
    workspaceRoot: insights.workspaceRoot,
    loggedIn: input.loggedIn,
    projectConfigured: Boolean(input.project),
    sessionLoaded: input.sessionLoaded,
  })

  return {
    project: input.project || null,
    insights,
    secretsLoaded: input.sessionLoaded,
    envGuidance,
    presetRecommendation,
    setupSummary: getSetupSummary({
      workspaceOpen: Boolean(insights.workspaceRoot),
      workspaceName: insights.workspaceRoot
        ? path.basename(insights.workspaceRoot)
        : null,
      loggedIn: input.loggedIn,
      email: input.email || null,
      projectName: input.project?.project || null,
      envName: input.project?.env || null,
      secretsLoaded: input.sessionLoaded,
      loadedSecretCount: input.loadedSecretCount,
      envFileCount: insights.envFiles.length,
    }),
    nextStep: getRecommendedMenuAction({
      issue: input.issue || null,
      workspaceRoot: insights.workspaceRoot,
      loggedIn: input.loggedIn,
      projectConfigured: Boolean(input.project),
      sessionLoaded: input.sessionLoaded,
      envFileCount: insights.envFiles.length,
      packageScriptCount: insights.packageScriptCount,
    }),
    setupIncomplete,
    presetTitle: input.project
      ? getEnvFilePreset(input.project.preset).title
      : null,
    highlightedAdvancedActions: getHighlightedAdvancedActions({
      workspaceRoot: insights.workspaceRoot,
      loggedIn: input.loggedIn,
      projectConfigured: Boolean(input.project),
      setupIncomplete,
      insights,
    }),
  }
}
