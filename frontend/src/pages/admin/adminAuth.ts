import { isLoggedIn, logout as apiLogout } from '../../api/authApi'
import { hasRemoteApi } from '../../api/config'
import {
  clearPanelAccess,
  setSessionAdminEmail,
} from '../../data/adminRolesStore'

const AUTH_FLAG = 'ifts2-admin-auth'

export function isAuthed() {
  if (hasRemoteApi()) return isLoggedIn()
  return sessionStorage.getItem(AUTH_FLAG) === '1'
}

export function markLocalAuthed() {
  sessionStorage.setItem(AUTH_FLAG, '1')
}

export function clearAuth() {
  sessionStorage.removeItem(AUTH_FLAG)
  setSessionAdminEmail(null)
  clearPanelAccess()
  apiLogout()
}
