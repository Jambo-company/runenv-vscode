export interface ImportDiff {
  incomingCount: number
  existingCount: number
  newKeys: string[]
  changedKeys: string[]
  unchangedKeys: string[]
}

export type ImportMode = 'overwrite' | 'addOnly'

export interface ImportPlan {
  mode: ImportMode
  secrets: Record<string, string>
  importedKeys: string[]
  addedCount: number
  updatedCount: number
  skippedConflictCount: number
  skippedUnchangedCount: number
}

export function buildImportDiff(
  incomingSecrets: Record<string, string>,
  existingSecrets: Record<string, string>
): ImportDiff {
  const newKeys: string[] = []
  const changedKeys: string[] = []
  const unchangedKeys: string[] = []

  for (const key of Object.keys(incomingSecrets).sort()) {
    if (!(key in existingSecrets)) {
      newKeys.push(key)
      continue
    }

    if (existingSecrets[key] === incomingSecrets[key]) {
      unchangedKeys.push(key)
    } else {
      changedKeys.push(key)
    }
  }

  return {
    incomingCount: Object.keys(incomingSecrets).length,
    existingCount: Object.keys(existingSecrets).length,
    newKeys,
    changedKeys,
    unchangedKeys,
  }
}

export function buildImportPlan(
  incomingSecrets: Record<string, string>,
  diff: ImportDiff,
  mode: ImportMode
): ImportPlan {
  const importedKeys =
    mode === 'overwrite'
      ? [...diff.newKeys, ...diff.changedKeys].sort()
      : [...diff.newKeys].sort()

  const secrets = importedKeys.reduce<Record<string, string>>((acc, key) => {
    acc[key] = incomingSecrets[key]
    return acc
  }, {})

  return {
    mode,
    secrets,
    importedKeys,
    addedCount: diff.newKeys.length,
    updatedCount: mode === 'overwrite' ? diff.changedKeys.length : 0,
    skippedConflictCount: mode === 'addOnly' ? diff.changedKeys.length : 0,
    skippedUnchangedCount: diff.unchangedKeys.length,
  }
}
