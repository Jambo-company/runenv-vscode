#!/usr/bin/env node
/**
 * l10n key sync check — ensures every locale bundle has exactly the same keys
 * as the English base bundle.
 *
 * Usage:
 *   node check_l10n_sync.js
 *
 * Exit code 0 if all bundles are in sync, 1 otherwise.
 */
const fs = require('node:fs')
const path = require('node:path')

const L10N_DIR = path.join(__dirname, 'l10n')
const BASE_FILE = path.join(L10N_DIR, 'bundle.l10n.json')

const base = JSON.parse(fs.readFileSync(BASE_FILE, 'utf-8'))
const baseKeys = new Set(Object.keys(base))

const localeFiles = fs
  .readdirSync(L10N_DIR)
  .filter((f) => f.startsWith('bundle.l10n.') && f.endsWith('.json') && f !== 'bundle.l10n.json')

let hasError = false

for (const file of localeFiles) {
  const locale = file.replace('bundle.l10n.', '').replace('.json', '')
  const filePath = path.join(L10N_DIR, file)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const localeKeys = new Set(Object.keys(data))

  const missing = [...baseKeys].filter((k) => !localeKeys.has(k))
  const extra = [...localeKeys].filter((k) => !baseKeys.has(k))

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅ [${locale}] ${localeKeys.size}/${baseKeys.size} keys — in sync`)
  } else {
    hasError = true
    if (missing.length > 0) {
      console.error(`❌ [${locale}] missing ${missing.length} key(s):`)
      missing.forEach((k) => console.error(`   - ${k}`))
    }
    if (extra.length > 0) {
      console.error(`❌ [${locale}] extra ${extra.length} key(s):`)
      extra.forEach((k) => console.error(`   - ${k}`))
    }
  }
}

if (!hasError) {
  console.log(`\n✅ All ${localeFiles.length} locale bundles are in sync (${baseKeys.size} keys each)`)
} else {
  console.error('\n❌ l10n key sync check failed')
  process.exit(1)
}
