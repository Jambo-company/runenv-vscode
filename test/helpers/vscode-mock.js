/**
 * Shared vscode module mock for tests that import compiled dist/*.js files.
 * Must be required BEFORE any dist module that depends on 'vscode'.
 */
const Module = require('node:module')

const originalLoad = Module._load
let installed = false
let workspaceFolders = []

const workspace = {
  get workspaceFolders() {
    return workspaceFolders
  },
  getConfiguration() {
    return {
      get() {
        return undefined
      },
    }
  },
}

const vscodeMock = {
  workspace,
  window: {
    activeTextEditor: undefined,
  },
  Uri: {
    file(path) {
      return { fsPath: path }
    },
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  l10n: {
    t(message, ...args) {
      if (args.length === 0) return message
      return args.reduce(
        (msg, arg, i) => msg.replace(`{${i}}`, String(arg)),
        message
      )
    },
  },
}

function installVscodeMock() {
  if (installed) return
  installed = true

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
        ...vscodeMock,
        EventEmitter,
        TreeItem,
        ThemeIcon,
      }
    }

    return originalLoad(request, parent, isMain)
  }
}

function setWorkspaceFolders(nextFolders) {
  workspaceFolders = nextFolders
}

module.exports = {
  installVscodeMock,
  setWorkspaceFolders,
}
