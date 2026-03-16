import * as vscode from 'vscode'
import { buildPresetUpdateCompletionItems } from '../action-pickers'
import {
  getApiUrl,
  getEmail,
  getToken,
  loadProjectConfig,
  loadRawProjectConfig,
  saveProjectConfig,
} from '../config'
import { getEnvFilePreset } from '../env-files'
import { getExtensionState } from '../core/extension-state'
import { updateStatusBar } from '../core/status-bar'
import { showMarkdownDocument } from '../markdown-documents'
import {
  buildDoctorReport,
} from '../doctor-report'
import {
  buildDoctorFollowUpActions,
} from '../workspace-ux'
import {
  getProjectConfigDiagnostics,
  getWorkspaceEnvFileGuidance,
} from '../workspace-context'
import { buildSmokeChecklist } from '../smoke-checklist'
import { buildWorkspaceActionItems } from '../workspace-actions'
import {
  buildPresetUpdateResultContent,
} from '../preview'

async function showPresetUpdateCompletionPicker() {
  const picked = await vscode.window.showQuickPick(
    buildPresetUpdateCompletionItems(),
    {
      placeHolder: vscode.l10n.t(
        'Preset updated. What do you want to do next?'
      ),
    }
  )
  if (!picked) return

  switch (picked.action) {
    case 'importEnv':
      await vscode.commands.executeCommand('runenv.importEnv')
      return
    case 'generateDotenv':
      await vscode.commands.executeCommand('runenv.generateDotenv')
      return
    case 'openConfig':
      await vscode.commands.executeCommand('runenv.openProjectConfig')
      return
  }
}

export async function cmdSmokeChecklist() {
  const { getWorkspaceSurfaceState } = getExtensionState()
  const project = loadProjectConfig()
  const surface = getWorkspaceSurfaceState(project)

  await showMarkdownDocument(
    buildSmokeChecklist({
      generatedAt: new Date().toLocaleString(),
      apiUrl: getApiUrl(),
      workspaceRoot: surface.insights.workspaceRoot,
      loggedIn: Boolean(getToken()),
      projectName: project?.project || null,
      envName: project?.env || null,
      presetTitle: surface.presetTitle,
      secretsLoaded: surface.secretsLoaded,
      envFiles: surface.insights.envFiles.map((file) => file.name),
      hasProjectConfig: surface.insights.hasProjectConfig,
      hasPresetRecommendation: Boolean(surface.presetRecommendation),
    }),
    false
  )
}

export async function cmdDoctor() {
  const { session, getRecentActions, getWorkspaceSurfaceState } =
    getExtensionState()
  const surface = getWorkspaceSurfaceState()

  await showMarkdownDocument(
    buildDoctorReport({
      generatedAt: new Date().toLocaleString(),
      apiUrl: getApiUrl(),
      workspaceRoot: surface.insights.workspaceRoot,
      configPresent: surface.insights.hasProjectConfig,
      configDiagnostics: getProjectConfigDiagnostics(surface.insights.workspaceRoot),
      envGuidance: surface.envGuidance?.lines || [],
      presetRecommendation: surface.presetRecommendation
        ? {
            title: vscode.l10n.t(
              'Switch to {0}',
              surface.presetRecommendation.targetTitle
            ),
            detail: surface.presetRecommendation.detail,
          }
        : null,
      loggedIn: Boolean(getToken()),
      email: getEmail(),
      projectName: surface.project?.project || null,
      envName: surface.project?.env || null,
      presetTitle: surface.presetTitle,
      secretsLoaded: surface.secretsLoaded,
      loadedSecretCount: session.loadedSecretCount,
      lastRefreshTime: session.lastRefreshTime?.toLocaleTimeString() || null,
      setupSummaryLabel: surface.setupSummary.label,
      setupSummaryDetail: surface.setupSummary.detail,
      envFiles: surface.insights.envFiles.map((file) => file.name),
      packageScriptCount: surface.insights.packageScriptCount,
      issue: session.issue
        ? {
            title: session.issue.title,
            detail: session.issue.detail,
            actionTitle: session.issue.command?.title || null,
          }
        : null,
      recentActions: getRecentActions(),
      nextStepLabel: surface.nextStep.label,
      nextStepDescription: surface.nextStep.description,
    }),
    false
  )

  const picked = await vscode.window.showQuickPick(
    buildDoctorFollowUpActions({
      presetRecommendation: surface.presetRecommendation
        ? {
            title: surface.presetRecommendation.targetTitle,
            description: surface.presetRecommendation.detail,
          }
        : null,
      issue: session.issue
        ? {
            detail: session.issue.detail,
            commandId: session.issue.command?.id || null,
            commandTitle: session.issue.command?.title || null,
          }
        : null,
      nextStepLabel: surface.nextStep.label,
      nextStepDescription: surface.nextStep.description,
      nextStepCommandId: surface.nextStep.commandId,
      loggedIn: Boolean(getToken()),
      setupIncomplete: surface.setupIncomplete,
    }).map((item) => ({
      label: item.label,
      description: item.description,
      commandId: item.commandId,
    })),
    {
      placeHolder: vscode.l10n.t(
        'Doctor: choose a follow-up action for this workspace'
      ),
    }
  )

  if (picked?.commandId) {
    await vscode.commands.executeCommand(picked.commandId)
  }
}

