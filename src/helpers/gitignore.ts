import * as fs from 'fs'
import * as path from 'path'

export type GitignoreStatus =
  | 'created'
  | 'updated'
  | 'alreadyIgnored'
  | 'notNeeded'

export function ensureGitignore(
  workspaceRoot: string,
  filename: string
): Exclude<GitignoreStatus, 'notNeeded'> {
  const gitignorePath = path.join(workspaceRoot, '.gitignore')

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, `# RunEnv\n${filename}\n`)
    return 'created'
  }

  const content = fs.readFileSync(gitignorePath, 'utf-8')
  const lines = content.split('\n').map((line) => line.trim())

  if (
    lines.includes(filename) ||
    lines.includes('.env') ||
    lines.includes('.env*')
  ) {
    return 'alreadyIgnored'
  }

  const suffix = content.endsWith('\n') ? '' : '\n'
  fs.appendFileSync(gitignorePath, `${suffix}\n# RunEnv\n${filename}\n`)
  return 'updated'
}
