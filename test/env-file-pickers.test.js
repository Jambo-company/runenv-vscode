const { installVscodeMock } = require('./helpers/vscode-mock')
installVscodeMock()

const test = require('node:test')
const assert = require('node:assert/strict')

const {
  getEnvFileProfilePickerCopy,
  getPresetPickerBadges,
  getPresetPickerDetail,
  getProfileMeaning,
} = require('../dist/helpers/env-file-pickers.js')

test('preset picker badges mark current and ambiguous safe defaults', () => {
  const badges = getPresetPickerBadges('node', 'vite', {
    presetId: 'node',
    reason: 'runenv-desktop/vite.config.ts, runenv-frontend/next.config.ts',
    source: 'ambiguous',
    projectType: 'mixed',
    projectTypeLabel: 'Mixed workspace',
    scope: 'nested-workspace',
    isAmbiguous: true,
    candidates: [],
  })

  assert.deepEqual(badges, ['recommended (safe default)'])
})

test('preset picker badges include current and framework recommendation labels', () => {
  const badges = getPresetPickerBadges('vite', 'vite', {
    presetId: 'vite',
    reason: 'vite.config.ts',
    source: 'config-file',
    projectType: 'vite',
    projectTypeLabel: 'Vite',
    scope: 'current-directory',
    isAmbiguous: false,
    candidates: [],
  })

  assert.deepEqual(badges, ['current', 'recommended'])
})

test('preset picker treats Flutter as a first-class detected preset', () => {
  const detection = {
    presetId: 'flutter',
    reason: 'pubspec.yaml',
    source: 'config-file',
    projectType: 'flutter',
    projectTypeLabel: 'Flutter',
    scope: 'current-directory',
    isAmbiguous: false,
    candidates: [],
  }

  const badges = getPresetPickerBadges('flutter', 'node', detection)
  const detail = getPresetPickerDetail(
    {
      id: 'flutter',
      title: 'Flutter',
      description:
        'Dotenv layering for Flutter apps, F5/debug sessions, and flavor-specific local runs.',
    },
    detection
  )

  assert.deepEqual(badges, ['recommended'])
  assert.match(detail, /Flutter apps/)
  assert.match(detail, /Auto-detected from pubspec\.yaml/)
})

test('preset picker detail explains mixed workspace fallback', () => {
  const detail = getPresetPickerDetail(
    {
      id: 'node',
      title: 'Node / dotenv',
      description: 'Generic dotenv layering for Node services, workers, and scripts.',
    },
    {
      presetId: 'node',
      reason: 'runenv-desktop/vite.config.ts, runenv-frontend/next.config.ts',
      source: 'ambiguous',
      projectType: 'mixed',
      projectTypeLabel: 'Mixed workspace',
      scope: 'nested-workspace',
      isAmbiguous: true,
      candidates: [],
    }
  )

  assert.match(detail, /Generic dotenv layering/)
  assert.match(detail, /Mixed workspace markers were found/)
  assert.match(detail, /safer generic preset/)
})

test('profile picker copy uses localized labels and meanings', () => {
  const profile = {
    id: 'environmentLocal',
    filename: '.env.production.local',
  }

  const copy = getEnvFileProfilePickerCopy(profile)

  assert.equal(copy.label, 'Environment local override · .env.production.local')
  assert.equal(
    copy.description,
    'Private environment-specific values for your machine'
  )
  assert.equal(
    getProfileMeaning({ id: 'base' }),
    'Shared base env for the project'
  )
})
