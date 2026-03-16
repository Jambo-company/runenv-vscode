const { installVscodeMock } = require('./helpers/vscode-mock')
installVscodeMock()

const test = require('node:test')
const assert = require('node:assert/strict')

const { buildDoctorReport } = require('../dist/doctor-report.js')

test('doctor report summarizes setup, workspace, and current issue', () => {
  const content = buildDoctorReport({
    generatedAt: '2026-03-11 10:00:00',
    apiUrl: 'http://localhost:5820',
    workspaceRoot: '/tmp/demo',
    configPresent: true,
    configDiagnostics: [
      'Path: /tmp/.runenv.json',
      'project: demo',
      'env: development',
      'preset: Next.js',
    ],
    loggedIn: true,
    email: 'dev@example.com',
    projectName: 'demo',
    envName: 'development',
    presetTitle: 'Next.js',
    presetRecommendation: {
      title: 'Switch to Next.js',
      detail: '.env.local -> Local override',
    },
    secretsLoaded: false,
    loadedSecretCount: 0,
    lastRefreshTime: null,
    setupSummaryLabel: 'Setup: 3/4 complete',
    setupSummaryDetail: 'Next: Load Secrets',
    envFiles: ['.env.local', '.env.development'],
    packageScriptCount: 2,
    issue: {
      title: 'Check RunEnv API URL',
      detail: 'The current RunEnv API URL returned HTML instead of JSON.',
      actionTitle: 'Open Settings',
    },
    envGuidance: [
      'Configured preset: Next.js',
      'Detected files align best with Next.js (2 matches)',
      '.env.local -> Local override',
    ],
    recentActions: [
      {
        label: 'Init Project',
        detail: 'demo/development (Next.js)',
        timestamp: '10:01:00',
        status: 'success',
      },
      {
        label: 'Load Secrets',
        detail: 'demo/development (0)',
        timestamp: '10:02:00',
        status: 'success',
      },
    ],
    nextStepLabel: 'Open Settings',
    nextStepDescription: 'Resolve the current RunEnv issue first.',
  })

  assert.match(content, /RunEnv Doctor/)
  assert.match(content, /Setup: 3\/4 complete/)
  assert.match(content, /Next step: Open Settings/)
  assert.match(content, /Current issue: Check RunEnv API URL \(Open Settings\)/)
  assert.match(content, /Preset recommendation: Switch to Next\.js/)
  assert.match(content, /- Path: \/tmp\/\.runenv\.json/)
  assert.match(content, /Recommended preset change: Switch to Next\.js/)
  assert.match(content, /- \.env\.local/)
  assert.match(content, /Env file guidance/)
  assert.match(content, /Detected files align best with Next\.js/)
  assert.match(content, /- \.runenv\.json: Present/)
  assert.match(content, /## Recent Actions/)
  assert.match(content, /\[10:01:00\] Init Project \(success\)/)
})
