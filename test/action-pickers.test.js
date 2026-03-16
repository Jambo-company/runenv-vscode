const { installVscodeMock } = require('./helpers/vscode-mock')
installVscodeMock()

const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildGenerateCompletionItems,
  buildImportCompletionItems,
  buildPresetUpdateCompletionItems,
  buildRecentActionFollowUpItems,
} = require('../dist/action-pickers.js')

test('import completion items include delete option when source file exists', () => {
  const items = buildImportCompletionItems('.env.local', true)

  assert.equal(items[0].action, 'deleteSource')
  assert.match(items[0].description, /\.env\.local/)
})

test('import completion items skip delete option when source file is already gone', () => {
  const items = buildImportCompletionItems('.env.local', false)

  assert.deepEqual(
    items.map((item) => item.action),
    ['openTerminal', 'viewSecrets', 'openConfig']
  )
})

test('generate completion items open the generated file first', () => {
  const items = buildGenerateCompletionItems('.env')

  assert.equal(items[0].action, 'openFile')
  assert.match(items[0].description, /\.env/)
})

test('preset update completion items keep import and generate actions available', () => {
  const items = buildPresetUpdateCompletionItems()

  assert.deepEqual(
    items.map((item) => item.action),
    ['importEnv', 'generateDotenv', 'openConfig']
  )
})

test('recent action follow-up items include rerun when command is available', () => {
  const items = buildRecentActionFollowUpItems({
    label: 'Import .env File',
    detail: 'demo',
    timestamp: '10:00:00',
    status: 'success',
    commandId: 'runenv.importEnv',
  })

  assert.equal(items[0].commandId, 'runenv.importEnv')
  assert.match(items[0].label, /Run Again/)
  assert.equal(items[1].commandId, 'runenv.openHome')
})
