const { installVscodeMock } = require('./helpers/vscode-mock')
installVscodeMock()

const test = require('node:test')
const assert = require('node:assert/strict')

const {
  getSetupSteps,
  getSetupSummary,
  getQuickStartPlaceHolder,
} = require('../dist/setup-progress.js')

test('setup summary points to login when workspace is open but not authenticated', () => {
  const summary = getSetupSummary({
    workspaceOpen: true,
    workspaceName: 'demo',
    loggedIn: false,
    email: null,
    projectName: null,
    envName: null,
    secretsLoaded: false,
    loadedSecretCount: 0,
    envFileCount: 0,
  })

  assert.equal(summary.label, 'Setup: 1/4 complete')
  assert.equal(summary.detail, 'Next: Login')
})

test('setup steps mark import as recommended after core setup is complete', () => {
  const steps = getSetupSteps({
    workspaceOpen: true,
    workspaceName: 'demo',
    loggedIn: true,
    email: 'dev@example.com',
    projectName: 'demo',
    envName: 'development',
    secretsLoaded: true,
    loadedSecretCount: 2,
    envFileCount: 1,
  })

  assert.equal(steps[0].description, 'Done · demo')
  assert.equal(steps[3].description, 'Done · 2 secrets active')
  assert.equal(steps[4].status, 'recommended')
  assert.match(steps[4].description, /1 local env file still detected/)
})

test('quick start placeholder reflects the current required step', () => {
  const loadingStep = getQuickStartPlaceHolder({
    workspaceOpen: true,
    workspaceName: 'demo',
    loggedIn: true,
    email: 'dev@example.com',
    projectName: 'demo',
    envName: 'development',
    secretsLoaded: false,
    loadedSecretCount: 0,
    envFileCount: 0,
  })

  const completeStep = getQuickStartPlaceHolder({
    workspaceOpen: true,
    workspaceName: 'demo',
    loggedIn: true,
    email: 'dev@example.com',
    projectName: 'demo',
    envName: 'development',
    secretsLoaded: true,
    loadedSecretCount: 2,
    envFileCount: 2,
  })

  assert.equal(
    loadingStep,
    'Quick Start: step 4 of 4 — load secrets into this window'
  )
  assert.equal(
    completeStep,
    'Quick Start: setup complete — 2 local env files still detected'
  )
})
