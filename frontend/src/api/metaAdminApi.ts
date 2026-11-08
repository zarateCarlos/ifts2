/**
 * Admin Meta / Instagram — usa el backend (token META_* en Render).
 * El front no debe llamar a Graph con VITE_INSTAGRAM_* en producción.
 */
import { apiDelete, apiGet, apiPost, apiPut, ApiError } from './http'

export type MetaPostAdmin = {
  id: string
  texto?: string
  caption?: string
  imagenUrl?: string | null
  thumbnailUrl?: string | null
  mediaType?: string
  fechaPublicacion?: string
  linkOriginal?: string
  permalink?: string
  visible?: boolean
  /** true si hay copia en Storage */
  tieneStorage?: boolean
  objectKey?: string | null
}

export type MetaSyncResponse = {
  sincronizados?: number
  posts?: MetaPostAdmin[]
  message?: string
}

export type MetaPurgeResponse = {
  liberado?: boolean
  objectKey?: string
  message?: string
}

function isMissingEndpoint(err: unknown) {
  return err instanceof ApiError && (err.status === 404 || err.status === 501)
}

function uriToString(v: unknown): string | undefined {
  if (v == null) return undefined
  if (typeof v === 'string') return v || undefined
  if (typeof v === 'object' && v && 'href' in v) {
    const href = (v as { href?: unknown }).href
    return typeof href === 'string' && href ? href : undefined
  }
  return String(v)
}

/** Campos mínimos que consume la UI de Instagram. */
export function normalizeMetaAdminPost(p: MetaPostAdmin) {
  return {
    id: p.id,
    caption: p.texto || p.caption,
    media_type: p.mediaType || 'IMAGE',
    media_url: uriToString(p.imagenUrl),
    thumbnail_url: uriToString(p.thumbnailUrl),
    permalink: p.linkOriginal || p.permalink || '',
    timestamp: p.fechaPublicacion,
    visible: p.visible === true,
    tieneStorage: p.tieneStorage === true,
  }
}

export function visibilityMapFromMeta(
  posts: MetaPostAdmin[],
): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  for (const p of posts) map[p.id] = p.visible === true
  return map
}

export async function adminListMetaPosts(size = 50): Promise<MetaPostAdmin[]> {
  try {
    const res = await apiGet<{ content?: MetaPostAdmin[] } | MetaPostAdmin[]>(
      '/api/admin/meta/posts',
      { auth: true, query: { page: 0, size } },
    )
    if (Array.isArray(res)) return res
    return res.content ?? []
  } catch (err) {
    if (isMissingEndpoint(err)) return []
    throw err
  }
}

/** Pide al backend que consulte Meta (token en Render). */
export async function adminSyncMetaPosts(): Promise<MetaSyncResponse> {
  return apiPost<MetaSyncResponse>('/api/admin/meta/sync', {}, {
    auth: true,
    timeoutMs: 90_000,
  })
}

/** Publicar / ocultar (al publicar, el backend copia preview a Storage). */
export async function adminSetMetaPostVisibility(
  postId: string,
  visible: boolean,
): Promise<MetaPostAdmin> {
  return apiPut<MetaPostAdmin>(
    `/api/admin/meta/posts/${encodeURIComponent(postId)}/visibilidad`,
    { visible },
    { auth: true, timeoutMs: 60_000 },
  )
}

/** Libera el archivo en Storage de un post (útil en plan free). */
export async function adminPurgeMetaPostStorage(
  postId: string,
): Promise<MetaPurgeResponse> {
  return apiDelete<MetaPurgeResponse>(
    `/api/admin/meta/posts/${encodeURIComponent(postId)}/storage`,
    { auth: true },
  )
}

export { isMissingEndpoint as isMetaEndpointMissing }
