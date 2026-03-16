export function formatPreviewKeyList(
  keys: string[],
  options: {
    maxItems?: number
    emptyMessage?: string
  } = {}
) {
  const maxItems = options.maxItems ?? 20
  if (keys.length === 0) {
    return options.emptyMessage || '- No keys found'
  }

  const visibleKeys = keys.slice(0, maxItems)
  const lines = visibleKeys.map((key) => `- ${key}`)

  if (keys.length > visibleKeys.length) {
    lines.push(`- ...and ${keys.length - visibleKeys.length} more`)
  }

  return lines.join('\n')
}

export function buildImportPreviewContent(options: {
  fileName: string
  fullPath: string
  project: string
  env: string
  profileLabel: string
  profileDescription: string
  keys: string[]
  existingValueCount?: number
  newKeys?: string[]
  changedKeys?: string[]
  unchangedKeys?: string[]
}) {
  const newKeys = options.newKeys || []
  const changedKeys = options.changedKeys || []
  const unchangedKeys = options.unchangedKeys || []

  return [
    '# RunEnv Import Preview',
    '',
    `File: ${options.fileName}`,
    `Path: ${options.fullPath}`,
    `Project: ${options.project}`,
    `Environment: ${options.env}`,
    `Import target: ${options.profileLabel}`,
    `Meaning: ${options.profileDescription}`,
    `Values found: ${options.keys.length}`,
    ...(typeof options.existingValueCount === 'number'
      ? [
          `Current target values: ${options.existingValueCount}`,
          `New keys: ${newKeys.length}`,
          `Changed keys: ${changedKeys.length}`,
          `Unchanged keys: ${unchangedKeys.length}`,
        ]
      : []),
    '',
    ...(typeof options.existingValueCount === 'number'
      ? [
          'Import summary',
          ...(
            newKeys.length > 0
              ? ['New keys', formatPreviewKeyList(newKeys, { maxItems: 10 })]
              : []
          ),
          ...(
            changedKeys.length > 0
              ? ['Changed keys', formatPreviewKeyList(changedKeys, { maxItems: 10 })]
              : []
          ),
          ...(
            unchangedKeys.length > 0
              ? ['Unchanged keys', formatPreviewKeyList(unchangedKeys, { maxItems: 10 })]
              : []
          ),
          '',
        ]
      : []),
    'Keys',
    formatPreviewKeyList(options.keys),
    '',
    'This preview never writes to disk.',
  ].join('\n')
}

export function buildImportResultContent(options: {
  fileName: string
  fullPath: string
  project: string
  env: string
  presetTitle: string
  profileLabel: string
  profileDescription: string
  keys: string[]
  sourceFileStillExists: boolean
  importModeLabel?: string
  addedCount?: number
  updatedCount?: number
  skippedConflictCount?: number
  skippedUnchangedCount?: number
}) {
  return [
    '# RunEnv Import Complete',
    '',
    `File: ${options.fileName}`,
    `Path: ${options.fullPath}`,
    `Project: ${options.project}`,
    `Environment: ${options.env}`,
    `Preset: ${options.presetTitle}`,
    `Import target: ${options.profileLabel}`,
    `Meaning: ${options.profileDescription}`,
    `Import mode: ${options.importModeLabel || 'Overwrite existing values'}`,
    '',
    '## Before',
    `- ${options.fileName} stored ${options.keys.length} value${options.keys.length === 1 ? '' : 's'} on disk`,
    `- Values were only available to tools reading ${options.fileName}`,
    '',
    '## After',
    `- Values imported: ${options.keys.length}`,
    `- Added: ${options.addedCount ?? options.keys.length}`,
    `- Updated: ${options.updatedCount ?? 0}`,
    `- Skipped conflicts: ${options.skippedConflictCount ?? 0}`,
    `- Skipped unchanged: ${options.skippedUnchangedCount ?? 0}`,
    `- Source file: ${options.sourceFileStillExists ? 'Still on disk' : 'Removed'}`,
    '- Secrets loaded into VS Code: Yes',
    `- RunEnv target: ${options.profileLabel}`,
    '',
    'Keys',
    formatPreviewKeyList(options.keys),
    '',
    'Next steps',
    '- Open Terminal to use these values right away',
    '- View Secrets to confirm the imported keys in RunEnv',
    options.sourceFileStillExists
      ? '- Delete the old file if RunEnv is now your source of truth'
      : '- The original file is already gone, so this workspace now depends on RunEnv',
  ].join('\n')
}

