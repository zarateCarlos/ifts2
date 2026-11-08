/** Base del backend. Vacío = modo mock local (maqueta). */
export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
  return raw.replace(/\/$/, '')
}

export function hasRemoteApi() {
  return getApiBaseUrl().length > 0
}
