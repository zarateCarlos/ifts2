import { apiGet, apiPost, apiPut } from './http'
import type { PageResponse } from './types'

export type UsuarioRol = 'ADMIN' | 'EDITOR' | 'VISOR'

export type UsuarioAdminResponse = {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: UsuarioRol
  activo: boolean
  createdAt?: string
  updatedAt?: string
}

export type CrearUsuarioRequest = {
  nombre: string
  apellido: string
  email: string
  password: string
  rol: UsuarioRol
}

export type ActualizarUsuarioRequest = {
  nombre: string
  apellido: string
  email: string
  rol: UsuarioRol
  activo: boolean
}

export async function adminListUsuarios(): Promise<UsuarioAdminResponse[]> {
  const items: UsuarioAdminResponse[] = []
  let page = 0
  let totalPages = 1
  while (page < totalPages) {
    const res = await apiGet<PageResponse<UsuarioAdminResponse>>(
      '/api/admin/usuarios',
      { query: { page, size: 50 } },
    )
    items.push(...(res.content ?? []))
    totalPages = Math.max(1, res.totalPages ?? 1)
    page += 1
    if (!res.content?.length) break
  }
  return items
}

export async function adminCreateUsuario(
  body: CrearUsuarioRequest,
): Promise<UsuarioAdminResponse> {
  return apiPost<UsuarioAdminResponse>('/api/admin/usuarios', body)
}

export async function adminUpdateUsuario(
  id: string,
  body: ActualizarUsuarioRequest,
): Promise<UsuarioAdminResponse> {
  return apiPut<UsuarioAdminResponse>(`/api/admin/usuarios/${id}`, body)
}

export async function adminResetUsuarioPassword(
  id: string,
  password: string,
): Promise<void> {
  await apiPut<void>(`/api/admin/usuarios/${id}/password`, { password })
}

/** Soft-delete: desactiva la cuenta (no hay DELETE en la API). */
export async function adminDeactivateUsuario(
  user: UsuarioAdminResponse,
): Promise<UsuarioAdminResponse> {
  return adminUpdateUsuario(user.id, {
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    rol: user.rol,
    activo: false,
  })
}
