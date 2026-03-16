export interface EnvironmentVariableCollectionLike {
  persistent: boolean
  description: unknown
  clear(): void
  replace(variable: string, value: string): void
}

export function applyRunenvEnvironmentCollection(
  collection: EnvironmentVariableCollectionLike,
  project: string,
  env: string,
  secrets: Record<string, string>,
  count = Object.keys(secrets).length
) {
  collection.persistent = false
  collection.clear()
  collection.description = `RunEnv: ${project}/${env} (${count} secrets)`

  for (const [key, value] of Object.entries(secrets)) {
    collection.replace(key, value)
  }
}

export function clearRunenvEnvironmentCollection(
  collection: EnvironmentVariableCollectionLike
) {
  collection.persistent = false
  collection.description = undefined
  collection.clear()
}
