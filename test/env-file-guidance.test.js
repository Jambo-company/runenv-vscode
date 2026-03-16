const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildEnvFileGuidance,
  getEnvFileGuidance,
} = require('../dist/env-file-guidance.js')

test('env file guidance recommends matching preset from detected files', () => {
  const lines = buildEnvFileGuidance({
    environmentName: 'development',
    envFiles: ['.env.local', '.env.development'],
    configuredPresetId: 'dockerCompose',
  })

  assert.match(lines[0], /Configured preset: Docker Compose/)
  assert.ok(lines.some((line) => /align best with Next\.js/.test(line)))
  assert.ok(lines.some((line) => /Consider switching preset to Next\.js/.test(line)))
  assert.ok(lines.some((line) => /\.env\.local -> Local override/.test(line)))
  assert.ok(lines.some((line) => /Current generate target: \.env\.override/.test(line)))
})

test('env file guidance exposes recommended preset metadata', () => {
  const guidance = getEnvFileGuidance({
    environmentName: 'development',
    envFiles: ['.env.local', '.env.development'],
    configuredPresetId: 'dockerCompose',
  })

  assert.equal(guidance.configuredPresetTitle, 'Docker Compose')
  assert.equal(guidance.recommendedPresetTitle, 'Next.js')
  assert.equal(guidance.recommendedGenerateFilename, '.env.local')
  assert.ok(guidance.matches.includes('.env.local -> Local override'))
})
