export interface RunenvShellTaskDefinition extends Record<string, unknown> {
  label: string
  type: 'shell'
  command: string
  args: string[]
  presentation: {
    reveal: 'silent'
  }
  problemMatcher: string[]
}

function createRunenvShellTask(
  label: string,
  args: string[]
): RunenvShellTaskDefinition {
  return {
    label,
    type: 'shell',
    command: 'runenv',
    args,
    presentation: { reveal: 'silent' },
    problemMatcher: [],
  }
}

export function buildRunenvDotenvTask() {
  return createRunenvShellTask('runenv-dotenv', ['dotenv'])
}

export function buildRunenvDotenvCleanTask() {
  return createRunenvShellTask('runenv-dotenv-clean', ['dotenv', '--clean'])
}

export function getWrapScriptsPrefix() {
  return 'runenv run --'
}

export function wrapScriptCommand(originalCommand: string) {
  return `${getWrapScriptsPrefix()} ${originalCommand}`
}
