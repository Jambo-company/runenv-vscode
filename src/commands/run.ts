import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { loadProjectConfigContext } from '../config'
import { getExtensionState } from '../core/extension-state'
import {
  getWrapScriptsPrefix,
  wrapScriptCommand,
} from '../helpers/runenv-command'
import { readPackageScripts } from '../workspace-context'

type RunPickerItem = vscode.QuickPickItem & {
  action?: 'script' | 'openShell' | 'customCommand'
  scriptName?: string
}

export function openRunenvTerminal(projectName: string) {
  const terminal = vscode.window.createTerminal({
    name: vscode.l10n.t('RunEnv: {0}', projectName),
    iconPath: new vscode.ThemeIcon('terminal'),
  })
  terminal.show()
}

export async function cmdOpenTerminal() {
  const { session, hasLoadedSession } = getExtensionState()
  const projectContext = loadProjectConfigContext()
  const project = projectContext
    ? {
        project: projectContext.project,
        env: projectContext.env,
      }
    : null

  if (!hasLoadedSession(project)) {
    await vscode.commands.executeCommand('runenv.loadSecrets')
    const refreshed = loadProjectConfigContext()
    if (
      !hasLoadedSession(
        refreshed
          ? {
              project: refreshed.project,
              env: refreshed.env,
            }
          : null
      )
    ) {
      return
    }
  }

  openRunenvTerminal(project?.project || session.loadedProject || 'RunEnv')
}

export async function cmdRun() {
  const { session, hasLoadedSession } = getExtensionState()
  const projectContext = loadProjectConfigContext()
  const project = projectContext
    ? {
        project: projectContext.project,
        env: projectContext.env,
      }
    : null

  if (!hasLoadedSession(project)) {
    await vscode.commands.executeCommand('runenv.loadSecrets')
    const refreshed = loadProjectConfigContext()
    if (
      !hasLoadedSession(
        refreshed
          ? {
              project: refreshed.project,
              env: refreshed.env,
            }
          : null
      )
    ) {
      return
    }
  }

  const activeProjectContext = loadProjectConfigContext()
  if (!activeProjectContext) return
  const { workspaceRoot, ...activeProject } = activeProjectContext

  const scripts = workspaceRoot ? readPackageScripts(workspaceRoot) : {}

  const items: RunPickerItem[] = []

  if (Object.keys(scripts).length > 0) {
    for (const [name, cmd] of Object.entries(scripts)) {
      items.push({
        label: `$(play) ${name}`,
        description: String(cmd),
        detail: vscode.l10n.t('npm run {0}', name),
        action: 'script',
        scriptName: name,
      })
    }
    items.push({ label: '', kind: vscode.QuickPickItemKind.Separator })
  }

  items.push({
    label: `$(terminal) ${vscode.l10n.t('Open shell')}`,
    description: vscode.l10n.t('Secrets are already injected'),
    action: 'openShell',
  })
  items.push({
    label: `$(pencil) ${vscode.l10n.t('Custom command...')}`,
    description: vscode.l10n.t('Type a custom command'),
    action: 'customCommand',
  })

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: vscode.l10n.t(
      'Run with {0}/{1} ({2} secrets active)',
      activeProject.project,
      activeProject.env,
      session.loadedSecretCount
    ),
  })
  if (!picked) return

  let commandToRun = ''

  if (picked.action === 'customCommand') {
    const custom = await vscode.window.showInputBox({
      placeHolder: vscode.l10n.t('npm run dev'),
      prompt: vscode.l10n.t('Enter command to run'),
    })
    if (!custom) return
    commandToRun = custom
  } else if (picked.action === 'openShell') {
    commandToRun = ''
  } else {
    commandToRun = vscode.l10n.t('npm run {0}', picked.scriptName || '')
  }

  const terminal = vscode.window.createTerminal({
    name: commandToRun
      ? vscode.l10n.t('RunEnv: {0}', commandToRun)
      : vscode.l10n.t('RunEnv: {0}', activeProject.project),
    iconPath: new vscode.ThemeIcon('cloud'),
  })

  terminal.show()
  if (commandToRun) {
    terminal.sendText(commandToRun)
  }
}

export async function cmdWrapScripts() {
  const { clearLastIssue } = getExtensionState()
  const projectContext = loadProjectConfigContext()
  if (!projectContext) {
    const initProjectLabel = vscode.l10n.t('Init Project')
    const action = await vscode.window.showErrorMessage(
      vscode.l10n.t('This folder is not connected to RunEnv yet.'),
      initProjectLabel
    )
    if (action === initProjectLabel) {
      await vscode.commands.executeCommand('runenv.init')
    }
    return
  }
  const { workspaceRoot } = projectContext

  const pkgPath = path.join(workspaceRoot, 'package.json')
  if (!fs.existsSync(pkgPath)) {
    vscode.window.showErrorMessage(
      vscode.l10n.t('This folder does not have a package.json file.')
    )
    return
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  const scripts: Record<string, string> = pkg.scripts || {}

  if (Object.keys(scripts).length === 0) {
    vscode.window.showErrorMessage(
      vscode.l10n.t(
        'This package.json file does not contain any scripts yet.'
      )
    )
    return
  }

  const prefix = getWrapScriptsPrefix()
  const items = Object.entries(scripts).map(([name, cmd]) => {
    const alreadyWrapped = cmd.startsWith('runenv run')
    return {
      label: alreadyWrapped ? `$(check) ${name}` : `$(circle-outline) ${name}`,
      description: String(cmd),
      picked: !alreadyWrapped,
      scriptName: name,
      alreadyWrapped,
    }
  })

  const unwrapped = items.filter((item) => !item.alreadyWrapped)
  if (unwrapped.length === 0) {
    vscode.window.showInformationMessage(
      vscode.l10n.t('All scripts are already wrapped with RunEnv!')
    )
    return
  }

  const picked = await vscode.window.showQuickPick(
    unwrapped.map((item) => ({
      label: item.scriptName,
      description: item.description,
      picked: true,
    })),
    {
      placeHolder: vscode.l10n.t('Select scripts to wrap with: {0}', prefix),
      canPickMany: true,
    }
  )

  if (!picked || picked.length === 0) return

  for (const item of picked) {
    const originalCmd = scripts[item.label]
    scripts[item.label] = wrapScriptCommand(String(originalCmd))
  }

  pkg.scripts = scripts
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  const names = picked.map((item) => item.label).join(', ')
  vscode.window.showInformationMessage(
    [
      vscode.l10n.t(
        'Wrapped {0} script{1}: {2}',
        picked.length,
        picked.length === 1 ? '' : 's',
        names
      ),
      vscode.l10n.t(
        'Now `npm run {0}` will auto-inject secrets via CLI.',
        picked[0].label
      ),
    ].join('\n')
  )
  clearLastIssue()
}
