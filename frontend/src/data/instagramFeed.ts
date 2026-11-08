import seed from './instagramSeed.json'
import { hasRemoteApi } from '../api/config'
import { fetchPublicMetaPosts } from '../api/metaPublicApi'

const VISIBILITY_KEY = 'ifts2-ig-post-visibility'
const STORAGE_PURGED_KEY = 'ifts2-ig-storage-purged'
const CACHE_KEY = 'ifts2-ig-posts-cache'
/** Solo fallback demo sin backend. Producción: token en Render (META_*). */
const GRAPH = 'https://graph.facebook.com/v21.0'

export type IgMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | string

export type IgMediaChild = {
  id: string
  media_type: IgMediaType
  media_url?: string
  thumbnail_url?: string
}

export type IgPost = {
  id: string
  caption?: string
  media_type: IgMediaType
  media_url?: string
  thumbnail_url?: string
  permalink: string
  timestamp?: string
  children?: {
    data: IgMediaChild[]
  }
}

export type IgCache = {
  fetchedAt: string
  source: 'api' | 'seed' | 'local'
  posts: IgPost[]
}

type VisibilityMap = Record<string, boolean>

function cfg() {
  return {
    id: import.meta.env.VITE_INSTAGRAM_ID?.trim() ?? '',
    token: import.meta.env.VITE_INSTAGRAM_ACCESS_TOKEN?.trim() ?? '',
    appId: import.meta.env.VITE_INSTAGRAM_APP_ID?.trim() ?? '',
  }
}

export function isInstagramConfigured() {
  const { id, token } = cfg()
  return Boolean(id && token && token !== 'TU_ACCESS_TOKEN_AQUI')
}

