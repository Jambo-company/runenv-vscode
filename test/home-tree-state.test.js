const test = require('node:test')
const assert = require('node:assert/strict')
const { installVscodeMock } = require('./helpers/vscode-mock')

installVscodeMock()

const {
  getConnectionStatus,
  getRecommendedAction,
  getNextAction,
  isSetupIncomplete,
} = require('../dist/home-tree-state.js')

// --- getConnectionStatus ---

test('connection status: no workspace open -> Open Folder', () => {
  const status = getConnectionStatus({ workspaceOpen: false, loggedIn: false })
  assert.equal(status.label, 'Open Folder')
  assert.ok(status.command)
  assert.equal(status.command.command, 'workbench.action.files.openFolder')
})

test('connection status: not logged in -> Login', () => {
  const status = getConnectionStatus({ workspaceOpen: true, loggedIn: false })
  assert.equal(status.label, 'Login')
  assert.equal(status.command.command, 'runenv.login')
})

test('connection status: no project -> Init Project', () => {
  const status = getConnectionStatus({
    workspaceOpen: true,
    loggedIn: true,
    project: null,
  })
  assert.equal(status.label, 'Init Project')
  assert.equal(status.command.command, 'runenv.init')
})

test('connection status: not loaded -> Load Secrets', () => {
  const status = getConnectionStatus({
    workspaceOpen: true,
    loggedIn: true,
    project: { name: 'demo', env: 'dev' },
    secretsLoaded: false,
  })
  assert.equal(status.label, 'Load Secrets')
  assert.equal(status.command.command, 'runenv.loadSecrets')
})

test('connection status: active with secrets -> Secrets active', () => {
  const status = getConnectionStatus({
    workspaceOpen: true,
    loggedIn: true,
    project: { name: 'demo', env: 'dev' },
    secretsLoaded: true,
    loadedSecretCount: 3,
  })
  assert.equal(status.label, 'Secrets active')
  assert.equal(status.command, undefined)
})

test('connection status: active with 0 secrets', () => {
  const status = getConnectionStatus({
    workspaceOpen: true,
    loggedIn: true,
    project: { name: 'demo', env: 'dev' },
    secretsLoaded: true,
    loadedSecretCount: 0,
  })
  assert.equal(status.label, 'Connected with 0 secrets')
})

// --- getRecommendedAction ---

test('recommended action: issue overrides everything', () => {
  const action = getRecommendedAction({
    workspaceOpen: true,
    loggedIn: true,
    project: { name: 'demo', env: 'dev' },
    secretsLoaded: true,
    issue: {
      title: 'Bad URL',
      detail: 'Fix your API URL',
      command: { id: 'runenv.openSettings', title: 'Open Settings' },
    },
  })
  assert.equal(action.label, 'Open Settings')
  assert.equal(action.command.command, 'runenv.openSettings')
})

test('recommended action: not logged in -> Login', () => {
  const action = getRecommendedAction({
    workspaceOpen: true,
    loggedIn: false,
  })
  assert.equal(action.label, 'Login')
})

test('recommended action: secrets loaded with env files -> Import', () => {
  const action = getRecommendedAction({
    workspaceOpen: true,
    loggedIn: true,
    project: { name: 'demo', env: 'dev' },
    secretsLoaded: true,
    loadedSecretCount: 2,
    workspace: {
      envFiles: [{ name: '.env.local', fullPath: '/tmp/.env.local' }],
      packageScriptCount: 0,
    },
  })
  assert.equal(action.label, 'Import .env File')
})

test('recommended action: secrets loaded with scripts -> Run Script', () => {
  const action = getRecommendedAction({
    workspaceOpen: true,
    loggedIn: true,
    project: { name: 'demo', env: 'dev' },
    secretsLoaded: true,
    loadedSecretCount: 2,
    workspace: {
      envFiles: [],
      packageScriptCount: 3,
    },
  })
  assert.equal(action.label, 'Run Script')
})

test('recommended action: fallback -> Open Terminal', () => {
  const action = getRecommendedAction({
    workspaceOpen: true,
    loggedIn: true,
    project: { name: 'demo', env: 'dev' },
    secretsLoaded: true,
    loadedSecretCount: 2,
    workspace: { envFiles: [], packageScriptCount: 0 },
  })
  assert.equal(action.label, 'Open Terminal')
})

// --- getNextAction ---

test('getNextAction uses nextStep when provided', () => {
  const action = getNextAction({
    workspaceOpen: true,
    loggedIn: true,
    project: { name: 'demo', env: 'dev' },
    secretsLoaded: true,
    nextStep: {
      label: 'Custom Action',
      description: 'Do something custom',
      commandId: 'runenv.custom',
    },
  })
  assert.equal(action.label, 'Custom Action')
  assert.equal(action.command.command, 'runenv.custom')
})

test('getNextAction falls back to getRecommendedAction when no nextStep', () => {
  const action = getNextAction({
    workspaceOpen: true,
    loggedIn: false,
  })
  assert.equal(action.label, 'Login')
})

// --- isSetupIncomplete ---

test('isSetupIncomplete respects explicit flag', () => {
  assert.equal(
    isSetupIncomplete({
      setupIncomplete: false,
      workspaceOpen: false,
      loggedIn: false,
    }),
    false
  )
  assert.equal(
    isSetupIncomplete({
      setupIncomplete: true,
      workspaceOpen: true,
      loggedIn: true,
      project: { name: 'demo', env: 'dev' },
      secretsLoaded: true,
    }),
    true
  )
})

test('isSetupIncomplete computes from state when flag is absent', () => {
  assert.equal(
    isSetupIncomplete({
      workspaceOpen: true,
      loggedIn: true,
      project: { name: 'demo', env: 'dev' },
      secretsLoaded: true,
    }),
    false
  )
  assert.equal(
    isSetupIncomplete({
      workspaceOpen: true,
      loggedIn: true,
      project: null,
      secretsLoaded: false,
    }),
    true
  )
})
