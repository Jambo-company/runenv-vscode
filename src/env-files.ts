import * as path from 'path'
import { formatDotenvValue as sharedFormatDotenvValue } from 'runenv-shared/dotenv'

export const ENV_FILE_PRESET_IDS = [
  'nextjs',
  'vite',
  'node',
  'flutter',
  'dockerCompose',
] as const

export const ENV_FILE_PROFILE_IDS = [
  'base',
  'local',
  'environment',
  'environmentLocal',
  'example',
] as const

export type EnvFilePresetId = (typeof ENV_FILE_PRESET_IDS)[number]
export type EnvFileProfileId = (typeof ENV_FILE_PROFILE_IDS)[number]
export type EnvFileProfileScope = 'shared' | 'local' | 'template'

export interface EnvFilePreset {
  id: EnvFilePresetId
  title: string
  description: string
}

export interface EnvFileProfile {
  id: EnvFileProfileId
  filename: string
  scope: EnvFileProfileScope
  title: string
  description: string
  importTarget: 'secrets' | 'overrides' | null
}

export const DEFAULT_ENV_FILE_PRESET_ID: EnvFilePresetId = 'nextjs'

function normalizeEnvSegment(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-')
}

const ENV_FILE_PRESETS: Record<
  EnvFilePresetId,
  {
    title: string
    description: string
    localFilename: string
    environmentFilename: (segment: string) => string
    environmentLocalFilename: (segment: string) => string
    descriptions: Record<EnvFileProfileId, string>
  }
> = {
  nextjs: {
    title: 'Next.js',
    description:
      'Framework-style layered env files for Next.js, Remix, and similar app routers.',
    localFilename: '.env.local',
    environmentFilename: (segment) => `.env.${segment}`,
    environmentLocalFilename: (segment) => `.env.${segment}.local`,
    descriptions: {
      base: 'Shared team defaults for the selected environment.',
      local: 'Your private local overrides layered above team defaults.',
      environment:
        'Framework-specific shared values for the selected environment.',
      environmentLocal:
        'Your private environment-specific overrides for local development.',
      example: 'Key-only template for onboarding, CI, and documentation.',
    },
  },
  vite: {
    title: 'Vite',
    description:
      'Mode-based env files for Vite projects. Use this when your build uses Vite modes.',
    localFilename: '.env.local',
    environmentFilename: (segment) => `.env.${segment}`,
    environmentLocalFilename: (segment) => `.env.${segment}.local`,
    descriptions: {
      base: 'Shared defaults loaded for every Vite mode.',
      local: 'Private machine-only overrides loaded before shared mode files.',
      environment:
        'Shared mode-specific values, typically for development, staging, or production builds.',
      environmentLocal: 'Private mode-specific overrides for local Vite runs.',
      example: 'Template file for required Vite keys and onboarding.',
    },
  },
  node: {
    title: 'Node / dotenv',
    description:
      'Generic dotenv layering for Node services, workers, and scripts.',
    localFilename: '.env.local',
    environmentFilename: (segment) => `.env.${segment}`,
    environmentLocalFilename: (segment) => `.env.${segment}.local`,
    descriptions: {
      base: 'Shared base dotenv values for the selected environment.',
      local: 'Private developer overrides kept outside team-shared secrets.',
      environment:
        'Shared environment-specific dotenv file for deploy-stage overrides.',
      environmentLocal:
        'Private environment-specific overrides for local Node workflows.',
      example: 'Key-only template for commits, onboarding, and CI.',
    },
  },
  flutter: {
    title: 'Flutter',
    description:
      'Dotenv layering for Flutter apps, F5/debug sessions, and flavor-specific local runs.',
    localFilename: '.env.local',
    environmentFilename: (segment) => `.env.${segment}`,
    environmentLocalFilename: (segment) => `.env.${segment}.local`,
    descriptions: {
      base: 'Shared `.env` values loaded across Flutter local runs and debug sessions.',
      local:
        'Private machine-only Flutter overrides for local devices, emulators, and developer workflows.',
      environment:
        'Shared flavor- or environment-specific values for staging, production, and other Flutter builds.',
      environmentLocal:
        'Private flavor-specific overrides for local Flutter development.',
      example:
        'Key-only template for required Flutter dotenv entries and onboarding.',
    },
  },
  dockerCompose: {
    title: 'Docker Compose',
    description:
      'Compose-friendly env files with override layers for local container runs.',
    localFilename: '.env.override',
    environmentFilename: (segment) => `.env.${segment}`,
    environmentLocalFilename: (segment) => `.env.${segment}.override`,
    descriptions: {
      base: 'Shared Compose defaults loaded by the selected stack.',
      local: 'Your local container override file for personal machine values.',
      environment:
        'Shared environment-specific Compose values for the selected stage.',
      environmentLocal:
        'Your local environment-specific override file for Compose workflows.',
      example: 'Template file for required Compose variables and onboarding.',
    },
  },
}

