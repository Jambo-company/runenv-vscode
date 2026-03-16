const test = require('node:test')
const assert = require('node:assert/strict')

const {
  appendRecentAction,
  getStoredRecentActions,
} = require('../dist/recent-actions-store.js')

function createState(initial = {}) {
  const storage = new Map(Object.entries(initial))

  return {
    get(key) {
      return storage.get(key)
    },
    async update(key, value) {
      storage.set(key, value)
    },
  }
}

test('getStoredRecentActions returns empty list when no workspace history exists', () => {
  const state = createState()

  assert.deepEqual(getStoredRecentActions(state, '/tmp/demo'), [])
})

test('appendRecentAction prepends and scopes actions by workspace', async () => {
  const state = createState({
    'runenv.recentActions:/tmp/demo': [
      {
        label: 'Older',
        detail: 'old',
        timestamp: '09:00:00',
        status: 'info',
      },
    ],
  })

  const nextActions = await appendRecentAction(state, '/tmp/demo', {
    label: 'Newer',
    detail: 'new',
    timestamp: '10:00:00',
    status: 'success',
    commandId: 'runenv.quickStart',
  })

  assert.equal(nextActions[0].label, 'Newer')
  assert.equal(nextActions[1].label, 'Older')
  assert.deepEqual(getStoredRecentActions(state, '/tmp/demo'), nextActions)
  assert.deepEqual(getStoredRecentActions(state, '/tmp/other'), [])
})
