import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { isEnvFilePresetId, type EnvFilePresetId } from './env-files'

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000  // Refresh 5 min before expiry

const CONFIG_DIR = path.join(os.homedir(), '.runenv')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')
const DEFAULT_API_URL = 'https://runenv.dev'

export interface RunenvConfig {
  apiUrl: string
  token?: string
  email?: string
  expiresAt?: string
}

export interface ProjectConfig {
  project: string
  env: string
  preset?: EnvFilePresetId
}

export interface ProjectConfigContext extends ProjectConfig {
  workspaceRoot: string
}

export function getApiUrl(): string {
  const workspaceConfig = vscode.workspace.getConfiguration('runenv')
  const configuredApiUrl = workspaceConfig.get<string>('apiUrl')
  const url = configuredApiUrl || loadCliConfig().apiUrl || DEFAULT_API_URL

  // Warn if production URL is not HTTPS
  if (
    url !== DEFAULT_API_URL &&
    !url.startsWith('https://') &&
    !url.includes('localhost') &&
    !url.includes('127.0.0.1')
  ) {
    console.warn(
      '[RunEnv] WARNING: API URL is not HTTPS. Secrets may be transmitted insecurely:',
      url.replace(/\/\/.*@/, '//<redacted>@')
    )
  }

  return url
}

export function loadCliConfig(): RunenvConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8')
      return JSON.parse(raw)
    }
  } catch {
    // Ignore parse errors
  }
  return { apiUrl: DEFAULT_API_URL }
}

export function saveCliConfig(updates: Partial<RunenvConfig>): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 })
  }
  const current = loadCliConfig()
  const merged = { ...current, ...updates }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), {
    mode: 0o600,
  })
}

/** Check config file permissions are not world-readable */
export function validateConfigPermissions(): void {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return
    const stat = fs.statSync(CONFIG_FILE)
    const mode = stat.mode & 0o777
    // Warn if group or other have read access
    if (mode & 0o044) {
      console.warn(
        `[RunEnv] WARNING: ${CONFIG_FILE} is readable by other users (mode: ${mode.toString(8)}). ` +
        `Run: chmod 600 ${CONFIG_FILE}`
      )
    }
  } catch {
    // Ignore — permission check failure is not critical
  }
}

export function clearToken(): void {
  const config = loadCliConfig()
  delete config.token
  delete config.email
  delete config.expiresAt
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
    mode: 0o600,
  })
}

export function getToken(): string | undefined {
  validateConfigPermissions()
  const config = loadCliConfig()
  if (!config.token) return undefined
  if (config.expiresAt) {
    const expiry = new Date(config.expiresAt)
    const bufferExpiry = new Date(expiry.getTime() - TOKEN_EXPIRY_BUFFER_MS)
    if (bufferExpiry < new Date()) {
      // Token is expired or within 5-min buffer — treat as expired
      clearToken()
      return undefined
    }
  }
  return config.token
}

export function getEmail(): string | undefined {
  return loadCliConfig().email
}

export function getProjectConfigPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, '.runenv.json')
}

export function saveProjectConfig(
  workspaceRoot: string,
  config: ProjectConfig,
  existing: Record<string, unknown> = {}
): void {
  fs.writeFileSync(
    getProjectConfigPath(workspaceRoot),
    JSON.stringify({ ...existing, ...config }, null, 2) + '\n'
  )
}

export function getDefaultWorkspaceRoot(): string | null {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders || workspaceFolders.length === 0) return null

  return workspaceFolders[0]?.uri.fsPath || null
}

export function loadProjectConfigContext(): ProjectConfigContext | null {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders || workspaceFolders.length === 0) return null

  for (const folder of workspaceFolders) {
    const configPath = getProjectConfigPath(folder.uri.fsPath)
    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, 'utf-8')
        const parsed = JSON.parse(raw)
        return {
          workspaceRoot: folder.uri.fsPath,
          project: parsed.project || '',
          env: parsed.env || 'development',
          preset: isEnvFilePresetId(parsed.preset) ? parsed.preset : undefined,
        }
      } catch {
        // Ignore
      }
    }
  }
  return null
}

export function getProjectWorkspaceRoot(): string | null {
  return loadProjectConfigContext()?.workspaceRoot || getDefaultWorkspaceRoot()
}

export function loadProjectConfig(): ProjectConfig | null {
  const context = loadProjectConfigContext()
  if (!context) return null

  return {
    project: context.project,
    env: context.env,
    preset: context.preset,
  }
}

export function loadRawProjectConfig(
  workspaceRoot: string
): Record<string, unknown> {
  try {
    const raw = fs.readFileSync(getProjectConfigPath(workspaceRoot), 'utf-8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}
