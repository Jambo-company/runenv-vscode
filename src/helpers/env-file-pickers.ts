import * as vscode from 'vscode'
import {
  DEFAULT_ENV_FILE_PRESET_ID,
  type EnvFilePreset,
  getEnvFileProfiles,
  getEnvFilePresets,
  inferEnvFileProfileIdFromFilename,
  resolveEnvFilePresetId,
  type EnvFilePresetId,
  type EnvFileProfile,
} from '../env-files'
import {
  detectWorkspacePreset,
  type WorkspacePresetDetection,
} from 'runenv-shared/workspace-preset'

export function getPresetPickerBadges(
  presetId: EnvFilePresetId,
  currentPresetId: EnvFilePresetId,
  detectedPreset: WorkspacePresetDetection
) {
  const badges = []

  if (presetId === currentPresetId) {
    badges.push(vscode.l10n.t('current'))
  }

  if (presetId === detectedPreset.presetId) {
    badges.push(
      detectedPreset.isAmbiguous
        ? vscode.l10n.t(
            'recommended ({0})',
            vscode.l10n.t('safe default')
          )
        : detectedPreset.projectType === detectedPreset.presetId
          ? vscode.l10n.t('recommended')
          : vscode.l10n.t(
              'recommended ({0})',
              detectedPreset.projectTypeLabel
            )
    )
  }

  return badges
}

export function getPresetPickerDetail(
  preset: EnvFilePreset,
  detectedPreset: WorkspacePresetDetection
) {
  if (preset.id !== detectedPreset.presetId) {
    return preset.description
  }

  if (detectedPreset.isAmbiguous) {
    return `${preset.description} ${vscode.l10n.t(
      'Mixed workspace markers were found ({0}). RunEnv preselects the safer generic preset, so review this choice before saving.',
      detectedPreset.reason
    )}`
  }

  if (detectedPreset.projectType !== detectedPreset.presetId) {
    return `${preset.description} ${vscode.l10n.t(
      'Auto-detected for {0} from {1}.',
      detectedPreset.projectTypeLabel,
      detectedPreset.reason
    )}`
  }

  return `${preset.description} ${vscode.l10n.t(
    'Auto-detected from {0}.',
    detectedPreset.reason
  )}`
}

export async function pickPreset(
  workspaceRoot: string,
  currentPresetId?: EnvFilePresetId | null
): Promise<EnvFilePresetId | null> {
  const detectedPreset = detectWorkspacePreset(workspaceRoot)
  const savedPresetId = resolveEnvFilePresetId(
    currentPresetId,
    DEFAULT_ENV_FILE_PRESET_ID
  )
  const detectedPresetId = detectedPreset.presetId
  const orderedPresets = getEnvFilePresets().sort((left, right) => {
    const score = (presetId: EnvFilePresetId) =>
      Number(presetId === savedPresetId) * 2 +
      Number(presetId === detectedPresetId)
    return score(right.id) - score(left.id)
  })

  const picked = await vscode.window.showQuickPick(
    orderedPresets.map((preset) => {
      const badges = getPresetPickerBadges(
        preset.id,
        savedPresetId,
        detectedPreset
      )
      return {
        label:
          preset.id === savedPresetId
            ? `$(check) ${preset.title}`
            : preset.title,
        description: badges.join(' · '),
        detail: getPresetPickerDetail(preset, detectedPreset),
        presetId: preset.id,
      }
    }),
    {
      placeHolder: vscode.l10n.t(
        'What kind of app is this folder? RunEnv uses this to suggest the right env filenames.'
      ),
    }
  )

  return picked?.presetId ?? null
}

export function getEnvFileProfilePickerCopy(profile: EnvFileProfile): {
  label: string
  description: string
} {
  switch (profile.id) {
    case 'base':
      return {
        label: vscode.l10n.t('Base shared env · {0}', profile.filename),
        description: vscode.l10n.t('Shared defaults for the team'),
      }
    case 'local':
      return {
        label: vscode.l10n.t('Local override · {0}', profile.filename),
        description: vscode.l10n.t('Private values that only affect your machine'),
      }
    case 'environment':
      return {
        label: vscode.l10n.t('Environment env · {0}', profile.filename),
        description: vscode.l10n.t('Shared values for the selected environment'),
      }
    case 'environmentLocal':
      return {
        label: vscode.l10n.t(
          'Environment local override · {0}',
          profile.filename
        ),
        description: vscode.l10n.t(
          'Private environment-specific values for your machine'
        ),
      }
    case 'example':
      return {
        label: vscode.l10n.t('Example template · {0}', profile.filename),
        description: vscode.l10n.t('Keys only, safe to share'),
      }
  }
}

