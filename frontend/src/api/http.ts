import { getApiBaseUrl, hasRemoteApi } from './config'
import { clearAccessToken, getAccessToken } from './authToken'
import type { ApiErrorBody } from './types'

export class ApiError extends Error {
  status: number
  body?: ApiErrorBody
  constructor(message: string, status: number, body?: ApiErrorBody) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export type ApiRequestOptions = {
  auth?: boolean
  query?: Record<string, string | number | boolean | undefined | null>
  signal?: AbortSignal
  /** Timeout en ms. Default 25s; login puede pedir más (cold start de Render). */
  timeoutMs?: number
  /**
   * El 401 significa "contraseña de confirmación incorrecta", no sesión vencida:
   * no borrar el JWT.
   */
  keepSessionOn401?: boolean
}

const DEFAULT_TIMEOUT_MS = 25_000

function buildUrl(path: string, query?: ApiRequestOptions['query']) {
  const base = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return base
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

async function parseJson<T>(
  res: Response,
  keepSessionOn401 = false,
): Promise<T> {
  if (res.status === 204) return undefined as T

  const text = await res.text().catch(() => '')
  let body: unknown = undefined
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = undefined
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !keepSessionOn401) clearAccessToken()
    const errBody = (body && typeof body === 'object' ? body : undefined) as
      | ApiErrorBody
      | undefined
    const message =
      errBody?.message ||
      (typeof text === 'string' && text && !text.startsWith('{')
        ? text
        : res.statusText) ||
      'Error de API'
    throw new ApiError(message, res.status, errBody)
  }

  return (body === undefined ? undefined : body) as T
}

function authHeaders(useAuth: boolean | undefined): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const wantAuth = useAuth !== false
  const token = wantAuth ? getAccessToken() : null
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function mergeSignals(
  external: AbortSignal | undefined,
  timeoutSignal: AbortSignal,
): AbortSignal {
  if (!external) return timeoutSignal
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([external, timeoutSignal])
  }
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  if (external.aborted || timeoutSignal.aborted) {
    controller.abort()
    return controller.signal
  }
  external.addEventListener('abort', onAbort, { once: true })
  timeoutSignal.addEventListener('abort', onAbort, { once: true })
  return controller.signal
}

function networkError(err: unknown, timeoutMs: number): ApiError {
  const name =
    err && typeof err === 'object' && 'name' in err
      ? String((err as { name?: string }).name)
      : ''
  if (name === 'AbortError' || name === 'TimeoutError') {
    return new ApiError(
      `El servidor no respondió en ${Math.round(timeoutMs / 1000)}s. Si el backend está en Render, puede estar despertando: esperá un minuto y reintentá.`,
      0,
    )
  }
  return new ApiError(
    'No se pudo conectar con el servidor. Revisá la red, CORS o VITE_API_BASE_URL.',
    0,
  )
}

async function request<T>(
  method: string,
  path: string,
  options: ApiRequestOptions & { body?: unknown; formData?: FormData } = {},
): Promise<T> {
  if (!hasRemoteApi()) {
    throw new ApiError('API remota no configurada', 0)
  }

  const headers = new Headers(authHeaders(options.auth))
  let body: BodyInit | undefined

  if (options.formData) {
    body = options.formData
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.body)
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const timeoutController = new AbortController()
  const timer = window.setTimeout(() => timeoutController.abort(), timeoutMs)
  const signal = mergeSignals(options.signal, timeoutController.signal)

  try {
    const res = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body,
      signal,
      credentials: 'omit',
    })
    return await parseJson<T>(res, options.keepSessionOn401)
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw networkError(err, timeoutMs)
  } finally {
    window.clearTimeout(timer)
  }
}

export async function apiGet<T>(
  path: string,
  options?: ApiRequestOptions,
): Promise<T> {
  return request<T>('GET', path, options)
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return request<T>('POST', path, { ...options, body })
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return request<T>('PUT', path, { ...options, body })
}

export async function apiDelete<T = void>(
  path: string,
  options?: ApiRequestOptions & { body?: unknown },
): Promise<T> {
  return request<T>('DELETE', path, options)
}

export async function apiUploadPut<T>(
  path: string,
  formData: FormData,
  options?: ApiRequestOptions,
): Promise<T> {
  return request<T>('PUT', path, { ...options, formData })
}

export async function apiUploadPost<T>(
  path: string,
  formData: FormData,
  options?: ApiRequestOptions,
): Promise<T> {
  return request<T>('POST', path, { ...options, formData })
}

export const apiUpload = apiUploadPut