export function isEnvFilePresetId(
  value: string | null | undefined
): value is EnvFilePresetId {
  return !!value && (ENV_FILE_PRESET_IDS as readonly string[]).includes(value)
}

export function resolveEnvFilePresetId(
  value: string | null | undefined,
  fallbackValue?: string | null
): EnvFilePresetId {
  if (isEnvFilePresetId(value)) {
    return value
  }

  if (isEnvFilePresetId(fallbackValue)) {
    return fallbackValue
  }

  return DEFAULT_ENV_FILE_PRESET_ID
}

export function getEnvFilePreset(
  value: string | null | undefined
): EnvFilePreset {
  const presetId = resolveEnvFilePresetId(value)
  const preset = ENV_FILE_PRESETS[presetId]

  return {
    id: presetId,
    title: preset.title,
    description: preset.description,
  }
}

export function getEnvFilePresets(): EnvFilePreset[] {
  return ENV_FILE_PRESET_IDS.map((presetId) => getEnvFilePreset(presetId))
}

export function getEnvFileProfiles(
  environmentName: string,
  presetId: EnvFilePresetId = DEFAULT_ENV_FILE_PRESET_ID
): EnvFileProfile[] {
  const segment = normalizeEnvSegment(environmentName || 'development')
  const preset = ENV_FILE_PRESETS[presetId]

  return [
    {
      id: 'base',
      filename: '.env',
      scope: 'shared',
      title: 'Base shared env',
      description: preset.descriptions.base,
      importTarget: 'secrets',
    },
    {
      id: 'local',
      filename: preset.localFilename,
      scope: 'local',
      title: 'Local override',
      description: preset.descriptions.local,
      importTarget: 'overrides',
    },
    {
      id: 'environment',
      filename: preset.environmentFilename(segment),
      scope: 'shared',
      title: `${segment} env`,
      description: preset.descriptions.environment,
      importTarget: 'secrets',
    },
    {
      id: 'environmentLocal',
      filename: preset.environmentLocalFilename(segment),
      scope: 'local',
      title: `${segment} local override`,
      description: preset.descriptions.environmentLocal,
      importTarget: 'overrides',
    },
    {
      id: 'example',
      filename: '.env.example',
      scope: 'template',
      title: 'Example template',
      description: preset.descriptions.example,
      importTarget: null,
    },
  ]
}

export function inferEnvFileProfileIdFromFilename(
  environmentName: string,
  filePath: string | null | undefined,
  presetId: EnvFilePresetId = DEFAULT_ENV_FILE_PRESET_ID
): EnvFileProfileId | null {
  if (!filePath) {
    return null
  }

  const filename = path.basename(filePath)
  return (
    getEnvFileProfiles(environmentName, presetId).find(
      (profile) => profile.filename === filename
    )?.id ?? null
  )
}

export function formatDotenvValue(value: string) {
  return sharedFormatDotenvValue(value)
}
