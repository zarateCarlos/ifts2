import { useEffect, useState } from 'react'
import { fetchPanelPermissions } from '../api/panelRolesApi'

/** Secciones del panel que se pueden habilitar por rol. */
export const ADMIN_SECTIONS = [
  { id: 'destacados', label: 'Destacados', path: '/admin/ajustes' },
  { id: 'informacion', label: 'Información', path: '/admin/datos' },
  { id: 'contenido', label: 'Contenido', path: '/admin/contenido' },
  { id: 'instagram', label: 'Instagram', path: '/admin/redes' },
] as const

export type AdminSectionId = (typeof ADMIN_SECTIONS)[number]['id']

export type SectionPermission = {
  /** Puede abrir / ver la sección */
  view: boolean
  /** Puede editar / guardar / publicar */
  manage: boolean
}

export type SectionPermissions = Record<AdminSectionId, SectionPermission>

/** Rol del panel tal como lo edita el Admin (espejo de PanelRolResponse). */
export type AdminRole = {
  id: string
  name: string
  /** Email del usuario EDITOR al que se asigna */
  email: string
  permissions: SectionPermissions
}

/** Permisos efectivos de la sesión actual (GET /api/auth/me/panel-permissions). */
export type PanelAccess = {
  loaded: boolean
  fullAccess: boolean
  roleName: string | null
  permissions: SectionPermissions
}

const ACCESS_KEY = 'ifts2-panel-access'
const SESSION_EMAIL_KEY = 'ifts2-admin-session-email'
/** Roles viejos guardados en el navegador antes de que existiera la API. */
const LEGACY_ROLES_KEY = 'ifts2-admin-roles'
export const ADMIN_ROLES_EVENT = 'ifts2-admin-roles-changed'

export function emptyPermissions(on = false): SectionPermissions {
  return {
    destacados: { view: on, manage: on },
    informacion: { view: on, manage: on },
    contenido: { view: on, manage: on },
    instagram: { view: on, manage: on },
  }
}

export function normalizePermissions(raw: unknown): SectionPermissions {
  const out = emptyPermissions(false)
  if (!raw || typeof raw !== 'object') return out
  const o = raw as Record<string, unknown>
  for (const s of ADMIN_SECTIONS) {
    const p = o[s.id]
    if (!p || typeof p !== 'object') continue
    const manage = Boolean((p as Record<string, unknown>).manage)
    const view = manage || Boolean((p as Record<string, unknown>).view)
    out[s.id] = { view, manage }
  }
  return out
}

export function newRoleDraft(): AdminRole {
  return {
    id: '',
    name: '',
    email: '',
    permissions: emptyPermissions(false),
  }
}

const NO_ACCESS: PanelAccess = {
  loaded: false,
  fullAccess: false,
  roleName: null,
  permissions: emptyPermissions(false),
}

function emit() {
  window.dispatchEvent(new Event(ADMIN_ROLES_EVENT))
}

export function loadPanelAccess(): PanelAccess {
  try {
    const raw = sessionStorage.getItem(ACCESS_KEY)
    if (!raw) return NO_ACCESS
    const o = JSON.parse(raw) as Record<string, unknown>
    return {
      loaded: true,
      fullAccess: o.fullAccess === true,
      roleName: typeof o.roleName === 'string' ? o.roleName : null,
      permissions: normalizePermissions(o.permissions),
    }
  } catch {
    return NO_ACCESS
  }
}

function savePanelAccess(access: Omit<PanelAccess, 'loaded'>) {
  try {
    sessionStorage.setItem(ACCESS_KEY, JSON.stringify(access))
  } catch {
    /* modo privado */
  }
  emit()
}

/** Lee permisos efectivos del backend y los cachea en la sesión. */
export async function refreshPanelAccess(): Promise<PanelAccess> {
  const res = await fetchPanelPermissions()
  const access = {
    fullAccess: res.fullAccess === true,
    roleName: res.roleName ?? null,
    permissions: res.fullAccess
      ? emptyPermissions(true)
      : normalizePermissions(res.permissions),
  }
  savePanelAccess(access)
  return { loaded: true, ...access }
}

export function clearPanelAccess() {
  try {
    sessionStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(LEGACY_ROLES_KEY)
  } catch {
    /* ignore */
  }
  emit()
}

export function setSessionAdminEmail(email: string | null) {
  try {
    if (!email) sessionStorage.removeItem(SESSION_EMAIL_KEY)
    else sessionStorage.setItem(SESSION_EMAIL_KEY, email.trim().toLowerCase())
  } catch {
    /* ignore */
  }
  emit()
}

export function getSessionAdminEmail(): string {
  try {
    return (sessionStorage.getItem(SESSION_EMAIL_KEY) || '').trim().toLowerCase()
  } catch {
    return ''
  }
}

export function isSuperAdmin(access = loadPanelAccess()): boolean {
  return access.fullAccess
}

export function canViewSection(
  section: AdminSectionId,
  access = loadPanelAccess(),
): boolean {
  if (access.fullAccess) return true
  return access.permissions[section]?.view === true
}

export function canManageSection(
  section: AdminSectionId,
  access = loadPanelAccess(),
): boolean {
  if (access.fullAccess) return true
  return access.permissions[section]?.manage === true
}

export function hasAnySectionAccess(access = loadPanelAccess()): boolean {
  return (
    access.fullAccess || ADMIN_SECTIONS.some((s) => canViewSection(s.id, access))
  )
}

/** Primera ruta del panel: siempre Mi cuenta (disponible sin rol). */
export function firstAllowedAdminPath(): string {
  return '/admin/mi-cuenta'
}

export function pathToSection(pathname: string): AdminSectionId | 'configuracion' | null {
  if (pathname.includes('/admin/configuracion')) return 'configuracion'
  if (pathname.includes('/admin/ajustes')) return 'destacados'
  if (pathname.includes('/admin/datos')) return 'informacion'
  if (
    pathname.includes('/admin/contenido') ||
    pathname.includes('/admin/eventos') ||
    pathname.includes('/admin/noticias') ||
    pathname.includes('/admin/galeria')
  ) {
    return 'contenido'
  }
  if (
    pathname.includes('/admin/redes') ||
    pathname.includes('/admin/instagram')
  ) {
    return 'instagram'
  }
  return null
}

export function usePanelAccess() {
  const [access, setAccess] = useState(loadPanelAccess)

  useEffect(() => {
    function sync() {
      setAccess(loadPanelAccess())
    }
    window.addEventListener(ADMIN_ROLES_EVENT, sync)
    return () => window.removeEventListener(ADMIN_ROLES_EVENT, sync)
  }, [])

  return access
}

export function useSessionAdminEmail() {
  const [email, setEmail] = useState(getSessionAdminEmail)

  useEffect(() => {
    function sync() {
      setEmail(getSessionAdminEmail())
    }
    sync()
    window.addEventListener(ADMIN_ROLES_EVENT, sync)
    return () => window.removeEventListener(ADMIN_ROLES_EVENT, sync)
  }, [])

  // Valor fresco: el state puede ir un tick atrás justo tras el login.
  return getSessionAdminEmail() || email
}
