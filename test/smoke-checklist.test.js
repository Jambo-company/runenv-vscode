const { installVscodeMock } = require('./helpers/vscode-mock')
installVscodeMock()

const test = require('node:test')
const assert = require('node:assert/strict')

const { buildSmokeChecklist } = require('../dist/smoke-checklist.js')

test('smoke checklist includes workspace-specific release flow', () => {
  const content = buildSmokeChecklist({
    generatedAt: '2026-03-11 12:00:00',
    apiUrl: 'http://localhost:5820',
    workspaceRoot: '/tmp/demo',
    loggedIn: true,
    projectName: 'demo',
    envName: 'development',
    presetTitle: 'Next.js',
    secretsLoaded: true,
    envFiles: ['.env.local'],
    hasProjectConfig: true,
    hasPresetRecommendation: true,
  })

  assert.match(content, /RunEnv Smoke Test Checklist/)
  assert.match(content, /Server: http:\/\/localhost:5820/)
  assert.match(content, /Import a detected env file/)
  assert.match(content, /Apply the recommended preset/)
  assert.match(content, /Package a VSIX/)
})
