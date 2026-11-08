const TOKEN_KEY = 'ifts2-api-token'

export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAccessToken(token: string | null) {
  try {
    if (!token) sessionStorage.removeItem(TOKEN_KEY)
    else sessionStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

export function clearAccessToken() {
  setAccessToken(null)
}

export function isLoggedIn() {
  return Boolean(getAccessToken())
}
