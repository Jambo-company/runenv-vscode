const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildImportDiff,
  buildImportPlan,
} = require('../dist/import-diff.js')

test('buildImportDiff separates new changed and unchanged keys', () => {
  const diff = buildImportDiff(
    {
      NEW_KEY: 'a',
      CHANGED_KEY: 'next',
      SAME_KEY: 'same',
    },
    {
      CHANGED_KEY: 'prev',
      SAME_KEY: 'same',
      ONLY_REMOTE: 'remote',
    }
  )

  assert.equal(diff.incomingCount, 3)
  assert.equal(diff.existingCount, 3)
  assert.deepEqual(diff.newKeys, ['NEW_KEY'])
  assert.deepEqual(diff.changedKeys, ['CHANGED_KEY'])
  assert.deepEqual(diff.unchangedKeys, ['SAME_KEY'])
})

test('buildImportPlan can skip conflicting keys in add-only mode', () => {
  const incoming = {
    NEW_KEY: 'a',
    CHANGED_KEY: 'next',
    SAME_KEY: 'same',
  }
  const diff = buildImportDiff(incoming, {
    CHANGED_KEY: 'prev',
    SAME_KEY: 'same',
  })

  const plan = buildImportPlan(incoming, diff, 'addOnly')

  assert.deepEqual(plan.importedKeys, ['NEW_KEY'])
  assert.deepEqual(plan.secrets, { NEW_KEY: 'a' })
  assert.equal(plan.addedCount, 1)
  assert.equal(plan.updatedCount, 0)
  assert.equal(plan.skippedConflictCount, 1)
  assert.equal(plan.skippedUnchangedCount, 1)
})
