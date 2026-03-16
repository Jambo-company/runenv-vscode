import * as vscode from 'vscode'

export async function showMarkdownDocument(
  content: string,
  preview = true
): Promise<void> {
  const doc = await vscode.workspace.openTextDocument({
    content,
    language: 'markdown',
  })
  await vscode.window.showTextDocument(doc, { preview })
}
