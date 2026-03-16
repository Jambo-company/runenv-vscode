const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildProjectConfigFileDiagnostics,
  getRunenvEditorFileKind,
} = require('../dist/editor-ux.js')

test('editor ux detects runenv env files and project config files', () => {
  assert.equal(
    getRunenvEditorFileKind({
      filePath: '/tmp/.runenv.json',
      environmentName: 'development',
    }),
    'projectConfig'
  )
  assert.equal(
    getRunenvEditorFileKind({
      filePath: '/tmp/.env.local',
      environmentName: 'development',
    }),
    'envFile'
  )
  assert.equal(
    getRunenvEditorFileKind({
      filePath: '/tmp/notes.txt',
      environmentName: 'development',
    }),
    'other'
  )
})

test('project config diagnostics flag invalid preset and unexpected fields', () => {
  const diagnostics = buildProjectConfigFileDiagnostics(
    JSON.stringify({
      project: 'demo',
      env: 'development',
      preset: 'bad-preset',
      extra: true,
    })
  )

  assert.ok(diagnostics.some((item) => item.code === 'invalid-preset'))
  assert.ok(diagnostics.some((item) => item.code === 'unexpected-fields'))
})

test('project config diagnostics flag invalid json and missing project', () => {
  const invalidJson = buildProjectConfigFileDiagnostics('{')
  const missingProject = buildProjectConfigFileDiagnostics(
    JSON.stringify({ env: 'development' })
  )

  assert.equal(invalidJson[0].code, 'invalid-json')
  assert.ok(missingProject.some((item) => item.code === 'missing-project'))
})
