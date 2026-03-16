const test = require('node:test')
const assert = require('node:assert/strict')

const {
  formatPreviewKeyList,
  buildImportPreviewContent,
  buildImportResultContent,
  buildGeneratePreviewContent,
  buildGenerateResultContent,
  buildPresetUpdateResultContent,
} = require('../dist/preview.js')

test('formatPreviewKeyList truncates long key lists', () => {
  const content = formatPreviewKeyList(['A', 'B', 'C', 'D'], { maxItems: 2 })

  assert.equal(content, '- A\n- B\n- ...and 2 more')
})

test('buildImportPreviewContent includes import target and counts', () => {
  const content = buildImportPreviewContent({
    fileName: '.env.local',
    fullPath: '/tmp/.env.local',
    project: 'demo',
    env: 'development',
    profileLabel: 'Local override',
    profileDescription: 'Private values that only affect your machine',
    keys: ['API_KEY', 'DEBUG'],
    existingValueCount: 3,
    newKeys: ['API_KEY'],
    changedKeys: ['DEBUG'],
    unchangedKeys: [],
  })

  assert.match(content, /RunEnv Import Preview/)
  assert.match(content, /Import target: Local override/)
  assert.match(content, /Values found: 2/)
  assert.match(content, /Current target values: 3/)
  assert.match(content, /Changed keys: 1/)
  assert.match(content, /Import summary/)
  assert.match(content, /- API_KEY/)
})

test('buildGeneratePreviewContent shows overwrite mode', () => {
  const content = buildGeneratePreviewContent({
    filename: '.env',
    fullPath: '/tmp/.env',
    project: 'demo',
    env: 'production',
    presetTitle: 'Next.js',
    profileLabel: 'Base shared env',
    overwrite: true,
    keys: ['DATABASE_URL'],
  })

  assert.match(content, /Mode: Overwrite existing file/)
  assert.match(content, /Preset: Next\.js/)
  assert.match(content, /- DATABASE_URL/)
})

test('buildImportResultContent explains the completed import', () => {
  const content = buildImportResultContent({
    fileName: '.env.local',
    fullPath: '/tmp/.env.local',
    project: 'demo',
    env: 'development',
    presetTitle: 'Next.js',
    profileLabel: 'Local override',
    profileDescription: 'Personal override that only affects your machine',
    keys: ['API_KEY', 'DEBUG'],
    sourceFileStillExists: true,
    importModeLabel: 'Overwrite existing values',
    addedCount: 1,
    updatedCount: 1,
    skippedConflictCount: 0,
    skippedUnchangedCount: 2,
  })

  assert.match(content, /RunEnv Import Complete/)
  assert.match(content, /Preset: Next\.js/)
  assert.match(content, /Import mode: Overwrite existing values/)
  assert.match(content, /## Before/)
  assert.match(content, /## After/)
  assert.match(content, /Added: 1/)
  assert.match(content, /Updated: 1/)
  assert.match(content, /Skipped unchanged: 2/)
  assert.match(content, /Source file: Still on disk/)
  assert.match(content, /Delete the old file if RunEnv is now your source of truth/)
})

test('buildGenerateResultContent explains gitignore handling', () => {
  const content = buildGenerateResultContent({
    filename: '.env.local',
    fullPath: '/tmp/.env.local',
    project: 'demo',
    env: 'development',
    presetTitle: 'Next.js',
    profileLabel: 'Local override',
    profileDescription: 'Personal override that only affects your machine',
    overwrite: false,
    keys: ['DATABASE_URL', 'API_KEY'],
    gitignoreStatus: 'updated',
    safeToShare: false,
  })

  assert.match(content, /RunEnv File Ready/)
  assert.match(content, /## Before/)
  assert.match(content, /## After/)
  assert.match(content, /Mode: Created new file/)
  assert.match(content, /\.gitignore: Added \.env\.local/)
  assert.match(content, /Sharing: Do not commit/)
  assert.match(content, /Keep this file out of git/)
})

test('buildPresetUpdateResultContent summarizes preset changes', () => {
  const content = buildPresetUpdateResultContent({
    project: 'demo',
    env: 'development',
    previousPresetTitle: 'Docker Compose',
    currentPresetTitle: 'Next.js',
    matches: ['.env.local -> Local override', '.env.development -> development env'],
    recommendedGenerateFilename: '.env.local',
    recommendedTemplateFilename: '.env.example',
  })

  assert.match(content, /RunEnv Preset Updated/)
  assert.match(content, /Preset: Docker Compose/)
  assert.match(content, /Preset: Next\.js/)
  assert.match(content, /Recommended generate target: \.env\.local/)
  assert.match(content, /\.env\.local -> Local override/)
})
