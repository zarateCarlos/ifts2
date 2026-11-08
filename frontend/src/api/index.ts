/**
 * Capa de datos del backend IFTS 2.
 * OpenAPI: https://ifts2-backend.onrender.com/v3/api-docs
 */

export { hasRemoteApi, getApiBaseUrl } from './config'
export { ApiError } from './http'
export {
  login,
  logout,
  isLoggedIn,
  fetchMe,
  changeOwnPassword,
  changeOwnEmail,
} from './authApi'
export {
  fetchPanelPermissions,
  verifyPassword,
  adminListPanelRoles,
  adminCreatePanelRole,
  adminUpdatePanelRole,
  adminDeletePanelRole,
} from './panelRolesApi'
export type {
  PanelSectionId,
  PermisoPanel,
  PanelPermissionsMap,
  PanelPermissionsResponse,
  PanelRolResponse,
  PanelRolInput,
} from './panelRolesApi'
export {
  fetchHealth,
  fetchNoticias,
  fetchNoticiaById,
  fetchEventos,
  fetchEventoById,
  fetchGaleria,
  fetchInstitucion,
  fetchDestacados,
  fetchCarreras,
  fetchAutoridades,
  fetchDocumentos,
  fetchEnlaces,
  peekCached,
  invalidatePublicCache,
} from './publicApi'
export {
  fetchContact,
  updateContact,
  fetchSocialLinks,
  updateSocialLinks,
  fetchInstituteProfile,
  saveInstituteBundle,
  ensureInstituteBundle,
  peekInstituteBundle,
} from './siteSettingsApi'
export {
  fetchFeaturedOrder,
  updateFeaturedOrder,
} from './featuredApi'
export {
  fetchSiteContent,
} from './contentApi'
export * from './adminCms'
export {
  adminListUsuarios,
  adminCreateUsuario,
  adminUpdateUsuario,
  adminResetUsuarioPassword,
  adminDeactivateUsuario,
} from './usuariosAdminApi'
export type {
  UsuarioAdminResponse,
  UsuarioRol,
  CrearUsuarioRequest,
  ActualizarUsuarioRequest,
} from './usuariosAdminApi'
export {
  adminListMetaPosts,
  adminSyncMetaPosts,
  adminSetMetaPostVisibility,
  adminPurgeMetaPostStorage,
  normalizeMetaAdminPost,
  visibilityMapFromMeta,
  isMetaEndpointMissing,
} from './metaAdminApi'
export type {
  MetaPostAdmin,
  MetaSyncResponse,
  MetaPurgeResponse,
} from './metaAdminApi'
export { fetchPublicMetaPosts, normalizeMetaPublicPost } from './metaPublicApi'
export {
  fetchStorageUsage,
  estimateStorageUsage,
  formatBytes,
  notifyStorageChanged,
  STORAGE_EVENT,
  usagePercent,
  DEMO_STORAGE_LIMIT_BYTES,
} from './storageApi'
export type { StorageUsage, StorageBreakdownItem } from './storageApi'
