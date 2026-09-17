const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')

export interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown }
  detail?: string | Array<{ msg?: string; loc?: Array<string | number> }>
}

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, body: ApiErrorBody) {
    const validation = Array.isArray(body.detail) ? body.detail.map((item) => item.msg).filter(Boolean).join(', ') : undefined
    super(body.error?.message ?? validation ?? (typeof body.detail === 'string' ? body.detail : `Request failed (${status})`))
    this.name = 'ApiError'
    this.status = status
    this.code = body.error?.code ?? (status === 422 ? 'validation_error' : 'request_failed')
    this.details = body.error?.details ?? body.detail
  }
}

export function isMissingRoute(error: unknown) {
  return error instanceof ApiError && (error.status === 404 || error.status === 405)
}

function camelKey(key: string) {
  return key.replace(/_([a-z])/g, (_, character: string) => character.toUpperCase())
}

function camelize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [camelKey(key), camelize(item)]))
  }
  return value
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = init.body instanceof FormData
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...(init.body && !isFormData ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  })
  const body = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, (body ?? {}) as ApiErrorBody)
  return camelize(body) as T
}

export function listFrom<T>(payload: unknown, ...keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (!payload || typeof payload !== 'object') return []
  const record = payload as Record<string, unknown>
  for (const key of ['items', 'results', 'data', ...keys]) {
    if (Array.isArray(record[key])) return record[key] as T[]
  }
  return []
}

export function valueFrom<T>(payload: unknown, ...keys: string[]): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    for (const key of ['data', ...keys]) if (record[key] && typeof record[key] === 'object') return record[key] as T
  }
  return payload as T
}

export const api = {
  baseUrl: API_BASE_URL,
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body: unknown, signal?: AbortSignal) => request<T>(path, { method: 'POST', body: JSON.stringify(body), signal }),
  put: <T>(path: string, body: unknown, signal?: AbortSignal) => request<T>(path, { method: 'PUT', body: JSON.stringify(body), signal }),
  patch: <T>(path: string, body: unknown, signal?: AbortSignal) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body), signal }),
  upload: <T>(path: string, body: FormData, signal?: AbortSignal) => request<T>(path, { method: 'POST', body, signal }),
}
