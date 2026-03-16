const test = require('node:test')
const assert = require('node:assert/strict')
const { installVscodeMock } = require('./helpers/vscode-mock')

installVscodeMock()

const { buildActionItems } = require('../dist/home-tree-action-items.js')

function getLabels(items) {
  return items.map((item) => item.label)
}

function getCommands(items) {
  return items.map((item) => item.command?.command).filter(Boolean)
}

function makeBaseState(overrides = {}) {
  return {
    loggedIn: true,
    email: 'dev@example.com',
    apiUrl: 'https://runenv.dev',
    workspaceOpen: true,
    project: { name: 'demo', env: 'dev', presetTitle: 'Next.js' },
    workspace: {
      envFiles: [],
      packageScriptCount: 0,
      configPath: '/tmp/.runenv.json',
    },
    secretsLoaded: true,
    loadedSecretCount: 2,
    lastRefreshTime: new Date(),
    issue: null,
    ...overrides,
  }
}

// --- Deduplication ---

test('buildActionItems deduplicates same label+command', () => {
  const state = makeBaseState({
    nextStep: {
      label: 'Open Terminal',
      description: 'Secrets already active',
      commandId: 'runenv.openTerminal',
    },
  })

  const items = buildActionItems(state)
  const openTerminalItems = items.filter(
    (item) => item.command?.command === 'runenv.openTerminal'
  )

  assert.equal(openTerminalItems.length, 1)
})

// --- Doctor Report always last ---

test('buildActionItems always includes Doctor Report at the end', () => {
  const items = buildActionItems(makeBaseState())
  const lastItem = items[items.length - 1]
  assert.equal(lastItem.label, 'Doctor Report')
  assert.equal(lastItem.command.command, 'runenv.doctor')
})

test('buildActionItems includes Doctor Report even for minimal state', () => {
  const items = buildActionItems(
    makeBaseState({
      loggedIn: false,
      project: null,
      workspace: null,
      secretsLoaded: false,
    })
  )
  const labels = getLabels(items)
  assert.ok(labels.includes('Doctor Report'))
})

// --- Issue recovery prioritized ---

test('buildActionItems puts fix action first when issue exists', () => {
  const items = buildActionItems(
    makeBaseState({
      issue: {
        title: 'Bad URL',
        detail: 'API returned HTML',
        command: { id: 'runenv.openSettings', title: 'Open Settings' },
      },
    })
  )
  assert.match(items[0].label, /Fix:/)
  assert.equal(items[0].command.command, 'runenv.openSettings')
})

// --- Highlighted advanced actions ---

test('buildActionItems appends highlighted advanced actions after core items', () => {
  const items = buildActionItems(
    makeBaseState({
      highlightedAdvancedActions: [
        {
          id: 'generateDotenv',
          label: 'Generate .env File',
          description: 'Create a local .env',
          iconId: 'file-code',
        },
      ],
    })
  )
  const labels = getLabels(items)
  assert.ok(labels.includes('Generate .env File'))

  const doctorIndex = labels.indexOf('Doctor Report')
  const generateIndex = labels.indexOf('Generate .env File')
  assert.ok(generateIndex < doctorIndex)
})

// --- Conditional items ---

test('buildActionItems hides Run Script when no package scripts', () => {
  const items = buildActionItems(
    makeBaseState({
      workspace: { envFiles: [], packageScriptCount: 0 },
    })
  )
  assert.ok(!getLabels(items).includes('Run Script'))
})

test('buildActionItems shows Run Script when package scripts exist and secrets loaded', () => {
  const items = buildActionItems(
    makeBaseState({
      workspace: { envFiles: [], packageScriptCount: 3 },
    })
  )
  assert.ok(getLabels(items).includes('Run Script'))
})

test('buildActionItems hides Quick Start when setup is complete', () => {
  const items = buildActionItems(
    makeBaseState({
      setupIncomplete: false,
    })
  )
  assert.ok(!getLabels(items).includes('Quick Start'))
})

test('buildActionItems shows Quick Start when setup is incomplete', () => {
  const items = buildActionItems(
    makeBaseState({
      secretsLoaded: false,
      loadedSecretCount: 0,
    })
  )
  assert.ok(getLabels(items).includes('Quick Start'))
})

test('buildActionItems shows Load Secrets when project set but not loaded', () => {
  const items = buildActionItems(
    makeBaseState({
      secretsLoaded: false,
      loadedSecretCount: 0,
    })
  )
  assert.ok(getLabels(items).includes('Load Secrets'))
})

test('buildActionItems shows Import when env files detected', () => {
  const items = buildActionItems(
    makeBaseState({
      workspace: {
        envFiles: [{ name: '.env.local', fullPath: '/tmp/.env.local' }],
        packageScriptCount: 0,
      },
    })
  )
  assert.ok(getLabels(items).includes('Import .env File'))
})

test('buildActionItems shows View Secrets and Open Terminal when secrets loaded', () => {
  const items = buildActionItems(makeBaseState())
  const labels = getLabels(items)
  assert.ok(labels.includes('View Secrets'))
  assert.ok(labels.includes('Open Terminal'))
})

test('buildActionItems shows Switch Environment when project configured', () => {
  const items = buildActionItems(makeBaseState())
  assert.ok(getLabels(items).includes('Switch Environment'))
})

test('buildActionItems hides Switch Environment when no project', () => {
  const items = buildActionItems(makeBaseState({ project: null }))
  assert.ok(!getLabels(items).includes('Switch Environment'))
})