export function loadIgVisibility(): VisibilityMap {
  try {
    const raw = localStorage.getItem(VISIBILITY_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as VisibilityMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveIgVisibility(map: VisibilityMap) {
  localStorage.setItem(VISIBILITY_KEY, JSON.stringify(map))
}

export function isIgPostVisible(id: string, map: VisibilityMap = loadIgVisibility()) {
  // Si no está definido en el map, por defecto ES VISIBLE (true)
  return map[id] !== false
}

export function setIgPostVisible(id: string, visible: boolean) {
  const next = { ...loadIgVisibility(), [id]: visible }
  saveIgVisibility(next)
  return next
}

type PurgedMap = Record<string, boolean>

export function loadIgStoragePurged(): PurgedMap {
  try {
    const raw = localStorage.getItem(STORAGE_PURGED_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as PurgedMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function isIgStoragePurged(
  id: string,
  map: PurgedMap = loadIgStoragePurged(),
) {
  return map[id] === true
}

export function setIgStoragePurged(id: string, purged: boolean) {
  const next = { ...loadIgStoragePurged(), [id]: purged }
  localStorage.setItem(STORAGE_PURGED_KEY, JSON.stringify(next))
  return next
}

export function igImageUrl(post: IgPost | IgMediaChild) {
  if (post.media_type === 'VIDEO') {
    return post.thumbnail_url || post.media_url || ''
  }
  return post.media_url || post.thumbnail_url || ''
}

/**
 * Devuelve un array con las URLs de todas las imágenes o videos de la publicación.
 * Si es un carrusel, extrae las URLs de sus elementos hijos (`children`).
 */
export function getPostMediaUrls(post: IgPost): string[] {
  if (post.media_type === 'CAROUSEL_ALBUM' && post.children?.data?.length) {
    return post.children.data.map((child) => igImageUrl(child))
  }
  const singleUrl = igImageUrl(post)
  return singleUrl ? [singleUrl] : []
}

function saveLocalCache(posts: IgPost[]) {
  const payload: IgCache = {
    fetchedAt: new Date().toISOString(),
    source: 'api',
    posts,
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
  return payload
}

export function loadLocalCache(): IgCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as IgCache
    if (!parsed?.posts?.length) return null
    return { ...parsed, source: 'local' }
  } catch {
    return null
  }
}

export function loadSeedCache(): IgCache {
  return {
    fetchedAt: seed.fetchedAt,
    source: 'seed',
    posts: seed.posts as IgPost[],
  }
}

/** Cache local → seed JSON (siempre hay algo para mostrar). */
export function getCachedPosts(): IgCache {
  return loadLocalCache() ?? loadSeedCache()
}

async function fetchFromApi(limit = 25): Promise<IgPost[]> {
  const { id, token } = cfg()

  if (!id || !token) {
    throw new Error(
      'Faltan VITE_INSTAGRAM_ID o VITE_INSTAGRAM_ACCESS_TOKEN en .env.local'
    )
  }

  const fields = [
    'id',
    'caption',
    'media_type',
    'media_url',
    'thumbnail_url',
    'permalink',
    'timestamp',
    'children{id,media_type,media_url,thumbnail_url}',
  ].join(',')

  const posts: IgPost[] = []
  // Pedimos solo la cantidad límite necesaria en la primera llamada
  let nextUrl: string | null =
    `${GRAPH}/${id}/media` +
    `?fields=${fields}` +
    `&limit=${Math.min(limit, 25)}` + 
    `&access_token=${encodeURIComponent(token)}`

  let pageCount = 0
  const maxPages = Math.ceil(limit / 25) // Ejemplo: si pedís 100 posts, hace máximo 4 llamadas

  while (nextUrl && posts.length < limit && pageCount < maxPages) {
    pageCount++
    const res = await fetch(nextUrl)
    const data = (await res.json()) as {
      data?: IgPost[]
      paging?: { next?: string }
      error?: { message?: string }
    }

    if (!res.ok || data.error) {
      console.error('Error retornado por Meta Graph API:', data.error)
      throw new Error(
        data.error?.message || `Error Instagram HTTP ${res.status}`
      )
    }

    const fetchedPosts = data.data ?? []
    if (fetchedPosts.length === 0) break

    posts.push(...fetchedPosts)

    // Si ya juntamos suficiente cantidad, FRENA EL BUCLE inmediatamente
    if (posts.length >= limit) break

    nextUrl = data.paging?.next ?? null
  }

  // Devolvemos recortado exactamente a la cantidad pedida
  return posts.slice(0, limit)
}

/**
 * Feed público: backend `/api/meta/posts` (posts marcados visibles).
 * Sin backend: Graph con VITE_* (demo) o cache/seed.
 */
export async function loadInstagramPosts(limit = 20): Promise<IgCache> {
  if (hasRemoteApi()) {
    try {
      const posts = (await fetchPublicMetaPosts(limit)) as IgPost[]
      if (posts.length) return saveLocalCache(posts)
      // Backend vacío: no forzar Graph (token Vite suele estar vencido).
      return { fetchedAt: new Date().toISOString(), source: 'api', posts: [] }
    } catch (error) {
      console.warn('Backend Meta falló; uso cache/seed:', error)
      return getCachedPosts()
    }
  }

  if (!isInstagramConfigured()) {
    return getCachedPosts()
  }

  try {
    const posts = await fetchFromApi(limit)
    return saveLocalCache(posts)
  } catch (error) {
    console.warn('Fallback a cache/seed debido a error de API:', error)
    return getCachedPosts()
  }
}

/** Refresh público (sitio). Admin debe usar adminListMetaPosts / sync. */
export async function refreshInstagramPosts(limit = 100): Promise<IgCache> {
  if (hasRemoteApi()) {
    const posts = (await fetchPublicMetaPosts(limit)) as IgPost[]
    return posts.length
      ? saveLocalCache(posts)
      : { fetchedAt: new Date().toISOString(), source: 'api', posts: [] }
  }
  const posts = await fetchFromApi(limit)
  return saveLocalCache(posts)
}

/**
 * Token del Graph API Explorer: suele ser corto (~1–2 horas).
 * Token long-lived: ~60 días (requiere APP_SECRET en backend).
 * Los posts en JSON/localStorage no “vencen”: simulan backend.
 */
export function tokenDurationHint() {
  return {
    explorer: '~1–2 horas (token corto del Explorador)',
    longLived: '~60 días (intercambio con APP_SECRET; solo en backend)',
    cache:
      'Los posts se guardan en localStorage + seed JSON para seguir mostrando la vista sin API.',
  }
}