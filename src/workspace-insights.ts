import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import {
  getEnvFilePresets,
  getEnvFileProfiles,
} from './env-files'
import { buildProjectConfigDiagnostics } from './project-config-check'

function getProjectConfigPath(workspaceRoot: string) {
  return path.join(workspaceRoot, '.runenv.json')
}

export interface WorkspaceInsights {
  workspaceRoot: string | null
  envFiles: Array<{ name: string; fullPath: string }>
  packageScriptCount: number
  hasPackageJson: boolean
  hasProjectConfig: boolean
  hasFlutterProject: boolean
  hasFlutterEnvAsset: boolean
}

export function readPackageScripts(workspaceRoot: string): Record<string, string> {
  try {
    const pkgPath = path.join(workspaceRoot, 'package.json')
    if (!fs.existsSync(pkgPath)) return {}
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    return pkg.scripts || {}
  } catch {
    return {}
  }
}

function hasPackageJson(workspaceRoot: string) {
  return fs.existsSync(path.join(workspaceRoot, 'package.json'))
}

function readFlutterPubspec(workspaceRoot: string) {
  try {
    const pubspecPath = path.join(workspaceRoot, 'pubspec.yaml')
    if (!fs.existsSync(pubspecPath)) {
      return null
    }

    return fs.readFileSync(pubspecPath, 'utf-8')
  } catch {
    return null
  }
}

export function collectWorkspaceEnvFiles(
  workspaceRoot: string,
  environmentName: string
): Array<{ name: string; fullPath: string }> {
  const envNames = [
    ...new Set([environmentName, 'development', 'staging', 'production']),
  ]
  const filenames = new Set<string>()

  for (const envName of envNames) {
    for (const preset of getEnvFilePresets()) {
      for (const profile of getEnvFileProfiles(envName, preset.id)) {
        if (profile.importTarget !== null) {
          filenames.add(profile.filename)
        }
      }
    }
  }

  return [...filenames]
    .map((name) => ({
      name,
      fullPath: path.join(workspaceRoot, name),
    }))
    .filter((file) => fs.existsSync(file.fullPath))
    .sort((left, right) => left.name.localeCompare(right.name))
}

export function getWorkspaceInsights(options: {
  workspaceRoot: string | null
  environmentName?: string | null
}): WorkspaceInsights {
  const environmentName = options.environmentName || 'development'
  const pubspec = options.workspaceRoot
    ? readFlutterPubspec(options.workspaceRoot)
    : null

  return {
    workspaceRoot: options.workspaceRoot,
    envFiles: options.workspaceRoot
      ? collectWorkspaceEnvFiles(options.workspaceRoot, environmentName)
      : [],
    packageScriptCount: options.workspaceRoot
      ? Object.keys(readPackageScripts(options.workspaceRoot)).length
      : 0,
    hasPackageJson: options.workspaceRoot
      ? hasPackageJson(options.workspaceRoot)
      : false,
    hasProjectConfig: options.workspaceRoot
      ? fs.existsSync(getProjectConfigPath(options.workspaceRoot))
      : false,
    hasFlutterProject: Boolean(pubspec),
    hasFlutterEnvAsset: Boolean(pubspec?.includes('.env')),
  }
}

export function getProjectConfigDiagnostics(workspaceRoot: string | null) {
  if (!workspaceRoot) {
    return [vscode.l10n.t('No workspace folder is open')]
  }

  const configPath = getProjectConfigPath(workspaceRoot)
  if (!fs.existsSync(configPath)) {
    return buildProjectConfigDiagnostics({
      exists: false,
      configPath,
    })
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8')
    return buildProjectConfigDiagnostics({
      exists: true,
      configPath,
      parsed: JSON.parse(raw),
    })
  } catch (err) {
    return buildProjectConfigDiagnostics({
      exists: true,
      configPath,
      parseError:
        err instanceof Error
          ? err.message
          : vscode.l10n.t('Unknown parse error'),
    })
  }
}
