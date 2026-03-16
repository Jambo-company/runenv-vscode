import { type EnvFileGuidance } from './env-file-guidance'
import { type EnvFilePresetId } from './env-files'
import { getSetupSummary } from './setup-progress'
import { type WorkspaceInsights } from './workspace-insights'

export interface PresetRecommendation {
  targetTitle: string
  detail: string
}

export interface RecommendedMenuAction {
  commandId: string
  label: string
  description: string
}

export interface RecommendedMenuActionInput {
  issue?:
    | {
        detail: string
        command?: {
          id: string
          title: string
        }
      }
    | null
  workspaceRoot: string | null
  loggedIn: boolean
  projectConfigured: boolean
  sessionLoaded: boolean
  envFileCount: number
  packageScriptCount: number
}

export type WorkspaceSurfaceAdvancedActionId =
  | 'generateDotenv'
  | 'setupFlutterDebug'
  | 'wrapScripts'
  | 'smokeChecklist'

export interface WorkspaceSurfaceAdvancedAction {
  id: WorkspaceSurfaceAdvancedActionId
  label: string
  description: string
  iconId: string
}

export interface WorkspaceSurfaceStateInput {
  project?: {
    project: string
    env: string
    preset?: EnvFilePresetId | null
  } | null
  workspaceRoot: string | null
  loggedIn: boolean
  email?: string | null
  issue?:
    | {
        detail: string
        command?: {
          id: string
          title: string
        }
      }
    | null
  sessionLoaded: boolean
  loadedSecretCount: number
}

export interface WorkspaceSurfaceState {
  project: WorkspaceSurfaceStateInput['project']
  insights: WorkspaceInsights
  secretsLoaded: boolean
  envGuidance: EnvFileGuidance | null
  presetRecommendation: PresetRecommendation | null
  setupSummary: ReturnType<typeof getSetupSummary>
  nextStep: RecommendedMenuAction
  setupIncomplete: boolean
  presetTitle: string | null
  highlightedAdvancedActions: WorkspaceSurfaceAdvancedAction[]
}
