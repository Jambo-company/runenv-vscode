import * as fs from 'fs'
import * as path from 'path'
import { buildGeneratedDotenvContent } from 'runenv-shared/dotenv'
import * as vscode from 'vscode'
import { getProjectWorkspaceRoot, loadProjectConfigContext } from '../config'
import { getExtensionState } from '../core/extension-state'
import { ensureGitignore } from '../helpers/gitignore'
import { readJsoncObjectFromFile } from '../helpers/jsonc'
import {
  buildRunenvDotenvCleanTask,
  buildRunenvDotenvTask,
} from '../helpers/runenv-command'
import { showError } from '../helpers/error'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normalizeTasksFile(parsed: Record<string, unknown>) {
  return {
    version: typeof parsed.version === 'string' ? parsed.version : '2.0.0',
    tasks: Array.isArray(parsed.tasks)
      ? parsed.tasks.filter(isRecord)
      : ([] as Array<Record<string, unknown>>),
  }
}

function normalizeLaunchFile(parsed: Record<string, unknown>) {
  return {
    version: typeof parsed.version === 'string' ? parsed.version : '0.2.0',
    configurations: Array.isArray(parsed.configurations)
      ? parsed.configurations.filter(isRecord)
      : ([] as Array<Record<string, unknown>>),
  }
}

export async function cmdSetupFlutterDebug() {
  const { session, clearLastIssue } = getExtensionState()
  const workspaceRoot = getProjectWorkspaceRoot()
  if (!workspaceRoot) {
    vscode.window.showErrorMessage(
      vscode.l10n.t('Open a folder in VS Code first.')
    )
    return
  }

  const projectContext = loadProjectConfigContext()
  if (!projectContext) {
    const initProjectLabel = vscode.l10n.t('Init Project')
    const action = await vscode.window.showErrorMessage(
      vscode.l10n.t('This folder is not connected to a RunEnv project yet.'),
      initProjectLabel
    )
    if (action === initProjectLabel) {
      await vscode.commands.executeCommand('runenv.init')
    }
    return
  }

  const vscodePath = path.join(workspaceRoot, '.vscode')
  if (!fs.existsSync(vscodePath)) {
    fs.mkdirSync(vscodePath, { recursive: true })
  }

  try {
    const tasksPath = path.join(vscodePath, 'tasks.json')
    const runenvTask = buildRunenvDotenvTask()
    const cleanTask = buildRunenvDotenvCleanTask()

    let tasks: { version: string; tasks: Array<Record<string, unknown>> }
    if (fs.existsSync(tasksPath)) {
      tasks = normalizeTasksFile(
        readJsoncObjectFromFile<Record<string, unknown>>(tasksPath)
      )
      for (const newTask of [runenvTask, cleanTask]) {
        const idx = tasks.tasks.findIndex((task) => task.label === newTask.label)
        if (idx >= 0) {
          tasks.tasks[idx] = newTask
        } else {
          tasks.tasks.push(newTask)
        }
      }
    } else {
      tasks = { version: '2.0.0', tasks: [runenvTask, cleanTask] }
    }
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2) + '\n')

    const launchPath = path.join(vscodePath, 'launch.json')
    if (fs.existsSync(launchPath)) {
      const launch = normalizeLaunchFile(
        readJsoncObjectFromFile<Record<string, unknown>>(launchPath)
      )
      let modified = false
      for (const config of launch.configurations) {
        if (config.type === 'dart') {
          if (config.preLaunchTask !== 'runenv-dotenv') {
            config.preLaunchTask = 'runenv-dotenv'
            modified = true
          }
          if (config.postDebugTask !== 'runenv-dotenv-clean') {
            config.postDebugTask = 'runenv-dotenv-clean'
            modified = true
          }
        }
      }
      if (modified) {
        fs.writeFileSync(launchPath, JSON.stringify(launch, null, 2) + '\n')
      }
    } else {
      fs.writeFileSync(
        launchPath,
        JSON.stringify(
          {
            version: '0.2.0',
            configurations: [
              {
                name: 'Flutter (RunEnv)',
                type: 'dart',
                request: 'launch',
                preLaunchTask: 'runenv-dotenv',
                postDebugTask: 'runenv-dotenv-clean',
              },
            ],
          },
          null,
          2
        ) + '\n'
      )
    }
  } catch (err) {
    showError(vscode.l10n.t('Failed to set up Flutter debug'), err)
    return
  }

  if (Object.keys(session.loadedSecrets).length > 0) {
    await vscode.commands.executeCommand('runenv.generateDotenv')
  }

  vscode.window.showInformationMessage(
    vscode.l10n.t(
      'RunEnv: Flutter debug setup complete. Press F5 to debug with secrets. (.env auto-refreshes, auto-deletes)'
    )
  )
  clearLastIssue()
}

export function autoDetectFlutterProject() {
  const { session, clearLastIssue } = getExtensionState()
  const workspaceRoot = getProjectWorkspaceRoot()
  if (!workspaceRoot) return

  const pubspecPath = path.join(workspaceRoot, 'pubspec.yaml')
  if (!fs.existsSync(pubspecPath)) return
  if (!fs.readFileSync(pubspecPath, 'utf-8').includes('.env')) return

  const count = Object.keys(session.loadedSecrets).length
  if (count === 0) return

  fs.writeFileSync(
    path.join(workspaceRoot, '.env'),
    buildGeneratedDotenvContent({
      project: session.loadedProject,
      envName: session.loadedEnv,
      secrets: session.loadedSecrets,
      refreshCommand: 'RunEnv: Generate .env File',
      extraHeaderLines: ['# Auto-generated for Flutter .env asset'],
    }),
    { mode: 0o600 }
  )
  ensureGitignore(workspaceRoot, '.env')

  if (!fs.existsSync(path.join(workspaceRoot, '.vscode', 'tasks.json'))) {
    void vscode.commands.executeCommand('runenv.setupFlutterDebug')
  }

  vscode.window.showInformationMessage(
    vscode.l10n.t(
      'RunEnv: Detected Flutter project. Wrote {0} secret{1} to .env (F5 ready)',
      count,
      count === 1 ? '' : 's'
    )
  )
  clearLastIssue()
}
