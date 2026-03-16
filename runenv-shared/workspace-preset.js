'use strict'

const fs = require('fs')
const path = require('path')

const BASE_IGNORED_DIRECTORY_NAMES = new Set([
  '.git',
  '.hg',
  '.next',
  '.nuxt',
  '.turbo',
  '.yarn',
  'coverage',
  'dist',
  'build',
  'node_modules',
  'vendor',
])

const DEFAULT_MAX_SCAN_DEPTH = 3

const DOCKER_COMPOSE_FILENAMES = [
  'docker-compose.yml',
  'docker-compose.yaml',
  'compose.yml',
  'compose.yaml',
]

const NEXT_CONFIG_FILENAMES = [
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'next.config.cjs',
]

const VITE_CONFIG_FILENAMES = [
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.ts',
  'vite.config.cjs',
]

const PROJECT_TYPE_LABELS = {
  nextjs: 'Next.js',
  vite: 'Vite',
  flutter: 'Flutter',
  dockerCompose: 'Docker Compose',
  node: 'Node / dotenv',
  mixed: 'Mixed workspace',
}

function buildDetection({
  presetId,
  reason,
  source,
  projectType = presetId,
  scope = 'current-directory',
  candidates,
}) {
  return {
    presetId,
    reason,
    source,
    projectType,
    projectTypeLabel: PROJECT_TYPE_LABELS[projectType],
    scope,
    isAmbiguous: source === 'ambiguous',
    candidates: Array.isArray(candidates) ? candidates : [],
  }
}

function normalizeRelativePath(workspaceRoot, absolutePath) {
  return path.relative(workspaceRoot, absolutePath).split(path.sep).join('/')
}

function getPresetScanOptions() {
  const ignoredDirectoryNames = new Set(BASE_IGNORED_DIRECTORY_NAMES)
  const rawIgnored = process.env.RUNENV_PRESET_SCAN_IGNORE || ''
  for (const entry of rawIgnored.split(',')) {
    const normalized = entry.trim()
    if (normalized) {
      ignoredDirectoryNames.add(normalized)
    }
  }

  const parsedDepth = Number.parseInt(
    process.env.RUNENV_PRESET_SCAN_DEPTH || '',
    10
  )

  return {
    ignoredDirectoryNames,
    maxDepth:
      Number.isFinite(parsedDepth) && parsedDepth > 0
        ? parsedDepth
        : DEFAULT_MAX_SCAN_DEPTH,
  }
}

function listChildDirectories(currentDir, ignoredDirectoryNames) {
  try {
    return fs
      .readdirSync(currentDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() && !ignoredDirectoryNames.has(entry.name)
      )
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right))
  } catch {
    return []
  }
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return null
  }
}

function hasDependency(pkg, dependencyName) {
  if (!pkg) {
    return false
  }

  const deps = {
    ...(typeof pkg.dependencies === 'object' && pkg.dependencies
      ? pkg.dependencies
      : {}),
    ...(typeof pkg.devDependencies === 'object' && pkg.devDependencies
      ? pkg.devDependencies
      : {}),
  }

  return dependencyName in deps
}

function isFlutterWorkspace(pubspec) {
  if (!pubspec) {
    return false
  }

  return (
    pubspec.includes('\nflutter:') ||
    pubspec.startsWith('flutter:') ||
    pubspec.includes('flutter_dotenv:')
  )
}

function findFileInDirectory(workspaceRoot, directoryPath, candidates) {
  for (const filename of candidates) {
    const absolutePath = path.join(directoryPath, filename)
    if (fs.existsSync(absolutePath)) {
      return normalizeRelativePath(workspaceRoot, absolutePath)
    }
  }

  return null
}

function findPackageJsonDependencyInDirectory(
  workspaceRoot,
  directoryPath,
  dependencyName
) {
  const packageJsonPath = path.join(directoryPath, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    return null
  }

  const pkg = readJsonFile(packageJsonPath)
  if (!hasDependency(pkg, dependencyName)) {
    return null
  }

  return normalizeRelativePath(workspaceRoot, packageJsonPath)
}

function detectDockerComposePreset(workspaceRoot, directoryPath, scope) {
  const dockerComposeFile = findFileInDirectory(
    workspaceRoot,
    directoryPath,
    DOCKER_COMPOSE_FILENAMES
  )
  if (!dockerComposeFile) {
    return null
  }

  return buildDetection({
    presetId: 'dockerCompose',
    reason: dockerComposeFile,
    source: 'config-file',
    scope,
  })
}

