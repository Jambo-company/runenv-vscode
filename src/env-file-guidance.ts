import {
  getEnvFilePreset,
  getEnvFilePresets,
  getEnvFileProfiles,
  inferEnvFileProfileIdFromFilename,
  resolveEnvFilePresetId,
  type EnvFilePresetId,
} from './env-files'

export interface EnvFileGuidance {
  configuredPresetId: EnvFilePresetId
  configuredPresetTitle: string
  recommendedPresetId: EnvFilePresetId | null
  recommendedPresetTitle: string | null
  matches: string[]
  recommendedGenerateFilename: string
  recommendedTemplateFilename: string
  lines: string[]
}

export function getEnvFileGuidance(options: {
  environmentName: string
  envFiles: string[]
  configuredPresetId?: string | null
}): EnvFileGuidance {
  const configuredPresetId = resolveEnvFilePresetId(options.configuredPresetId)
  const environmentName = options.environmentName || 'development'

  const presetScores = getEnvFilePresets().map((preset) => {
    const matches = options.envFiles
      .map((file) => {
        const profileId = inferEnvFileProfileIdFromFilename(
          environmentName,
          file,
          preset.id
        )
        if (!profileId) {
          return null
        }

        const profile = getEnvFileProfiles(environmentName, preset.id).find(
          (item) => item.id === profileId
        )

        return profile ? `${file} -> ${profile.title}` : null
      })
      .filter((value): value is string => Boolean(value))

    return {
      presetId: preset.id,
      title: preset.title,
      matches,
    }
  })

  const bestPreset =
    presetScores
      .slice()
      .sort((left, right) => {
        const scoreDelta = right.matches.length - left.matches.length
        if (scoreDelta !== 0) return scoreDelta
        return Number(right.presetId === configuredPresetId) -
          Number(left.presetId === configuredPresetId)
      })[0] || null

  const configuredPreset = getEnvFilePreset(configuredPresetId)
  const configuredProfiles = getEnvFileProfiles(environmentName, configuredPresetId)
  const hasRecommendedPreset = Boolean(bestPreset && bestPreset.matches.length > 0)
  const recommendedPresetId = hasRecommendedPreset ? bestPreset!.presetId : null
  const recommendedPreset = getEnvFilePreset(recommendedPresetId)
  const effectivePresetId = recommendedPresetId || configuredPresetId
  const effectiveProfiles = getEnvFileProfiles(environmentName, effectivePresetId)

  const lines = [`Configured preset: ${configuredPreset.title}`]

  if (bestPreset && bestPreset.matches.length > 0) {
    lines.push(
      `Detected files align best with ${bestPreset.title} (${bestPreset.matches.length} match${bestPreset.matches.length === 1 ? '' : 'es'})`
    )
    lines.push(...bestPreset.matches)
  } else {
    lines.push('Detected files do not strongly match a known preset yet')
  }

  if (recommendedPresetId && recommendedPresetId !== configuredPresetId) {
    lines.push(`Consider switching preset to ${recommendedPreset.title}`)
    lines.push(
      `Current generate target: ${
        configuredProfiles.find((profile) => profile.id === 'local')?.filename || '.env.local'
      }`
    )
  }

  lines.push(
    `Recommended generate target: ${
      effectiveProfiles.find((profile) => profile.id === 'local')?.filename || '.env.local'
    }`
  )
  lines.push(
    `Recommended template target: ${
      effectiveProfiles.find((profile) => profile.id === 'example')?.filename ||
      '.env.example'
    }`
  )

  return {
    configuredPresetId,
    configuredPresetTitle: configuredPreset.title,
    recommendedPresetId,
    recommendedPresetTitle: recommendedPresetId ? recommendedPreset.title : null,
    matches: bestPreset?.matches || [],
    recommendedGenerateFilename:
      effectiveProfiles.find((profile) => profile.id === 'local')?.filename ||
      '.env.local',
    recommendedTemplateFilename:
      effectiveProfiles.find((profile) => profile.id === 'example')?.filename ||
      '.env.example',
    lines,
  }
}

export function buildEnvFileGuidance(options: {
  environmentName: string
  envFiles: string[]
  configuredPresetId?: string | null
}) {
  return getEnvFileGuidance(options).lines
}
