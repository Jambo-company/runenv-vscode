const test = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')

const originalLoad = Module._load
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'vscode') {
    class EventEmitter {
      constructor() {
        this.event = () => {}
      }
      fire() {}
    }

    class TreeItem {
      constructor(label, collapsibleState) {
        this.label = label
        this.collapsibleState = collapsibleState
      }
    }

    class ThemeIcon {
      constructor(id) {
        this.id = id
      }
    }

    return {
      EventEmitter,
      TreeItem,
      ThemeIcon,
      Uri: {
        file(path) {
          return { fsPath: path }
        },
      },
      TreeItemCollapsibleState: {
        None: 0,
        Collapsed: 1,
        Expanded: 2,
      },
      l10n: {
        t(message, ...args) {
          if (args.length === 0) return message
          return args.reduce(
            (msg, arg, i) => msg.replace(`{${i}}`, String(arg)),
            message
          )
        },
      },
    }
  }

  return originalLoad(request, parent, isMain)
}

const { HomeTreeProvider } = require('../dist/home-tree.js')

function getLabels(items) {
  return items.map((item) => item.label)
}

function makeEnvFile(name) {
  return {
    name,
    fullPath: `/tmp/${name}`,
  }
}

test('home tree keeps load secrets first until setup is complete', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    workspaceOpen: true,
    project: {
      name: 'demo',
      env: 'development',
      presetTitle: 'Next.js',
    },
    workspace: {
      envFiles: [makeEnvFile('.env.local'), makeEnvFile('.env')],
      packageScriptCount: 2,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: false,
    loadedSecretCount: 0,
    lastRefreshTime: null,
    issue: null,
  })

  const sections = provider.getChildren()
  const actionsSection = sections.find((item) => item.label === 'Actions')
  const actionItems = provider.getChildren(actionsSection)

  assert.equal(actionItems[0].label, 'Load Secrets')
  assert.ok(getLabels(actionItems).includes('Import .env File'))
})

test('home tree status shows recommended next action', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    workspaceOpen: true,
    project: {
      name: 'demo',
      env: 'development',
      presetTitle: 'Next.js',
    },
    workspace: {
      envFiles: [],
      packageScriptCount: 1,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: false,
    loadedSecretCount: 0,
    lastRefreshTime: null,
    issue: null,
  })

  const sections = provider.getChildren()
  const statusSection = sections.find((item) => item.label === 'Status')
  const statusItems = provider.getChildren(statusSection)

  assert.ok(getLabels(statusItems).includes('Next: Load Secrets'))
})

test('home tree uses shared next step from workspace surface state', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    workspaceOpen: true,
    project: {
      name: 'demo',
      env: 'development',
      presetTitle: 'Next.js',
    },
    workspace: {
      envFiles: [],
      packageScriptCount: 1,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: false,
    loadedSecretCount: 0,
    lastRefreshTime: null,
    nextStep: {
      label: 'Switch Environment',
      description: 'Use the shared surface-state recommendation.',
    },
    issue: null,
  })

  const sections = provider.getChildren()
  const statusSection = sections.find((item) => item.label === 'Status')
  const statusItems = provider.getChildren(statusSection)

  assert.ok(getLabels(statusItems).includes('Next: Switch Environment'))
})

test('home tree status shows connection details', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    workspaceOpen: true,
    project: {
      name: 'demo',
      env: 'development',
      presetTitle: 'Next.js',
    },
    workspace: {
      rootPath: '/tmp/demo-workspace',
      envFiles: [],
      packageScriptCount: 1,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: true,
    loadedSecretCount: 2,
    lastRefreshTime: new Date('2026-03-11T00:00:00Z'),
    issue: null,
  })

  const sections = provider.getChildren()
  const statusSection = sections.find((item) => item.label === 'Status')
  const advancedSection = sections.find((item) => item.label === 'Advanced')
  const statusItems = provider.getChildren(statusSection)
  const advancedItems = provider.getChildren(advancedSection)

  assert.ok(getLabels(statusItems).includes('Connection: Secrets active'))
  assert.ok(getLabels(statusItems).includes('Workspace: demo-workspace'))
  assert.ok(getLabels(statusItems).includes('Project: demo / development'))
  assert.ok(getLabels(statusItems).includes('Secrets: Active (2)'))
  assert.ok(getLabels(advancedItems).includes('Account: dev@example.com'))
  assert.ok(getLabels(advancedItems).includes('Server: https://runenv.dev'))
})

test('home tree shows preset recommendation in status and actions', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    workspaceOpen: true,
    project: {
      name: 'demo',
      env: 'development',
      presetTitle: 'Docker Compose',
    },
    workspace: {
      envFiles: [makeEnvFile('.env.local')],
      packageScriptCount: 0,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: true,
    loadedSecretCount: 1,
    lastRefreshTime: new Date('2026-03-11T00:00:00Z'),
    presetRecommendation: {
      targetTitle: 'Next.js',
      detail: '.env.local -> Local override',
    },
    issue: null,
  })

  const sections = provider.getChildren()
  const statusSection = sections.find((item) => item.label === 'Status')
  const actionSection = sections.find((item) => item.label === 'Actions')
  const statusItems = provider.getChildren(statusSection)
  const actionItems = provider.getChildren(actionSection)

  assert.ok(getLabels(statusItems).includes('Preset recommendation: Next.js'))
  assert.equal(actionItems[0].label, 'Switch preset to Next.js')
})