export async function cmdStatus() {
  const { session, getWorkspaceSurfaceState } = getExtensionState()
  const surface = getWorkspaceSurfaceState()
  const items = buildWorkspaceActionItems({
    loggedIn: Boolean(getToken()),
    email: getEmail(),
    apiUrl: getApiUrl(),
    surface,
    issue: session.issue,
  }).map((item) =>
    item.separator
      ? { label: '', kind: vscode.QuickPickItemKind.Separator }
      : item
  )

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: vscode.l10n.t('RunEnv'),
  })

  if (!picked) return

  const commandId =
    'commandId' in picked && typeof picked.commandId === 'string'
      ? picked.commandId
      : null
  if (commandId) {
    await vscode.commands.executeCommand(commandId)
  }
}

export async function cmdApplyRecommendedPreset() {
  const {
    recordRecentAction,
    clearLastIssue,
    setLastIssue,
    getWorkspaceInsights,
  } = getExtensionState()
  const project = loadProjectConfig()
  if (!project) {
    vscode.window.showErrorMessage(
      vscode.l10n.t('This folder is not connected to a RunEnv project yet.')
    )
    return
  }

  const insights = getWorkspaceInsights(project)
  if (!insights.workspaceRoot) {
    vscode.window.showErrorMessage(
      vscode.l10n.t('Open a workspace folder first.')
    )
    return
  }

  const guidance = getWorkspaceEnvFileGuidance(project, insights)
  if (
    !guidance?.recommendedPresetId ||
    guidance.recommendedPresetId === guidance.configuredPresetId
  ) {
    vscode.window.showInformationMessage(
      vscode.l10n.t('The current preset already matches the detected env files.')
    )
    return
  }

  saveProjectConfig(
    insights.workspaceRoot,
    {
      project: project.project,
      env: project.env,
      preset: guidance.recommendedPresetId,
    },
    loadRawProjectConfig(insights.workspaceRoot)
  )

  const summary = buildPresetUpdateResultContent({
    project: project.project,
    env: project.env,
    previousPresetTitle: guidance.configuredPresetTitle,
    currentPresetTitle:
      guidance.recommendedPresetTitle ||
      getEnvFilePreset(guidance.recommendedPresetId).title,
    matches: guidance.matches,
    recommendedGenerateFilename: guidance.recommendedGenerateFilename,
    recommendedTemplateFilename: guidance.recommendedTemplateFilename,
  })

  await recordRecentAction(
    'Switch Preset',
    `${guidance.configuredPresetTitle} -> ${
      guidance.recommendedPresetTitle ||
      getEnvFilePreset(guidance.recommendedPresetId).title
    }`,
    'success',
    'runenv.applyRecommendedPreset',
    summary
  )

  clearLastIssue()
  setLastIssue(null)
  updateStatusBar()

  await showMarkdownDocument(summary, false)
  vscode.window.showInformationMessage(
    vscode.l10n.t(
      'This folder now uses {0} for env file mapping.',
      guidance.recommendedPresetTitle ||
        getEnvFilePreset(guidance.recommendedPresetId).title
    )
  )
  await showPresetUpdateCompletionPicker()
}
