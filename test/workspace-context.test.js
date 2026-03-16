const { installVscodeMock } = require('./helpers/vscode-mock')
installVscodeMock()

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const {
  buildWorkspaceSurfaceState,
  getWorkspaceInsights,
  getRecommendedMenuAction,
  getPresetRecommendation,
  getWorkspaceEnvFileGuidance,
} = require('../dist/workspace-context.js')
const { detectWorkspacePreset } = require('runenv-shared/workspace-preset')

test('workspace context detects env files and package scripts', () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'runenv-workspace-'))

  fs.writeFileSync(
    path.join(workspaceRoot, 'package.json'),
    JSON.stringify({ scripts: { dev: 'vite', test: 'node --test' } })
  )
  fs.writeFileSync(path.join(workspaceRoot, '.env.local'), 'API_KEY=test\n')
  fs.writeFileSync(
    path.join(workspaceRoot, '.runenv.json'),
    JSON.stringify({ project: 'demo', env: 'development' })
  )

  const insights = getWorkspaceInsights({
    workspaceRoot,
    environmentName: 'development',
  })

  assert.equal(insights.packageScriptCount, 2)
  assert.equal(insights.hasProjectConfig, true)
  assert.equal(insights.envFiles[0].name, '.env.local')
})

test('workspace preset detection prefers config-file markers', () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'runenv-preset-'))
  fs.writeFileSync(path.join(workspaceRoot, 'vite.config.ts'), 'export default {}\n')

  const detection = detectWorkspacePreset(workspaceRoot)

  assert.equal(detection.presetId, 'vite')
  assert.equal(detection.projectType, 'vite')
  assert.equal(detection.reason, 'vite.config.ts')
  assert.equal(detection.source, 'config-file')
})

test('workspace preset detection finds nested monorepo app markers', () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'runenv-preset-nested-'))
  const appRoot = path.join(workspaceRoot, 'apps', 'dashboard')
  fs.mkdirSync(appRoot, { recursive: true })
  fs.writeFileSync(path.join(appRoot, 'vite.config.ts'), 'export default {}\n')

  const detection = detectWorkspacePreset(workspaceRoot)

  assert.equal(detection.presetId, 'vite')
  assert.equal(detection.reason, 'apps/dashboard/vite.config.ts')
  assert.equal(detection.source, 'config-file')
})

test('workspace preset detection prefers nested app frameworks over a root docker compose file', () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'runenv-preset-docker-root-'))
  const appRoot = path.join(workspaceRoot, 'apps', 'web')
  fs.mkdirSync(appRoot, { recursive: true })
  fs.writeFileSync(path.join(workspaceRoot, 'docker-compose.yml'), 'services: {}\n')
  fs.writeFileSync(path.join(appRoot, 'next.config.ts'), 'export default {}\n')

  const detection = detectWorkspacePreset(workspaceRoot)

  assert.equal(detection.presetId, 'nextjs')
  assert.equal(detection.reason, 'apps/web/next.config.ts')
  assert.equal(detection.source, 'config-file')
})

test('workspace preset detection prefers current-directory markers over nested apps', () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'runenv-preset-root-'))
  fs.writeFileSync(path.join(workspaceRoot, 'vite.config.ts'), 'export default {}\n')

  const appRoot = path.join(workspaceRoot, 'apps', 'web')
  fs.mkdirSync(appRoot, { recursive: true })
  fs.writeFileSync(path.join(appRoot, 'next.config.ts'), 'export default {}\n')

  const detection = detectWorkspacePreset(workspaceRoot)

  assert.equal(detection.presetId, 'vite')
  assert.equal(detection.reason, 'vite.config.ts')
  assert.equal(detection.scope, 'current-directory')
  assert.equal(detection.isAmbiguous, false)
})