test('home tree shows progress checklist for the current setup stage', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    workspaceOpen: true,
    project: {
      name: 'demo',
      env: 'development',
      presetTitle: 'Next.js',
    },
    workspace: {
      rootPath: '/tmp/demo-workspace',
      envFiles: [makeEnvFile('.env.local')],
      packageScriptCount: 1,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: false,
    loadedSecretCount: 0,
    lastRefreshTime: null,
    issue: null,
  })

  const sections = provider.getChildren()
  const progressSection = sections.find((item) => item.label === 'Progress')
  const progressItems = provider.getChildren(progressSection)

  assert.ok(progressSection)
  assert.equal(progressItems[0].label, '1. Open Folder')
  assert.equal(progressItems[1].label, '2. Login')
  assert.equal(progressItems[2].label, '3. Init Project')
  assert.equal(progressItems[3].label, '4. Load Secrets')
  assert.equal(progressItems[4].label, '5. Import .env File')
  assert.match(progressItems[3].description, /Current/)
  assert.match(progressItems[4].description, /Pending/)
})

test('home tree hides run script when no package scripts exist', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    workspaceOpen: true,
    project: {
      name: 'demo',
      env: 'development',
      presetTitle: 'Node / dotenv',
    },
    workspace: {
      envFiles: [],
      packageScriptCount: 0,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: true,
    loadedSecretCount: 1,
    lastRefreshTime: new Date('2026-03-11T00:00:00Z'),
    issue: null,
  })

  const sections = provider.getChildren()
  const actionsSection = sections.find((item) => item.label === 'Actions')
  const actionItems = provider.getChildren(actionsSection)

  assert.ok(!getLabels(actionItems).includes('Run Script'))
  assert.equal(actionItems[0].label, 'Open Terminal')
  assert.ok(!getLabels(actionItems).includes('Quick Start'))
})

test('home tree actions prioritize recovery when an issue exists', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'http://localhost:5820',
    workspaceOpen: true,
    project: {
      name: 'demo',
      env: 'development',
      presetTitle: 'Node / dotenv',
    },
    workspace: {
      envFiles: [],
      packageScriptCount: 0,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: false,
    loadedSecretCount: 0,
    lastRefreshTime: null,
    issue: {
      title: 'Check RunEnv API URL',
      detail: 'The current RunEnv API URL returned HTML instead of JSON.',
      command: { id: 'runenv.openSettings', title: 'Open Settings' },
    },
  })

  const sections = provider.getChildren()
  const actionsSection = sections.find((item) => item.label === 'Actions')
  const actionItems = provider.getChildren(actionsSection)

  assert.equal(actionItems[0].label, 'Fix: Open Settings')
  assert.ok(getLabels(actionItems).includes('Doctor Report'))
})

test('home tree recommends importing local env files after secrets are loaded', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    workspaceOpen: true,
    project: {
      name: 'demo',
      env: 'development',
      presetTitle: 'Node / dotenv',
    },
    workspace: {
      envFiles: [makeEnvFile('.env.local')],
      packageScriptCount: 0,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: true,
    loadedSecretCount: 3,
    lastRefreshTime: new Date('2026-03-11T00:00:00Z'),
    issue: null,
  })

  const sections = provider.getChildren()
  const statusSection = sections.find((item) => item.label === 'Status')
  const statusItems = provider.getChildren(statusSection)

  assert.ok(getLabels(statusItems).includes('Next: Import .env File'))
})

test('home tree shows files section with direct import entries', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    workspaceOpen: true,
    project: {
      name: 'demo',
      env: 'development',
      presetTitle: 'Next.js',
    },
    workspace: {
      envFiles: [makeEnvFile('.env.local')],
      packageScriptCount: 1,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: true,
    loadedSecretCount: 2,
    lastRefreshTime: new Date('2026-03-11T00:00:00Z'),
    recentActions: [
      {
        label: 'Load Secrets',
        detail: 'demo/development (2)',
        timestamp: '10:02:00',
        status: 'success',
      },
    ],
    issue: null,
  })

  const sections = provider.getChildren()
  const filesSection = sections.find((item) => item.label === 'Files')
  const fileItems = provider.getChildren(filesSection)

  assert.ok(filesSection)
  assert.ok(getLabels(fileItems).includes('Open .runenv.json'))
  assert.ok(getLabels(fileItems).includes('Import .env.local'))
})

