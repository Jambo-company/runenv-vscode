import * as vscode from 'vscode'
import {
  buildHomeSectionItems,
  HomeItem,
  RunenvHomeState,
} from './home-tree-sections'

export class HomeTreeProvider implements vscode.TreeDataProvider<HomeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    HomeItem | undefined | null | void
  >()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  private state: RunenvHomeState = {
    loggedIn: false,
    apiUrl: '',
    workspaceOpen: false,
    project: null,
    workspace: null,
    secretsLoaded: false,
    loadedSecretCount: 0,
    lastRefreshTime: null,
  }

  refresh(state: RunenvHomeState): void {
    this.state = state
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: HomeItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: HomeItem): HomeItem[] {
    return buildHomeSectionItems(this.state, element?.sectionId)
  }
}