export function buildGeneratePreviewContent(options: {
  filename: string
  fullPath: string
  project: string
  env: string
  presetTitle: string
  profileLabel: string
  overwrite: boolean
  keys: string[]
}) {
  return [
    '# RunEnv File Preview',
    '',
    `Output file: ${options.filename}`,
    `Path: ${options.fullPath}`,
    `Project: ${options.project}`,
    `Environment: ${options.env}`,
    `Preset: ${options.presetTitle}`,
    `Profile: ${options.profileLabel}`,
    `Mode: ${options.overwrite ? 'Overwrite existing file' : 'Create new file'}`,
    `Keys included: ${options.keys.length}`,
    '',
    'Keys',
    formatPreviewKeyList(options.keys),
    '',
    'Secret values are never shown in this preview.',
  ].join('\n')
}

export function buildGenerateResultContent(options: {
  filename: string
  fullPath: string
  project: string
  env: string
  presetTitle: string
  profileLabel: string
  profileDescription: string
  overwrite: boolean
  keys: string[]
  gitignoreStatus: 'created' | 'updated' | 'alreadyIgnored' | 'notNeeded'
  safeToShare: boolean
}) {
  const gitignoreLine =
    options.gitignoreStatus === 'created'
      ? `.gitignore: Created and added ${options.filename}`
      : options.gitignoreStatus === 'updated'
        ? `.gitignore: Added ${options.filename}`
        : options.gitignoreStatus === 'alreadyIgnored'
          ? `.gitignore: Already covered for ${options.filename}`
          : '.gitignore: Not needed for this template file'

  return [
    '# RunEnv File Ready',
    '',
    `Output file: ${options.filename}`,
    `Path: ${options.fullPath}`,
    `Project: ${options.project}`,
    `Environment: ${options.env}`,
    `Preset: ${options.presetTitle}`,
    `Profile: ${options.profileLabel}`,
    `Meaning: ${options.profileDescription}`,
    '',
    '## Before',
    options.overwrite
      ? `- ${options.filename} already existed and was replaced`
      : `- ${options.filename} did not exist in this workspace`,
    `- Required handling: ${options.safeToShare ? 'Safe to share' : 'Do not commit'}`,
    '',
    '## After',
    `- Mode: ${options.overwrite ? 'Overwrote existing file' : 'Created new file'}`,
    `- Keys written: ${options.keys.length}`,
    `- Sharing: ${options.safeToShare ? 'Safe to share' : 'Do not commit'}`,
    `- ${gitignoreLine}`,
    '',
    'Keys',
    formatPreviewKeyList(options.keys),
    '',
    'Next steps',
    options.safeToShare
      ? '- Open the template and fill values locally or in CI'
      : '- Open the generated file if you want to inspect the current local values',
    options.safeToShare
      ? '- Share or commit this template if teammates need the key names'
      : '- Open Terminal to use the generated file with your current tools',
    options.safeToShare
      ? '- Keep secret values in RunEnv, not in this template'
      : '- Keep this file out of git even if your tool needs it on disk',
  ].join('\n')
}

export function buildPresetUpdateResultContent(options: {
  project: string
  env: string
  previousPresetTitle: string
  currentPresetTitle: string
  matches: string[]
  recommendedGenerateFilename: string
  recommendedTemplateFilename: string
}) {
  return [
    '# RunEnv Preset Updated',
    '',
    `Project: ${options.project}`,
    `Environment: ${options.env}`,
    '',
    '## Before',
    `- Preset: ${options.previousPresetTitle}`,
    '',
    '## After',
    `- Preset: ${options.currentPresetTitle}`,
    `- Recommended generate target: ${options.recommendedGenerateFilename}`,
    `- Recommended template target: ${options.recommendedTemplateFilename}`,
    '',
    'Why this change was recommended',
    formatPreviewKeyList(options.matches, {
      maxItems: 6,
      emptyMessage: '- No matching local env files were detected',
    }),
    '',
    'Next steps',
    '- Import .env File if you want to migrate the detected files into RunEnv',
    '- Generate .env File if a local tool still needs files on disk',
    '- Open .runenv.json if you want to review the workspace mapping',
  ].join('\n')
}
