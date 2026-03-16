import * as vscode from 'vscode'

/**
 * Provides IntelliSense completions for process.env.XXX
 * Triggers when user types `process.env.` and suggests loaded secret keys.
 */
export class EnvCompletionProvider implements vscode.CompletionItemProvider {
  private secretKeys: string[] = []

  updateKeys(secrets: Record<string, string>): void {
    this.secretKeys = Object.keys(secrets)
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] | undefined {
    const lineText = document.lineAt(position).text
    const textBefore = lineText.substring(0, position.character)

    // Match process.env., import.meta.env., Deno.env.get(", os.environ[
    const triggers = [
      /process\.env\.$/,
      /import\.meta\.env\.$/,
      /Deno\.env\.get\(["']$/,
      /os\.environ\[["']$/,
      /os\.getenv\(["']$/,
    ]

    const isTriggered = triggers.some((re) => re.test(textBefore))
    if (!isTriggered || this.secretKeys.length === 0) return undefined

    return this.secretKeys.map((key, idx) => {
      const item = new vscode.CompletionItem(
        key,
        vscode.CompletionItemKind.Variable
      )
      item.detail = '☁ RunEnv secret'
      item.sortText = String(idx).padStart(4, '0')
      item.filterText = key
      return item
    })
  }
}

/**
 * Scans code for process.env.XXX references and flags keys
 * that don't exist in the loaded secrets.
 */
export class EnvDiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection
  private secretKeys = new Set<string>()
  private disposables: vscode.Disposable[] = []

  constructor() {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection('runenv')
  }

  updateKeys(secrets: Record<string, string>): void {
    this.secretKeys = new Set(Object.keys(secrets))
    // Re-scan all open documents
    for (const editor of vscode.window.visibleTextEditors) {
      this.scanDocument(editor.document)
    }
  }

  clear(): void {
    this.diagnosticCollection.clear()
    this.secretKeys.clear()
  }

  startWatching(): void {
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        this.scanDocument(e.document)
      }),
      vscode.workspace.onDidOpenTextDocument((doc) => {
        this.scanDocument(doc)
      }),
      vscode.workspace.onDidCloseTextDocument((doc) => {
        this.diagnosticCollection.delete(doc.uri)
      })
    )

    // Scan currently open documents
    for (const editor of vscode.window.visibleTextEditors) {
      this.scanDocument(editor.document)
    }
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose())
    this.diagnosticCollection.dispose()
  }

  private scanDocument(document: vscode.TextDocument): void {
    // Only scan code files
    const supportedLangs = [
      'javascript',
      'typescript',
      'javascriptreact',
      'typescriptreact',
      'python',
      'go',
      'rust',
    ]
    if (!supportedLangs.includes(document.languageId)) return
    if (this.secretKeys.size === 0) return

    const text = document.getText()
    const diagnostics: vscode.Diagnostic[] = []

    // Match process.env.KEY_NAME, import.meta.env.KEY_NAME
    const envPattern = /(?:process\.env|import\.meta\.env)\.([A-Z][A-Z0-9_]*)/g
    let match: RegExpExecArray | null

    while ((match = envPattern.exec(text)) !== null) {
      const key = match[1]
      // Skip common built-in env vars
      const builtins = new Set([
        'NODE_ENV',
        'PORT',
        'HOME',
        'PATH',
        'USER',
        'SHELL',
        'TERM',
        'PWD',
        'LANG',
        'HOSTNAME',
        'CI',
        'DEBUG',
      ])
      if (builtins.has(key)) continue

      if (!this.secretKeys.has(key)) {
        const startPos = document.positionAt(
          match.index + match[0].length - key.length
        )
        const endPos = document.positionAt(match.index + match[0].length)
        const range = new vscode.Range(startPos, endPos)

        const diagnostic = new vscode.Diagnostic(
          range,
          `"${key}" not found in RunEnv (${[...this.secretKeys].length} secrets loaded)`,
          vscode.DiagnosticSeverity.Warning
        )
        diagnostic.source = 'RunEnv'
        diagnostic.code = 'missing-secret'
        diagnostics.push(diagnostic)
      }
    }

    this.diagnosticCollection.set(document.uri, diagnostics)
  }
}