test('home tree shows recent action history when available', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    workspaceOpen: true,
    project: {
      name: 'demo',
      env: 'development',
      presetTitle: 'Next.js',
    },
    workspace: {
      rootPath: '/tmp/demo-workspace',
      envFiles: [],
      packageScriptCount: 1,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: true,
    loadedSecretCount: 2,
    lastRefreshTime: new Date('2026-03-11T00:00:00Z'),
    recentActions: [
      {
        label: 'Import .env File',
        detail: '.env.local -> demo/development (2)',
        timestamp: '10:05:00',
        status: 'success',
        commandId: 'runenv.importEnv',
      },
      {
        label: 'Load Secrets',
        detail: 'demo/development (2)',
        timestamp: '10:04:00',
        status: 'success',
        commandId: 'runenv.loadSecrets',
      },
    ],
    issue: null,
  })

  const sections = provider.getChildren()
  const recentSection = sections.find((item) => item.label === 'Recent')
  const recentItems = provider.getChildren(recentSection)

  assert.ok(recentSection)
  assert.equal(recentItems[0].label, 'Import .env File')
  assert.match(recentItems[0].description, /10:05:00/)
  assert.equal(recentItems[0].command.command, 'runenv.openRecentAction')
  assert.equal(recentItems[0].command.arguments[0].commandId, 'runenv.importEnv')
})

test('home tree advanced section includes readme entry', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    workspaceOpen: true,
    project: {
      name: 'demo',
      env: 'development',
      presetTitle: 'Next.js',
    },
    workspace: {
      envFiles: [],
      packageScriptCount: 1,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: true,
    loadedSecretCount: 2,
    lastRefreshTime: new Date('2026-03-11T00:00:00Z'),
    issue: null,
  })

  const sections = provider.getChildren()
  const advancedSection = sections.find((item) => item.label === 'Advanced')
  const advancedItems = provider.getChildren(advancedSection)

  assert.ok(getLabels(advancedItems).includes('Account: dev@example.com'))
  assert.ok(getLabels(advancedItems).includes('Server: https://runenv.dev'))
  assert.ok(getLabels(advancedItems).includes('Open README'))
  assert.ok(getLabels(advancedItems).includes('Smoke Test Checklist'))
})

test('home tree actions surface selected advanced actions after core actions', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    workspaceOpen: true,
    project: {
      name: 'demo',
      env: 'development',
      presetTitle: 'Next.js',
    },
    workspace: {
      envFiles: [],
      packageScriptCount: 1,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: true,
    loadedSecretCount: 2,
    lastRefreshTime: new Date('2026-03-11T00:00:00Z'),
    nextStep: {
      label: 'Open Terminal',
      description: 'Start working with secrets already active in this window.',
    },
    setupIncomplete: false,
    highlightedAdvancedActions: [
      {
        id: 'generateDotenv',
        label: 'Generate .env File',
        description: 'Create a local env file for tools that still need one on disk.',
        iconId: 'file-code',
      },
      {
        id: 'smokeChecklist',
        label: 'Smoke Test Checklist',
        description: 'Open the manual verification checklist before packaging or release.',
        iconId: 'checklist',
      },
    ],
    issue: null,
  })

  const sections = provider.getChildren()
  const actionsSection = sections.find((item) => item.label === 'Actions')
  const actionItems = provider.getChildren(actionsSection)
  const labels = getLabels(actionItems)

  assert.equal(actionItems[0].label, 'Open Terminal')
  assert.ok(labels.includes('Generate .env File'))
  assert.ok(labels.includes('Smoke Test Checklist'))
  assert.ok(labels.indexOf('Generate .env File') > labels.indexOf('Switch Environment'))
})

test('home tree includes troubleshooting section when an issue exists', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: false,
    apiUrl: 'https://runenv.dev',
    workspaceOpen: false,
    project: null,
    workspace: null,
    secretsLoaded: false,
    loadedSecretCount: 0,
    lastRefreshTime: null,
    issue: {
      title: 'Session expired',
      detail: 'Login again to reload secrets.',
      command: { id: 'runenv.login', title: 'Login' },
    },
  })

  const sections = provider.getChildren()
  const troubleshootingSection = sections.find(
    (item) => item.label === 'Troubleshooting'
  )
  const troubleshootingItems = provider.getChildren(troubleshootingSection)

  assert.ok(troubleshootingSection)
  assert.equal(troubleshootingItems[0].label, 'Session expired')
})

test('home tree prioritizes recovery action when an issue exists', () => {
  const provider = new HomeTreeProvider()
  provider.refresh({
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'http://localhost:5820',
    workspaceOpen: true,
    project: {
      name: 'demo',
      env: 'development',
      presetTitle: 'Node / dotenv',
    },
    workspace: {
      envFiles: [],
      packageScriptCount: 0,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: false,
    loadedSecretCount: 0,
    lastRefreshTime: null,
    issue: {
      title: 'Check RunEnv API URL',
      detail: 'The current RunEnv API URL returned HTML instead of JSON.',
      command: { id: 'runenv.openSettings', title: 'Open Settings' },
    },
  })

  const sections = provider.getChildren()
  const statusSection = sections.find((item) => item.label === 'Status')
  const statusItems = provider.getChildren(statusSection)

  assert.ok(getLabels(statusItems).includes('Next: Open Settings'))
})
