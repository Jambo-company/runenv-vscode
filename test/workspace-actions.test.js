const { installVscodeMock } = require('./helpers/vscode-mock')
installVscodeMock()

const test = require('node:test')
const assert = require('node:assert/strict')

const { buildWorkspaceActionItems } = require('../dist/workspace-actions.js')

test('workspace actions dedupe next action against repeated core action', () => {
  const items = buildWorkspaceActionItems({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    surface: {
      project: {
        project: 'demo',
        env: 'development',
        preset: 'nextjs',
      },
      insights: {
        workspaceRoot: '/tmp/demo',
        envFiles: [],
        packageScriptCount: 0,
        hasPackageJson: true,
        hasProjectConfig: true,
        hasFlutterProject: false,
        hasFlutterEnvAsset: false,
      },
      secretsLoaded: true,
      envGuidance: null,
      presetRecommendation: null,
      setupSummary: {
        label: 'Setup: complete',
        detail: 'Ready',
      },
      nextStep: {
        label: 'Open Terminal',
        description: 'Start working with secrets already active in this window.',
        commandId: 'runenv.openTerminal',
      },
      setupIncomplete: false,
      presetTitle: 'Next.js',
      highlightedAdvancedActions: [],
    },
    issue: null,
  })

  const openTerminalItems = items.filter((item) => item.commandId === 'runenv.openTerminal')
  assert.equal(openTerminalItems.length, 1)
  assert.match(openTerminalItems[0].label, /Open Terminal/)
})

test('workspace actions surface selected advanced actions for configured workspaces', () => {
  const items = buildWorkspaceActionItems({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    surface: {
      project: {
        project: 'demo',
        env: 'development',
        preset: 'nextjs',
      },
      insights: {
        workspaceRoot: '/tmp/demo',
        envFiles: [],
        packageScriptCount: 1,
        hasPackageJson: true,
        hasProjectConfig: true,
        hasFlutterProject: true,
        hasFlutterEnvAsset: true,
      },
      secretsLoaded: true,
      envGuidance: null,
      presetRecommendation: null,
      setupSummary: {
        label: 'Setup: complete',
        detail: 'Ready',
      },
      nextStep: {
        label: 'Run Script',
        description: 'Choose a package.json script with secrets already active.',
      },
      setupIncomplete: false,
      presetTitle: 'Next.js',
      highlightedAdvancedActions: [
        {
          id: 'generateDotenv',
          label: 'Generate .env File',
          description: 'Create a local env file for tools that still need one on disk.',
          iconId: 'file-code',
        },
        {
          id: 'setupFlutterDebug',
          label: 'Setup Flutter Debug (F5)',
          description: 'Prepare launch/tasks for Flutter projects that need `.env` during debug.',
          iconId: 'debug-alt',
        },
      ],
    },
    issue: null,
  })

  assert.ok(items.some((item) => item.commandId === 'runenv.generateDotenv'))
  assert.ok(items.some((item) => item.commandId === 'runenv.setupFlutterDebug'))
})

test('workspace actions keep ops items in a trailing operations group', () => {
  const items = buildWorkspaceActionItems({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    surface: {
      project: null,
      insights: {
        workspaceRoot: '/tmp/demo',
        envFiles: [],
        packageScriptCount: 0,
        hasPackageJson: false,
        hasProjectConfig: false,
        hasFlutterProject: false,
        hasFlutterEnvAsset: false,
      },
      secretsLoaded: false,
      envGuidance: null,
      presetRecommendation: null,
      setupSummary: {
        label: 'Setup: incomplete',
        detail: 'Login required',
      },
      nextStep: {
        label: 'Login',
        description: 'Authenticate before this workspace can connect to RunEnv.',
      },
      setupIncomplete: true,
      presetTitle: null,
      highlightedAdvancedActions: [],
    },
    issue: null,
  })

  const dashboardIndex = items.findIndex((item) => item.commandId === 'runenv.openDashboard')
  const settingsIndex = items.findIndex((item) => item.commandId === 'runenv.openSettings')
  const logoutIndex = items.findIndex((item) => item.commandId === 'runenv.logout')
  const separatorBeforeOps = items.findIndex(
    (item, index) => item.separator && index < dashboardIndex && index < settingsIndex
  )

  assert.ok(separatorBeforeOps >= 0)
  assert.ok(dashboardIndex > separatorBeforeOps)
  assert.ok(settingsIndex > separatorBeforeOps)
  assert.ok(logoutIndex > separatorBeforeOps)
})
