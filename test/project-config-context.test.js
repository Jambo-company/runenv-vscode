const { installVscodeMock, setWorkspaceFolders } = require('./helpers/vscode-mock')
installVscodeMock()

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const {
  getProjectWorkspaceRoot,
  loadProjectConfigContext,
} = require('../dist/config.js')

test('loadProjectConfigContext returns the workspace that contains .runenv.json', () => {
  const rootA = fs.mkdtempSync(path.join(os.tmpdir(), 'runenv-root-a-'))
  const rootB = fs.mkdtempSync(path.join(os.tmpdir(), 'runenv-root-b-'))

  fs.writeFileSync(
    path.join(rootB, '.runenv.json'),
    JSON.stringify({ project: 'demo', env: 'staging', preset: 'nextjs' })
  )

  setWorkspaceFolders([
    { uri: { fsPath: rootA } },
    { uri: { fsPath: rootB } },
  ])

  const context = loadProjectConfigContext()

  assert.deepEqual(context, {
    workspaceRoot: rootB,
    project: 'demo',
    env: 'staging',
    preset: 'nextjs',
  })
  assert.equal(getProjectWorkspaceRoot(), rootB)
})

test('getProjectWorkspaceRoot falls back to the first workspace folder', () => {
  const rootA = fs.mkdtempSync(path.join(os.tmpdir(), 'runenv-root-fallback-'))
  const rootB = fs.mkdtempSync(path.join(os.tmpdir(), 'runenv-root-other-'))

  setWorkspaceFolders([
    { uri: { fsPath: rootA } },
    { uri: { fsPath: rootB } },
  ])

  assert.equal(loadProjectConfigContext(), null)
  assert.equal(getProjectWorkspaceRoot(), rootA)
})
