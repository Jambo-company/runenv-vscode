const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildRunenvDotenvTask,
  buildRunenvDotenvCleanTask,
  getWrapScriptsPrefix,
  wrapScriptCommand,
} = require('../dist/helpers/runenv-command.js')

test('buildRunenvDotenvTask uses args instead of inline project flags', () => {
  const task = buildRunenvDotenvTask()

  assert.equal(task.command, 'runenv')
  assert.deepEqual(task.args, ['dotenv'])
  assert.equal(JSON.stringify(task).includes('--project'), false)
  assert.equal(JSON.stringify(task).includes('--env'), false)
})

test('buildRunenvDotenvCleanTask uses a safe args array', () => {
  const task = buildRunenvDotenvCleanTask()

  assert.equal(task.command, 'runenv')
  assert.deepEqual(task.args, ['dotenv', '--clean'])
})

test('wrapScriptCommand relies on linked workspace config', () => {
  assert.equal(getWrapScriptsPrefix(), 'runenv run --')
  assert.equal(wrapScriptCommand('npm run dev'), 'runenv run -- npm run dev')
})
