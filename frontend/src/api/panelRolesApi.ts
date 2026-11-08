/**
 * Roles del panel (permisos por sección) — backend como fuente de verdad.
 * Cada mutación exige `currentPassword` del ADMIN logueado; 401 = contraseña
 * incorrecta (no sesión vencida).
 */
import { apiDelete, apiGet, apiPost, apiPut } from './http'

export type PanelSectionId = 'destacados' | 'informacion' | 'contenido' | 'instagram'

export type PermisoPanel = { view: boolean; manage: boolean }

export type PanelPermissionsMap = Record<PanelSectionId, PermisoPanel>

export type PanelPermissionsResponse = {
  fullAccess: boolean
  roleName: string | null
  permissions: Partial<Record<string, PermisoPanel>>
}

export type PanelRolResponse = {
  id: string
  name: string
  email: string
  permissions: Partial<Record<string, PermisoPanel>>
}

export type PanelRolInput = {
  name: string
  email: string
  permissions: PanelPermissionsMap
}

export async function fetchPanelPermissions(): Promise<PanelPermissionsResponse> {
  return apiGet<PanelPermissionsResponse>('/api/auth/me/panel-permissions')
}

export async function verifyPassword(password: string): Promise<void> {
  await apiPost<void>(
    '/api/auth/verify-password',
    { password },
    { keepSessionOn401: true },
  )
}

export async function adminListPanelRoles(): Promise<PanelRolResponse[]> {
  return apiGet<PanelRolResponse[]>('/api/admin/panel-roles')
}

export async function adminCreatePanelRole(
  input: PanelRolInput,
  currentPassword: string,
): Promise<PanelRolResponse> {
  return apiPost<PanelRolResponse>(
    '/api/admin/panel-roles',
    { ...input, currentPassword },
    { keepSessionOn401: true },
  )
}

export async function adminUpdatePanelRole(
  id: string,
  input: PanelRolInput,
  currentPassword: string,
): Promise<PanelRolResponse> {
  return apiPut<PanelRolResponse>(
    `/api/admin/panel-roles/${encodeURIComponent(id)}`,
    { ...input, currentPassword },
    { keepSessionOn401: true },
  )
}

export async function adminDeletePanelRole(
  id: string,
  currentPassword: string,
): Promise<void> {
  await apiDelete<void>(`/api/admin/panel-roles/${encodeURIComponent(id)}`, {
    body: { currentPassword },
    keepSessionOn401: true,
  })
}
