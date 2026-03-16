const { installVscodeMock } = require('./helpers/vscode-mock')
installVscodeMock()

const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildDoctorFollowUpActions,
  buildStatusBarTooltipContent,
} = require('../dist/workspace-ux.js')

test('doctor follow-up actions prioritize issue fix and dedupe next step', () => {
  const actions = buildDoctorFollowUpActions({
    presetRecommendation: {
      title: 'Next.js',
      description: '.env.local -> Local override',
    },
    issue: {
      detail: 'The current RunEnv API URL returned HTML instead of JSON.',
      commandId: 'runenv.openSettings',
      commandTitle: 'Open Settings',
    },
    nextStepLabel: 'Open Settings',
    nextStepDescription: 'Resolve the current RunEnv issue first.',
    nextStepCommandId: 'runenv.openSettings',
    loggedIn: true,
    setupIncomplete: true,
  })

  // Issue fix comes first
  assert.equal(actions[0].label, 'Fix: Open Settings')
  assert.equal(actions[0].commandId, 'runenv.openSettings')

  // Preset recommendation second
  assert.equal(actions[1].label, 'Switch preset to Next.js')
  assert.equal(actions[1].commandId, 'runenv.applyRecommendedPreset')

  // Next step deduped (commandId matches issue fix -> skipped)
  // Open Home third
  assert.equal(actions[2].label, 'Open Home')
  assert.equal(actions[2].commandId, 'runenv.openHome')

  // Quick Start when setupIncomplete
  assert.equal(actions[3].label, 'Quick Start')
  assert.equal(actions[3].commandId, 'runenv.quickStart')

  // Dashboard present when loggedIn
  assert.ok(actions.some((action) => action.commandId === 'runenv.openDashboard'))

  // openSettings not duplicated (issue fix already has it)
  assert.equal(
    actions.filter((action) => action.commandId === 'runenv.openSettings').length,
    1
  )
})

test('status bar tooltip content includes actionable links', () => {
  const content = buildStatusBarTooltipContent({
    setupSummaryLabel: 'Setup: 3/4 complete',
    setupSummaryDetail: 'Next: Load Secrets',
    apiUrl: 'http://localhost:5820',
    projectLabel: 'demo/development',
    secretsLabel: 'Not loaded',
    nextStepLabel: 'Load Secrets',
    nextStepDescription: 'Inject environment variables into terminals in this window.',
    nextStepCommandId: 'runenv.loadSecrets',
    presetRecommendation: {
      title: 'Next.js',
      description: '.env.local -> Local override',
    },
    issue: {
      title: 'Check RunEnv API URL',
      detail: 'The current RunEnv API URL returned HTML instead of JSON.',
      commandId: 'runenv.openSettings',
      commandTitle: 'Open Settings',
    },
    loggedIn: true,
    setupIncomplete: true,
  })

  assert.match(content, /\*\*RunEnv\*\*/)
  assert.match(content, /- Setup: 3\/4 complete/)
  assert.match(content, /- Preset recommendation: Next\.js/)
  assert.match(content, /- Issue: Check RunEnv API URL/)
  assert.match(content, /\[Home\]\(command:runenv\.openHome\)/)
  assert.match(content, /\[Actions\]\(command:runenv\.status\)/)
  assert.match(content, /\[Quick Start\]\(command:runenv\.quickStart\)/)
  assert.match(content, /\[Doctor Report\]\(command:runenv\.doctor\)/)
  assert.match(content, /\[Switch preset\]\(command:runenv\.applyRecommendedPreset\)/)
  assert.match(content, /\[Fix: Open Settings\]\(command:runenv\.openSettings\)/)
})
