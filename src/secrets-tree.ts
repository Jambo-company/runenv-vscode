import * as vscode from 'vscode'

export interface SecretsInfo {
  project: string
  env: string
  secrets: Record<string, string>
}

export class SecretsTreeProvider implements vscode.TreeDataProvider<SecretItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    SecretItem | undefined | null | void
  >()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  private info: SecretsInfo | null = null
  private loggedIn = false
  private configuredProject:
    | {
        project: string
        env: string
      }
    | null = null

  refresh(
    info: SecretsInfo | null,
    loggedIn: boolean,
    configuredProject:
      | {
          project: string
          env: string
        }
      | null
  ): void {
    this.info = info
    this.loggedIn = loggedIn
    this.configuredProject = configuredProject
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: SecretItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: SecretItem): SecretItem[] {
    // Root level
    if (!element) {
      if (!this.info) {
        return []
      }

      const count = Object.keys(this.info.secrets).length
      return [
        new SecretItem(
          `${this.info.project}`,
          `${this.info.env} · ${count} secrets`,
          vscode.TreeItemCollapsibleState.Expanded,
          undefined,
          'project'
        ),
      ]
    }

    // Children of project node
    if (element.contextValue === 'project' && this.info) {
      return Object.entries(this.info.secrets).map(([key, value]) => {
        const masked =
          value.length > 8
            ? value.slice(0, 4) + '••••' + value.slice(-4)
            : '••••••••'
        return new SecretItem(
          key,
          masked,
          vscode.TreeItemCollapsibleState.None,
          undefined,
          'secret'
        )
      })
    }

    return []
  }
}

class SecretItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
    public readonly contextValue?: string
  ) {
    super(label, collapsibleState)
    this.description = description

    if (contextValue === 'project') {
      this.iconPath = new vscode.ThemeIcon('folder')
    } else if (contextValue === 'secret') {
      this.iconPath = new vscode.ThemeIcon('key')
    }
  }
}
