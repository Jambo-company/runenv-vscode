import * as fs from 'fs'
import * as vscode from 'vscode'
import { buildGenerateCompletionItems } from '../action-pickers'
import { type EnvFileProfile } from '../env-files'
import { type GitignoreStatus } from '../helpers/gitignore'
import { getProfileMeaning } from '../helpers/pickers'
import { showMarkdownDocument } from '../markdown-documents'
import {
  buildGeneratePreviewContent,
  buildGenerateResultContent,
} from '../preview'

async function openFileInEditor(filePath: string) {
  const doc = await vscode.workspace.openTextDocument(filePath)
  await vscode.window.showTextDocument(doc, { preview: false })
}

export async function confirmGeneratePreview(options: {
  filename: string
  fullPath: string
  project: string
  env: string
  presetTitle: string
  profile: EnvFileProfile
  keys: string[]
}) {
  const overwrite = fs.existsSync(options.fullPath)

  await showMarkdownDocument(
    buildGeneratePreviewContent({
      filename: options.filename,
      fullPath: options.fullPath,
      project: options.project,
      env: options.env,
      presetTitle: options.presetTitle,
      profileLabel: options.profile.title,
      overwrite,
      keys: [...options.keys].sort(),
    })
  )

  const action = await vscode.window.showWarningMessage(
    overwrite
      ? vscode.l10n.t('{0} already exists. Overwrite it?', options.filename)
      : vscode.l10n.t('Create {0}?', options.filename),
    overwrite ? vscode.l10n.t('Overwrite') : vscode.l10n.t('Create'),
    vscode.l10n.t('Cancel')
  )

  return action === (overwrite ? vscode.l10n.t('Overwrite') : vscode.l10n.t('Create'))
}

export async function showGenerateCompletionPicker(options: {
  outputPath: string
  filename: string
}) {
  const picked = await vscode.window.showQuickPick(
    buildGenerateCompletionItems(options.filename),
    { placeHolder: vscode.l10n.t('File generated. What do you want to do next?') }
  )
  if (!picked) return

  switch (picked.action) {
    case 'openFile':
      await openFileInEditor(options.outputPath)
      return
    case 'openTerminal':
      await vscode.commands.executeCommand('runenv.openTerminal')
      return
    case 'openConfig':
      await vscode.commands.executeCommand('runenv.openProjectConfig')
      return
  }
}

export async function showGenerateResultSummary(options: {
  filename: string
  fullPath: string
  project: string
  env: string
  presetTitle: string
  profile: EnvFileProfile
  overwrite: boolean
  keys: string[]
  gitignoreStatus: GitignoreStatus
}) {
  await showMarkdownDocument(
    buildGenerateResultContent({
      filename: options.filename,
      fullPath: options.fullPath,
      project: options.project,
      env: options.env,
      presetTitle: options.presetTitle,
      profileLabel: options.profile.title,
      profileDescription: getProfileMeaning(options.profile),
      overwrite: options.overwrite,
      keys: [...options.keys].sort(),
      gitignoreStatus: options.gitignoreStatus,
      safeToShare: options.profile.id === 'example',
    }),
    false
  )
}
