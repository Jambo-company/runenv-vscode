import * as fs from 'fs'
import * as path from 'path'
import { parse, printParseErrorCode, type ParseError } from 'jsonc-parser'

function getLineAndColumn(text: string, offset: number) {
  let line = 1
  let column = 1

  for (let index = 0; index < offset; index++) {
    if (text[index] === '\n') {
      line += 1
      column = 1
      continue
    }

    column += 1
  }

  return { line, column }
}

function formatParseErrors(text: string, errors: ParseError[]) {
  return errors
    .map((error) => {
      const { line, column } = getLineAndColumn(text, error.offset)
      return `${printParseErrorCode(error.error)} at ${line}:${column}`
    })
    .join(', ')
}

export function parseJsoncObject<T extends Record<string, unknown>>(
  text: string,
  sourceLabel: string
): T {
  const errors: ParseError[] = []
  const parsed = parse(text, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  })

  if (errors.length > 0) {
    throw new Error(
      `Invalid JSON in ${sourceLabel}: ${formatParseErrors(text, errors)}`
    )
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${sourceLabel} must contain a JSON object.`)
  }

  return parsed as T
}

export function readJsoncObjectFromFile<T extends Record<string, unknown>>(
  filePath: string
): T {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return parseJsoncObject<T>(raw, path.basename(filePath))
}
