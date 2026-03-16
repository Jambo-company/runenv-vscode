import * as path from 'path'
import * as vscode from 'vscode'
import { buildProjectConfigFileDiagnostics } from './editor-ux'

export class ProjectConfigEditorDiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection
  private disposables: vscode.Disposable[] = []

  constructor() {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection('runenvProjectConfig')
  }

  startWatching(): void {
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        this.scanDocument(event.document)
      }),
      vscode.workspace.onDidOpenTextDocument((document) => {
        this.scanDocument(document)
      }),
      vscode.workspace.onDidCloseTextDocument((document) => {
        this.diagnosticCollection.delete(document.uri)
      })
    )

    for (const editor of vscode.window.visibleTextEditors) {
      this.scanDocument(editor.document)
    }
  }

  dispose(): void {
    this.disposables.forEach((disposable) => disposable.dispose())
    this.diagnosticCollection.dispose()
  }

  private scanDocument(document: vscode.TextDocument): void {
    if (path.basename(document.uri.fsPath) !== '.runenv.json') {
      this.diagnosticCollection.delete(document.uri)
      return
    }

    const fullRange = document.lineCount
      ? document.lineAt(0).range
      : new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0))

    const diagnostics = buildProjectConfigFileDiagnostics(document.getText()).map(
      (item) => {
        const diagnostic = new vscode.Diagnostic(
          fullRange,
          item.message,
          item.severity === 'error'
            ? vscode.DiagnosticSeverity.Error
            : vscode.DiagnosticSeverity.Warning
        )
        diagnostic.code = item.code
        diagnostic.source = 'RunEnv'
        return diagnostic
      }
    )

    this.diagnosticCollection.set(document.uri, diagnostics)
  }
}
