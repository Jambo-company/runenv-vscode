import { isEnvFilePresetId } from './env-files'

export function buildProjectConfigDiagnostics(options: {
  exists: boolean
  configPath: string
  parsed?: Record<string, unknown> | null
  parseError?: string | null
}) {
  if (!options.exists) {
    return ['Missing: .runenv.json has not been created for this workspace']
  }

  const lines = [`Path: ${options.configPath}`]

  if (options.parseError) {
    lines.push(`Invalid JSON: ${options.parseError}`)
    return lines
  }

  const parsed = options.parsed || {}
  const project =
    typeof parsed.project === 'string' && parsed.project.trim().length > 0
      ? parsed.project
      : null
  const env =
    typeof parsed.env === 'string' && parsed.env.trim().length > 0
      ? parsed.env
      : null

  lines.push(project ? `project: ${project}` : 'project: missing or empty')
  lines.push(env ? `env: ${env}` : 'env: missing or empty')

  if (parsed.preset === undefined) {
    lines.push('preset: missing (defaults apply)')
  } else if (isEnvFilePresetId(String(parsed.preset))) {
    lines.push(`preset: ${String(parsed.preset)}`)
  } else {
    lines.push(`preset: invalid (${String(parsed.preset)})`)
  }

  const extraKeys = Object.keys(parsed).filter(
    (key) => !['project', 'env', 'preset'].includes(key)
  )
  if (extraKeys.length > 0) {
    lines.push(`extra fields: ${extraKeys.join(', ')}`)
  }

  return lines
}
