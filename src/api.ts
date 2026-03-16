import * as https from 'https'
import * as http from 'http'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errorCode?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401
  }

  get isServerError(): boolean {
    return this.statusCode >= 500
  }
}

/** Thrown for DNS, connection refused, timeout, or other network-level failures. */
export class NetworkError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'NetworkError'
  }

  get isOffline(): boolean {
    return (
      this.code === 'ENOTFOUND' ||
      this.code === 'ECONNREFUSED' ||
      this.code === 'ENETUNREACH' ||
      this.code === 'EAI_AGAIN'
    )
  }

  get isTimeout(): boolean {
    return this.code === 'ETIMEDOUT' || this.code === 'TIMEOUT'
  }
}

const NETWORK_ERROR_CODES = new Set([
  'ENOTFOUND',
  'ECONNREFUSED',
  'ECONNRESET',
  'EPIPE',
  'ENETUNREACH',
  'EAI_AGAIN',
  'ETIMEDOUT',
])

const MAX_RETRIES = 2
const INITIAL_BACKOFF_MS = 500

function isRetryable(err: unknown): boolean {
  if (err instanceof ApiError) return err.isServerError
  if (err instanceof NetworkError) return true
  if (err instanceof Error && 'code' in err) {
    return NETWORK_ERROR_CODES.has((err as NodeJS.ErrnoException).code ?? '')
  }
  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function apiRequest<T>(
  baseUrl: string,
  path: string,
  options: {
    method?: string
    body?: Record<string, unknown>
    token?: string
    timeoutMs?: number
    retries?: number
  } = {}
): Promise<T> {
  const maxRetries = options.retries ?? MAX_RETRIES
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await singleRequest<T>(baseUrl, path, options)
    } catch (err) {
      lastError = err
      if (attempt < maxRetries && isRetryable(err)) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt)
        await sleep(backoff)
        continue
      }
      break
    }
  }
  throw lastError
}

function singleRequest<T>(
  baseUrl: string,
  path: string,
  options: {
    method?: string
    body?: Record<string, unknown>
    token?: string
    timeoutMs?: number
  }
): Promise<T> {
  const url = new URL(path, baseUrl)
  const isHttps = url.protocol === 'https:'
  const transport = isHttps ? https : http
  const timeout = options.timeoutMs ?? 10000

  return new Promise<T>((resolve, reject) => {
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      timeout,
    }

    const req = transport.request(reqOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode && res.statusCode >= 400) {
            reject(
              new ApiError(
                res.statusCode,
                parsed.error || parsed.message || `HTTP ${res.statusCode}`,
                parsed.errorCode
              )
            )
          } else {
            resolve(parsed as T)
          }
        } catch {
          reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`))
        }
      })
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new NetworkError('Request timed out', 'TIMEOUT'))
    })

    req.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code && NETWORK_ERROR_CODES.has(err.code)) {
        reject(new NetworkError(err.message, err.code))
      } else {
        reject(err)
      }
    })

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }
    req.end()
  })
}
