const test = require('node:test')
const assert = require('node:assert/strict')

const {
  applyRunenvEnvironmentCollection,
  clearRunenvEnvironmentCollection,
} = require('../dist/helpers/environment-collection.js')

function createCollection() {
  const replaced = []

  return {
    persistent: true,
    description: 'stale',
    replaced,
    cleared: 0,
    clear() {
      this.cleared += 1
      this.replaced.length = 0
    },
    replace(variable, value) {
      this.replaced.push([variable, value])
    },
  }
}

test('applyRunenvEnvironmentCollection disables persistence and replaces secrets', () => {
  const collection = createCollection()

  applyRunenvEnvironmentCollection(
    collection,
    'demo-project',
    'production',
    { API_KEY: 'secret', APP_ENV: 'production' },
    2
  )

  assert.equal(collection.persistent, false)
  assert.equal(
    collection.description,
    'RunEnv: demo-project/production (2 secrets)'
  )
  assert.equal(collection.cleared, 1)
  assert.deepEqual(collection.replaced, [
    ['API_KEY', 'secret'],
    ['APP_ENV', 'production'],
  ])
})

test('clearRunenvEnvironmentCollection clears description and disables persistence', () => {
  const collection = createCollection()

  clearRunenvEnvironmentCollection(collection)

  assert.equal(collection.persistent, false)
  assert.equal(collection.description, undefined)
  assert.equal(collection.cleared, 1)
  assert.deepEqual(collection.replaced, [])
})
