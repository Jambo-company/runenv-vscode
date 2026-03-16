const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildRecentActionContent,
  getRecentActionsStorageKey,
  trimRecentActions,
} = require('../dist/recent-actions.js')

test('recent action storage key is scoped by workspace', () => {
  assert.equal(
    getRecentActionsStorageKey('/tmp/demo'),
    'runenv.recentActions:/tmp/demo'
  )
  assert.equal(
    getRecentActionsStorageKey(null),
    'runenv.recentActions:global'
  )
})

test('trimRecentActions keeps the most recent items only', () => {
  const actions = [
    { label: 'A', detail: '', timestamp: '1', status: 'info' },
    { label: 'B', detail: '', timestamp: '2', status: 'success' },
    { label: 'C', detail: '', timestamp: '3', status: 'error' },
  ]

  const trimmed = trimRecentActions(actions, 2)

  assert.equal(trimmed.length, 2)
  assert.equal(trimmed[0].label, 'A')
  assert.equal(trimmed[1].label, 'B')
})

test('buildRecentActionContent includes summary markdown when present', () => {
  const content = buildRecentActionContent({
    label: 'Import .env File',
    detail: '.env.local -> demo/development (2)',
    timestamp: '10:05:00',
    status: 'success',
    commandId: 'runenv.importEnv',
    summaryMarkdown: '# RunEnv Import Complete\n\nValues imported: 2',
  })

  assert.match(content, /# Import \.env File/)
  assert.match(content, /Status: success/)
  assert.match(content, /# RunEnv Import Complete/)
})
