import * as fs from 'fs'
import { buildDotenvAssignments } from 'runenv-shared/dotenv'

export function parseEnvFile(content: string): Record<string, string> {
  const secrets: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const normalized = trimmed.startsWith('export ')
      ? trimmed.slice('export '.length).trim()
      : trimmed
    const eqIndex = normalized.indexOf('=')
    if (eqIndex === -1) continue
    const key = normalized.slice(0, eqIndex).trim()
    let value = normalized.slice(eqIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (key) secrets[key] = value
  }
  return secrets
}

export function writeDotenvFile(
  outputPath: string,
  headerLines: string[],
  secrets: Record<string, string>
) {
  const header = headerLines.join('\n')
  const body = buildDotenvAssignments(secrets)
  const content = body ? `${header}\n${body}\n` : `${header}\n`

  fs.writeFileSync(outputPath, content, { mode: 0o600 })
}
