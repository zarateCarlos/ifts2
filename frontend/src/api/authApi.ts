import { apiGet, apiPost, apiPut } from './http'
import { clearAccessToken, setAccessToken, isLoggedIn } from './authToken'
import type {
  ChangeOwnEmailRequest,
  ChangeOwnPasswordRequest,
  LoginRequest,
  LoginResponse,
  MeResponse,
} from './types'
import { hasRemoteApi } from './config'

export { isLoggedIn, clearAccessToken }

const LOGIN_TIMEOUT_MS = 60_000

/** POST /api/auth/login → guarda JWT en sessionStorage. */
export async function login(email: string, password: string): Promise<LoginResponse> {
  if (!hasRemoteApi()) {
    throw new Error('API remota no configurada')
  }
  const body = { email, password } satisfies LoginRequest
  let res: LoginResponse | undefined
  try {
    res = await apiPost<LoginResponse>('/api/auth/login', body, {
      auth: false,
      timeoutMs: LOGIN_TIMEOUT_MS,
    })
  } catch (err) {
    // Un reintento: Render free a veces falla el primer hit en frío.
    const retryable =
      err instanceof Error &&
      (err.message.includes('no respondió') ||
        err.message.includes('No se pudo conectar'))
    if (!retryable) throw err
    res = await apiPost<LoginResponse>('/api/auth/login', body, {
      auth: false,
      timeoutMs: LOGIN_TIMEOUT_MS,
    })
  }
  if (!res?.accessToken) {
    throw new Error('Respuesta de login sin token')
  }
  setAccessToken(res.accessToken)
  return res
}

export async function fetchMe(): Promise<MeResponse> {
  return apiGet<MeResponse>('/api/auth/me')
}

export async function changeOwnPassword(
  body: ChangeOwnPasswordRequest,
): Promise<void> {
  await apiPut<void>('/api/auth/me/password', body)
}

export async function changeOwnEmail(
  body: ChangeOwnEmailRequest,
): Promise<MeResponse> {
  return apiPut<MeResponse>('/api/auth/me/email', body)
}

export function logout() {
  clearAccessToken()
}