test('workspace preset detection falls back to node for mixed nested workspaces', () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'runenv-preset-mixed-'))
  const nextAppRoot = path.join(workspaceRoot, 'apps', 'web')
  const viteAppRoot = path.join(workspaceRoot, 'apps', 'desktop')
  fs.mkdirSync(nextAppRoot, { recursive: true })
  fs.mkdirSync(viteAppRoot, { recursive: true })
  fs.writeFileSync(path.join(nextAppRoot, 'next.config.ts'), 'export default {}\n')
  fs.writeFileSync(path.join(viteAppRoot, 'vite.config.ts'), 'export default {}\n')

  const detection = detectWorkspacePreset(workspaceRoot)

  assert.equal(detection.presetId, 'node')
  assert.equal(detection.projectType, 'mixed')
  assert.equal(detection.projectTypeLabel, 'Mixed workspace')
  assert.equal(detection.source, 'ambiguous')
  assert.equal(detection.scope, 'nested-workspace')
  assert.equal(detection.isAmbiguous, true)
  assert.deepEqual(
    detection.candidates.map((candidate) => candidate.reason),
    ['apps/desktop/vite.config.ts', 'apps/web/next.config.ts']
  )
})

test('workspace preset detection maps Flutter workspaces to the Flutter preset', () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'runenv-flutter-'))
  fs.writeFileSync(
    path.join(workspaceRoot, 'pubspec.yaml'),
    'name: demo_app\nflutter:\n  uses-material-design: true\n'
  )

  const detection = detectWorkspacePreset(workspaceRoot)

  assert.equal(detection.presetId, 'flutter')
  assert.equal(detection.projectType, 'flutter')
  assert.equal(detection.projectTypeLabel, 'Flutter')
  assert.equal(detection.reason, 'pubspec.yaml')
  assert.equal(detection.source, 'config-file')
})

test('workspace context recommends import after secrets are loaded', () => {
  const action = getRecommendedMenuAction({
    issue: null,
    workspaceRoot: '/tmp/demo',
    loggedIn: true,
    projectConfigured: true,
    sessionLoaded: true,
    envFileCount: 1,
    packageScriptCount: 2,
  })

  assert.equal(action.label, 'Import .env File')
})

test('workspace context builds preset recommendation from env file guidance', () => {
  const guidance = getWorkspaceEnvFileGuidance(
    {
      env: 'development',
      preset: 'dockerCompose',
    },
    {
      workspaceRoot: '/tmp/demo',
      envFiles: [{ name: '.env.local', fullPath: '/tmp/demo/.env.local' }],
      packageScriptCount: 0,
      hasProjectConfig: true,
    }
  )

  const recommendation = getPresetRecommendation(guidance)

  assert.equal(recommendation.targetTitle, 'Next.js')
  assert.match(recommendation.detail, /\.env\.local -> Local override/)
})

test('workspace surface state keeps setup status and next step in one place', () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'runenv-surface-'))

  fs.writeFileSync(
    path.join(workspaceRoot, 'package.json'),
    JSON.stringify({ scripts: { dev: 'vite' } })
  )
  fs.writeFileSync(path.join(workspaceRoot, '.env.local'), 'API_KEY=test\n')
  fs.writeFileSync(path.join(workspaceRoot, 'pubspec.yaml'), 'flutter:\n  assets:\n    - .env\n')

  const surface = buildWorkspaceSurfaceState({
    project: {
      project: 'demo',
      env: 'development',
      preset: 'dockerCompose',
    },
    workspaceRoot,
    loggedIn: true,
    email: 'dev@example.com',
    issue: null,
    sessionLoaded: false,
    loadedSecretCount: 0,
  })

  assert.equal(surface.setupIncomplete, true)
  assert.equal(surface.nextStep.label, 'Load Secrets')
  assert.equal(surface.presetRecommendation.targetTitle, 'Next.js')
  assert.deepEqual(
    surface.highlightedAdvancedActions.map((action) => action.id),
    ['generateDotenv', 'setupFlutterDebug', 'wrapScripts']
  )
})

test('workspace surface state adds smoke checklist after setup is complete', () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'runenv-surface-ready-'))

  fs.writeFileSync(
    path.join(workspaceRoot, 'package.json'),
    JSON.stringify({ scripts: { dev: 'vite' } })
  )

  const surface = buildWorkspaceSurfaceState({
    project: {
      project: 'demo',
      env: 'development',
      preset: 'nextjs',
    },
    workspaceRoot,
    loggedIn: true,
    email: 'dev@example.com',
    issue: null,
    sessionLoaded: true,
    loadedSecretCount: 2,
  })

  assert.equal(surface.setupIncomplete, false)
  assert.equal(surface.nextStep.label, 'Run Script')
  assert.deepEqual(
    surface.highlightedAdvancedActions.map((action) => action.id),
    ['generateDotenv', 'wrapScripts', 'smokeChecklist']
  )
})
