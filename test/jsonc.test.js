const test = require('node:test')
const assert = require('node:assert/strict')

const { parseJsoncObject } = require('../dist/helpers/jsonc.js')

test('parseJsoncObject accepts comments and trailing commas', () => {
  const parsed = parseJsoncObject(
    `{
      // Keep manual notes here.
      "version": "2.0.0",
      "tasks": [],
    }`,
    'tasks.json'
  )

  assert.deepEqual(parsed, {
    version: '2.0.0',
    tasks: [],
  })
})

test('parseJsoncObject reports file context for invalid JSONC', () => {
  assert.throws(
    () =>
      parseJsoncObject(
        `{
          "version": "2.0.0",
          "tasks": [,
        }`,
        'tasks.json'
      ),
    /Invalid JSON in tasks\.json/
  )
})

test('parseJsoncObject rejects non-object roots', () => {
  assert.throws(
    () => parseJsoncObject('["not", "an", "object"]', 'launch.json'),
    /launch\.json must contain a JSON object/
  )
})
