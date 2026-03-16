export type WorkspacePresetId =
  | 'nextjs'
  | 'vite'
  | 'node'
  | 'flutter'
  | 'dockerCompose'
export type WorkspaceProjectType =
  | 'nextjs'
  | 'vite'
  | 'flutter'
  | 'node'
  | 'dockerCompose'
  | 'mixed'

export type WorkspacePresetDetectionSource =
  | 'config-file'
  | 'package-json'
  | 'fallback'
  | 'ambiguous'

export type WorkspacePresetDetectionScope =
  | 'current-directory'
  | 'nested-workspace'
  | 'fallback'

export interface WorkspacePresetCandidate {
  presetId: WorkspacePresetId
  reason: string
  source: 'config-file' | 'package-json'
  projectType: WorkspaceProjectType
  projectTypeLabel: string
  scope: 'nested-workspace'
  isAmbiguous: false
  candidates: []
  depth: number
}

export interface WorkspacePresetDetection {
  presetId: WorkspacePresetId
  reason: string
  source: WorkspacePresetDetectionSource
  projectType: WorkspaceProjectType
  projectTypeLabel: string
  scope: WorkspacePresetDetectionScope
  isAmbiguous: boolean
  candidates: WorkspacePresetCandidate[]
}

export function detectWorkspacePreset(
  workspaceRoot: string
): WorkspacePresetDetection