export async function pickEnvFileProfile(
  environmentName: string,
  presetId: EnvFilePresetId,
  options: {
    filePath?: string | null
    placeHolder: string
    allowTemplate?: boolean
  }
): Promise<EnvFileProfile | null> {
  const preferredProfileId =
    inferEnvFileProfileIdFromFilename(
      environmentName,
      options.filePath,
      presetId
    ) || 'environment'
  const orderedProfiles = getEnvFileProfiles(environmentName, presetId)
    .filter((profile) => options.allowTemplate || profile.importTarget !== null)
    .sort(
      (left, right) =>
        Number(right.id === preferredProfileId) -
        Number(left.id === preferredProfileId)
    )

  const picked = await vscode.window.showQuickPick(
    orderedProfiles.map((profile) => {
      const copy = getEnvFileProfilePickerCopy(profile)
      return {
        label:
          profile.id === preferredProfileId
            ? `$(check) ${copy.label}`
            : copy.label,
        description: copy.description,
        detail: profile.description,
        profile,
      }
    }),
    { placeHolder: options.placeHolder }
  )

  return picked?.profile ?? null
}

export function getProfileMeaning(profile: EnvFileProfile) {
  switch (profile.id) {
    case 'base':
      return vscode.l10n.t('Shared base env for the project')

    case 'local':
      return vscode.l10n.t('Personal override that only affects your machine')
    case 'environment':
      return vscode.l10n.t('Shared env file for the selected environment')
    case 'environmentLocal':
      return vscode.l10n.t(
        'Personal environment-specific override for your machine'
      )
    case 'example':
      return vscode.l10n.t('Template file with keys only, safe to share')
  }
}

export type ImportScopeChoice = 'shared' | 'local'

export function getRecommendedImportScope(
  profileId: EnvFileProfile['id'] | null
): ImportScopeChoice {
  return profileId === 'local' || profileId === 'environmentLocal'
    ? 'local'
    : 'shared'
}

export async function pickImportProfile(
  environmentName: string,
  presetId: EnvFilePresetId,
  filePath: string
): Promise<EnvFileProfile | null> {
  const preferredProfileId =
    inferEnvFileProfileIdFromFilename(environmentName, filePath, presetId) ||
    'environment'
  const recommendedScope = getRecommendedImportScope(preferredProfileId)
  const selectedScope = await vscode.window.showQuickPick(
    [
      {
        label:
          recommendedScope === 'shared'
            ? `$(check) ${vscode.l10n.t('Shared secrets')}`
            : vscode.l10n.t('Shared secrets'),
        description: vscode.l10n.t('Visible to the team or environment'),
        detail:
          vscode.l10n.t(
            'Use this for values that should sync across users, CI, and deployments.'
          ),
        scope: 'shared' as const,
      },
      {
        label:
          recommendedScope === 'local'
            ? `$(check) ${vscode.l10n.t('Local overrides')}`
            : vscode.l10n.t('Local overrides'),
        description: vscode.l10n.t('Only affects your machine'),
        detail:
          vscode.l10n.t(
            'Use this for personal machine values such as `.env.local` and developer-specific overrides.'
          ),
        scope: 'local' as const,
      },
    ],
    {
      placeHolder: vscode.l10n.t(
        'Step 1 of 2: Choose where these values should live'
      ),
    }
  )
  if (!selectedScope) return null

  const orderedProfiles = getEnvFileProfiles(environmentName, presetId)
    .filter(
      (profile) =>
        profile.importTarget !== null && profile.scope === selectedScope.scope
    )
    .sort(
      (left, right) =>
        Number(right.id === preferredProfileId) -
        Number(left.id === preferredProfileId)
    )

  const picked = await vscode.window.showQuickPick(
    orderedProfiles.map((profile) => {
      const copy = getEnvFileProfilePickerCopy(profile)
      return {
        label:
          profile.id === preferredProfileId
            ? `$(check) ${copy.label}`
            : copy.label,
        description: copy.description,
        detail: vscode.l10n.t(
          '{0} This imports as {1}.',
          profile.description,
          getProfileMeaning(profile)
        ),
        profile,
      }
    }),
    {
      placeHolder:
        vscode.l10n.t(
          'Step 2 of 2: Choose the exact env file profile for this import'
        ),
    }
  )

  return picked?.profile ?? null
}