function detectDirectoryPreset(workspaceRoot, directoryPath, scope) {
  const nextConfigFile = findFileInDirectory(
    workspaceRoot,
    directoryPath,
    NEXT_CONFIG_FILENAMES
  )
  if (nextConfigFile) {
    return buildDetection({
      presetId: 'nextjs',
      reason: nextConfigFile,
      source: 'config-file',
      scope,
    })
  }

  const viteConfigFile = findFileInDirectory(
    workspaceRoot,
    directoryPath,
    VITE_CONFIG_FILENAMES
  )
  if (viteConfigFile) {
    return buildDetection({
      presetId: 'vite',
      reason: viteConfigFile,
      source: 'config-file',
      scope,
    })
  }

  const pubspecPath = findFileInDirectory(workspaceRoot, directoryPath, [
    'pubspec.yaml',
  ])
  const pubspec = pubspecPath
    ? readTextFile(path.join(workspaceRoot, pubspecPath))
    : null
  if (pubspecPath && isFlutterWorkspace(pubspec)) {
    return buildDetection({
      presetId: 'flutter',
      reason: pubspecPath,
      source: 'config-file',
      scope,
    })
  }

  const nextPackageJson = findPackageJsonDependencyInDirectory(
    workspaceRoot,
    directoryPath,
    'next'
  )
  if (nextPackageJson) {
    return buildDetection({
      presetId: 'nextjs',
      reason:
        nextPackageJson === 'package.json'
          ? 'package.json dependency: next'
          : `${nextPackageJson} dependency: next`,
      source: 'package-json',
      scope,
    })
  }

  const vitePackageJson = findPackageJsonDependencyInDirectory(
    workspaceRoot,
    directoryPath,
    'vite'
  )
  if (vitePackageJson) {
    return buildDetection({
      presetId: 'vite',
      reason:
        vitePackageJson === 'package.json'
          ? 'package.json dependency: vite'
          : `${vitePackageJson} dependency: vite`,
      source: 'package-json',
      scope,
    })
  }

  return detectDockerComposePreset(workspaceRoot, directoryPath, scope)
}

function collectNestedWorkspaceDetections(
  workspaceRoot,
  {
    maxDepth = DEFAULT_MAX_SCAN_DEPTH,
    ignoredDirectoryNames,
  }
) {
  const detections = []

  function visit(currentDir, depth) {
    if (depth > maxDepth) {
      return
    }

    const detected = detectDirectoryPreset(
      workspaceRoot,
      currentDir,
      'nested-workspace'
    )
    if (detected) {
      detections.push({ ...detected, depth })
      return
    }

    for (const childName of listChildDirectories(
      currentDir,
      ignoredDirectoryNames
    )) {
      visit(path.join(currentDir, childName), depth + 1)
    }
  }

  for (const childName of listChildDirectories(
    workspaceRoot,
    ignoredDirectoryNames
  )) {
    visit(path.join(workspaceRoot, childName), 1)
  }

  return detections
}

function compareDetections(left, right) {
  if (left.depth !== right.depth) {
    return left.depth - right.depth
  }

  return left.reason.localeCompare(right.reason)
}

function prioritizeWorkspaceDetections(detections) {
  if (detections.some((detection) => detection.presetId !== 'dockerCompose')) {
    return detections.filter((detection) => detection.presetId !== 'dockerCompose')
  }

  return detections
}

function detectWorkspacePreset(workspaceRoot) {
  const scanOptions = getPresetScanOptions()
  const rootDetection = detectDirectoryPreset(
    workspaceRoot,
    workspaceRoot,
    'current-directory'
  )
  if (rootDetection && rootDetection.presetId !== 'dockerCompose') {
    return rootDetection
  }

  const nestedDetections = collectNestedWorkspaceDetections(
    workspaceRoot,
    scanOptions
  )
  const prioritizedDetections = prioritizeWorkspaceDetections(nestedDetections)
  if (prioritizedDetections.length > 0) {
    prioritizedDetections.sort(compareDetections)
    const uniquePresetIds = Array.from(
      new Set(prioritizedDetections.map((detection) => detection.presetId))
    )

    if (uniquePresetIds.length === 1) {
      return prioritizedDetections[0]
    }

    const candidateDetections = uniquePresetIds
      .map((presetId) =>
        prioritizedDetections.find((detection) => detection.presetId === presetId)
      )
      .filter(Boolean)
      .sort(compareDetections)

    return buildDetection({
      presetId: 'node',
      reason: candidateDetections
        .map((detection) => detection.reason)
        .join(', '),
      source: 'ambiguous',
      projectType: 'mixed',
      scope: 'nested-workspace',
      candidates: candidateDetections,
    })
  }

  if (rootDetection) {
    return rootDetection
  }

  return buildDetection({
    presetId: 'node',
    reason: 'default fallback',
    source: 'fallback',
    scope: 'fallback',
  })
}

module.exports = {
  detectWorkspacePreset,
}
