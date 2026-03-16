import { apiRequest } from '../api'
import { getApiUrl } from '../config'
import {
  type EnvFilePresetId,
  type EnvFileProfileId,
} from '../env-files'

export interface CliProjectSummary {
  id: string
  name: string
  description?: string
  environmentCount?: number
}

export interface CliProjectsResponse {
  projects: CliProjectSummary[]
}

export interface CliEnvironmentSummary {
  name: string
  secretCount: number
}

export interface CliEnvironmentsResponse {
  environments: CliEnvironmentSummary[]
}

export interface CliSecretsResponse {
  count: number
  secrets: Record<string, string>
  blueprintKeys?: Array<{
    key: string
    description?: string | null
  }>
}

export function buildCliSecretsPath(
  project: string,
  env: string,
  options: {
    presetId?: EnvFilePresetId | null
    profileId?: EnvFileProfileId | null
    resolve?: boolean
  } = {}
): string {
  const params = new URLSearchParams({
    project,
    env,
    format: 'json',
  })

  if (options.presetId) {
    params.set('preset', options.presetId)
  }
  if (options.profileId) {
    params.set('profile', options.profileId)
  }
  if (typeof options.resolve === 'boolean') {
    params.set('resolve', String(options.resolve))
  }

  return `/api/cli/secrets?${params.toString()}`
}

export async function fetchCliSecrets(
  token: string,
  project: string,
  env: string,
  options: {
    presetId?: EnvFilePresetId | null
    profileId?: EnvFileProfileId | null
    resolve?: boolean
  } = {}
): Promise<CliSecretsResponse> {
  return apiRequest<CliSecretsResponse>(
    getApiUrl(),
    buildCliSecretsPath(project, env, options),
    {
      token,
    }
  )
}

export async function fetchCliProjects(
  token: string
): Promise<CliProjectsResponse> {
  return apiRequest<CliProjectsResponse>(getApiUrl(), '/api/cli/projects', {
    token,
  })
}

export async function fetchCliEnvironments(
  token: string,
  project: string
): Promise<CliEnvironmentsResponse> {
  return apiRequest<CliEnvironmentsResponse>(
    getApiUrl(),
    `/api/cli/environments?project=${encodeURIComponent(project)}`,
    { token }
  )
}
