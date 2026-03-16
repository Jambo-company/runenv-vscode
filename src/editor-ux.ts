import * as path from 'path'
import {
  getEnvFilePresets,
  getEnvFileProfiles,
  isEnvFilePresetId,
} from './env-files'

export type RunenvEditorFileKind = 'projectConfig' | 'envFile' | 'other'

export interface ProjectConfigFileDiagnostic {
  code:
    | 'invalid-json'
    | 'invalid-shape'
    | 'missing-project'
    | 'missing-env'
    | 'invalid-preset'
    | 'unexpected-fields'
  message: string
  severity: 'error' | 'warning'
}

export function getRunenvEditorFileKind(options: {
  filePath: string | null | undefined
  environmentName?: string | null
}): RunenvEditorFileKind {
  if (!options.filePath) {
    return 'other'
  }

  const filename = path.basename(options.filePath)
  if (filename === '.runenv.json') {
    return 'projectConfig'
  }

  const environmentName = options.environmentName || 'development'
  const envNames = [...new Set([environmentName, 'development', 'staging', 'production'])]
  const knownEnvFiles = new Set<string>()

  for (const envName of envNames) {
    for (const preset of getEnvFilePresets()) {
      for (const profile of getEnvFileProfiles(envName, preset.id)) {
        knownEnvFiles.add(profile.filename)
      }
    }
  }

  return knownEnvFiles.has(filename) ? 'envFile' : 'other'
}

export function buildProjectConfigFileDiagnostics(
  raw: string
): ProjectConfigFileDiagnostic[] {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return [
      {
        code: 'invalid-json',
        message: '.runenv.json must contain valid JSON.',
        severity: 'error',
      },
    ]
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return [
      {
        code: 'invalid-shape',
        message: '.runenv.json must be a JSON object with project, env, and optional preset.',
        severity: 'error',
      },
    ]
  }

  const config = parsed as Record<string, unknown>
  const diagnostics: ProjectConfigFileDiagnostic[] = []

  if (typeof config.project !== 'string' || config.project.trim().length === 0) {
    diagnostics.push({
      code: 'missing-project',
      message: '`project` is required in .runenv.json.',
      severity: 'error',
    })
  }

  if (typeof config.env !== 'string' || config.env.trim().length === 0) {
    diagnostics.push({
      code: 'missing-env',
      message: '`env` is missing or empty. RunEnv will fall back to development.',
      severity: 'warning',
    })
  }

  if (
    config.preset != null &&
    (typeof config.preset !== 'string' || !isEnvFilePresetId(config.preset))
  ) {
    diagnostics.push({
      code: 'invalid-preset',
      message: '`preset` must be one of the supported RunEnv env file presets.',
      severity: 'warning',
    })
  }

  const allowedKeys = new Set(['project', 'env', 'preset'])
  const extraKeys = Object.keys(config).filter((key) => !allowedKeys.has(key))
  if (extraKeys.length > 0) {
    diagnostics.push({
      code: 'unexpected-fields',
      message: `Unexpected field${extraKeys.length === 1 ? '' : 's'} in .runenv.json: ${extraKeys.join(', ')}`,
      severity: 'warning',
    })
  }

  return diagnostics
}
