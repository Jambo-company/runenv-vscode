'use strict'

const PEM_BLOCK_PATTERN = /-----BEGIN [^-]+-----[\s\S]+-----END [^-]+-----/m
const BASE64_PATTERN = /^[A-Za-z0-9+/=]+$/
const FILE_PATH_PATTERN = /^(\/|\.{1,2}\/|~\/|[A-Za-z]:[\\/])/

function normalizeLineEndings(value) {
  return String(value).replace(/\r\n/g, '\n')
}

function stripBase64Whitespace(value) {
  return String(value).replace(/\s+/g, '')
}

function looksLikePemText(value) {
  return PEM_BLOCK_PATTERN.test(normalizeLineEndings(value).trim())
}

function isProbablyBase64(value) {
  const normalized = stripBase64Whitespace(String(value).trim())
  if (!normalized || normalized.length % 4 !== 0 || !BASE64_PATTERN.test(normalized)) {
    return false
  }

  try {
    const decoded = Buffer.from(normalized, 'base64')
    return decoded.toString('base64').replace(/=+$/g, '') === normalized.replace(/=+$/g, '')
  } catch {
    return false
  }
}

function isDirectFilePath(value) {
  return FILE_PATH_PATTERN.test(String(value).trim())
}

function decodeFileSecretValue(value) {
  const normalized = normalizeLineEndings(value).trim()
  if (!normalized) {
    return Buffer.from('', 'utf8')
  }

  if (looksLikePemText(normalized)) {
    return Buffer.from(normalized, 'utf8')
  }

  if (isProbablyBase64(normalized)) {
    return Buffer.from(stripBase64Whitespace(normalized), 'base64')
  }

  if (normalized.includes('\n')) {
    return Buffer.from(normalized, 'utf8')
  }

  return Buffer.from(normalized, 'utf8')
}

module.exports = {
  decodeFileSecretValue,
  isDirectFilePath,
}
