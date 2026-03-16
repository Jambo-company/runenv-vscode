const test = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')

const originalLoad = Module._load
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'vscode') {
    class EventEmitter {
      constructor() {
        this.event = () => {}
      }
      fire() {}
    }

    class TreeItem {
      constructor(label, collapsibleState) {
        this.label = label
        this.collapsibleState = collapsibleState
      }
    }

    class ThemeIcon {
      constructor(id) {
        this.id = id
      }
    }

    return {
      EventEmitter,
      TreeItem,
      ThemeIcon,
      TreeItemCollapsibleState: {
        None: 0,
        Collapsed: 1,
        Expanded: 2,
      },
    }
  }

  return originalLoad(request, parent, isMain)
}

const { SecretsTreeProvider } = require('../dist/secrets-tree.js')

test('secrets tree stays empty until secrets are loaded', () => {
  const provider = new SecretsTreeProvider()
  provider.refresh(null, true, {
    project: 'demo',
    env: 'development',
  })

  assert.deepEqual(provider.getChildren(), [])
})

test('secrets tree shows project node after load even when count is zero', () => {
  const provider = new SecretsTreeProvider()
  provider.refresh(
    {
      project: 'demo',
      env: 'development',
      secrets: {},
    },
    true,
    {
      project: 'demo',
      env: 'development',
    }
  )

  const rootItems = provider.getChildren()

  assert.equal(rootItems[0].label, 'demo')
  assert.match(rootItems[0].description, /0 secrets/)
})
