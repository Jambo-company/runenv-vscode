const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildProjectConfigDiagnostics,
} = require('../dist/project-config-check.js')

test('project config diagnostics report invalid preset and extra fields', () => {
  const lines = buildProjectConfigDiagnostics({
    exists: true,
    configPath: '/tmp/.runenv.json',
    parsed: {
      project: 'demo',
      env: 'development',
      preset: 'unknown',
      owner: 'team-a',
    },
  })

  assert.deepEqual(lines, [
    'Path: /tmp/.runenv.json',
    'project: demo',
    'env: development',
    'preset: invalid (unknown)',
    'extra fields: owner',
  ])
})

test('project config diagnostics report missing config file clearly', () => {
  const lines = buildProjectConfigDiagnostics({
    exists: false,
    configPath: '/tmp/.runenv.json',
  })

  assert.deepEqual(lines, [
    'Missing: .runenv.json has not been created for this workspace',
  ])
})
