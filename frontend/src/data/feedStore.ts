import {
  getCachedPosts,
  igImageUrl,
  isIgPostVisible,
  loadIgVisibility,
  loadInstagramPosts,
  type IgPost,
} from './instagramFeed'
import { MAX_FEATURED } from './siteSettings'
import {
  FEATURED_EVENT,
  fetchFeaturedOrder,
  readFeaturedOrderSync,
  updateFeaturedOrder,
} from '../api/featuredApi'
import { hasRemoteApi } from '../api/config'
import type { ContentArea } from './contentTypes'
import {
  fetchDestacados,
  fetchEventos,
  fetchNoticias,
  invalidatePublicCache,
} from '../api/publicApi'
import {
  destacadoToFeedItem,
  eventoToFeedItem,
  noticiaToFeedItem,
} from '../api/mappers'
import type {
  DestacadoPublicaResponse,
  EventoPublicaResponse,
  NoticiaResumenResponse,
} from '../api/types'

export { MAX_FEATURED }

export type FeedSource = 'web' | 'instagram'

export type FeedItem = {
  id: string
  source: FeedSource
  title: string
  body: string
  dateISO: string
  dateLabel: string
  imageUrl: string
  imageUrls?: string[] // Soporte para carruseles de Instagram
  href: string
  external: boolean
  area?: ContentArea | string
  moreLabel?: string
}

export const FEED_EVENT = 'ifts2-unified-feed-change'

function formatIgDate(iso?: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

export function igToFeedItem(post: IgPost): FeedItem {
  const caption = (post.caption || 'Publicación de Instagram').trim()
  const title =
    caption.split('\n').find((l) => l.trim())?.slice(0, 72) || 'Instagram'
  const dateISO = post.timestamp ? post.timestamp.slice(0, 10) : '1970-01-01'

  // Extrae todas las URLs si la publicación es un carrusel
  let imageUrls: string[] = []
  if (post.media_type === 'CAROUSEL_ALBUM' && post.children?.data?.length) {
    imageUrls = post.children.data
      .map((child) => (child.media_type === 'VIDEO' ? child.thumbnail_url || child.media_url : child.media_url) || '')
      .filter(Boolean)
  } else {
    const single = igImageUrl(post)
    if (single) imageUrls = [single]
  }

  return {
    id: `ig:${post.id}`,
    source: 'instagram',
    title,
    body: caption,
    dateISO,
    dateLabel: formatIgDate(post.timestamp),
    imageUrl: igImageUrl(post),
    imageUrls,
    href: post.permalink,
    external: true,
  }
}

export function buildFeedFromSources(
  igPosts: IgPost[],
  remote: {
    noticias?: NoticiaResumenResponse[]
    eventos?: EventoPublicaResponse[]
  } = {},
): FeedItem[] {
  // Con backend, /api/meta/posts ya trae solo visibles; no filtrar por localStorage.
  const visibility = loadIgVisibility()
  const web = [
    ...(remote.noticias ?? []).map(noticiaToFeedItem),
    ...(remote.eventos ?? []).map(eventoToFeedItem),
  ]
  const ig = igPosts
    .filter((p) => (hasRemoteApi() ? true : isIgPostVisible(p.id, visibility)))
    .map(igToFeedItem)

  return [...web, ...ig].sort((a, b) => b.dateISO.localeCompare(a.dateISO))
}

let feedCache: FeedItem[] | null = null
let feedInflight: Promise<FeedItem[]> | null = null

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const t = window.setTimeout(() => resolve(fallback), ms)
    promise
      .then((v) => {
        window.clearTimeout(t)
        resolve(v)
      })
      .catch(() => {
        window.clearTimeout(t)
        resolve(fallback)
      })
  })
}

function emitFeed() {
  window.dispatchEvent(new Event(FEED_EVENT))
}

export function peekUnifiedFeed(): FeedItem[] | null {
  return feedCache
}

export function invalidateUnifiedFeed() {
  feedCache = null
  invalidatePublicCache(
    'noticias:all:any',
    'eventos',
    'destacados',
    'galeria:all',
    'evento:*',
    'noticia:*',
    'galeria:*',
  )
}

/** Tras editar en admin: invalidar y refrescar el feed público. */
export function bumpPublicFeed() {
  invalidateUnifiedFeed()
  return loadUnifiedFeed({ force: true })
}

async function fetchFeedFresh(): Promise<FeedItem[]> {
  const [cache, noticias, eventos, destacados] = await Promise.all([
    // Subimos el timeout a 5000ms y el límite a 25 posts
    withTimeout(loadInstagramPosts(25), 5000, getCachedPosts()),
    fetchNoticias().catch(() => [] as NoticiaResumenResponse[]),
    fetchEventos().catch(() => [] as EventoPublicaResponse[]),
    fetchDestacados().catch(() => [] as DestacadoPublicaResponse[]),
  ])
  const feed = buildFeedFromSources(cache.posts, { noticias, eventos })
  
  // Mapeamos los IDs aceptando tanto limpios como con prefijo ig:
  const ids = new Set<string>()
  feed.forEach((f) => {
    ids.add(f.id)
    if (f.id.startsWith('ig:')) ids.add(f.id.replace('ig:', ''))
  })

  for (const d of destacados) {
    const item = destacadoToFeedItem(d)
    if (item) {
      const cleanId = item.id.replace(/^ig:/, '')
      if (!ids.has(item.id) && !ids.has(cleanId) && !ids.has(`ig:${cleanId}`)) {
        feed.push(item)
        ids.add(item.id)
      }
    }
  }

  const sorted = feed.sort((a, b) => b.dateISO.localeCompare(a.dateISO))
  feedCache = sorted
  emitFeed()
  void fetchFeaturedOrder().then(() => {
    window.dispatchEvent(new Event(FEATURED_EVENT))
  })
  return sorted
}

/**
 * Stale-while-revalidate: si hay cache, lo devuelve YA y refresca atrás.
 */
export async function loadUnifiedFeed(opts?: {
  force?: boolean
}): Promise<FeedItem[]> {
  if (!opts?.force && feedCache) {
    if (!feedInflight) {
      feedInflight = fetchFeedFresh().finally(() => {
        feedInflight = null
      })
    }
    return feedCache
  }
  if (feedInflight) return feedInflight
  feedInflight = fetchFeedFresh().finally(() => {
    feedInflight = null
  })
  return feedInflight
}

export function loadUnifiedFeedSync(): FeedItem[] {
  return feedCache ?? buildFeedFromSources(getCachedPosts().posts)
}

export function subscribeFeed(onChange: () => void) {
  window.addEventListener(FEED_EVENT, onChange)
  return () => window.removeEventListener(FEED_EVENT, onChange)
}

export function loadFeaturedOrder(): string[] {
  return readFeaturedOrderSync()
}

export function saveFeaturedOrder(order: string[]) {
  const next = order.slice(0, MAX_FEATURED)
  void updateFeaturedOrder(next).catch(() => {
    /* UI ya optimista; error se verá al refrescar */
  })
  return next
}

// Normalización de IDs para verificar si un ítem está destacado
export function isFeatured(id: string, order = loadFeaturedOrder()) {
  const cleanId = id.replace(/^ig:/, '')
  return order.some((item) => item === id || item === cleanId || item === `ig:${cleanId}`)
}

export function toggleFeatured(id: string) {
  const order = loadFeaturedOrder()
  const cleanId = id.replace(/^ig:/, '')
  const existing = order.find((x) => x === id || x === cleanId || x === `ig:${cleanId}`)

  if (existing) {
    return saveFeaturedOrder(order.filter((x) => x !== existing))
  }
  if (order.length >= MAX_FEATURED) return order
  return saveFeaturedOrder([...order, id])
}

export function moveFeatured(id: string, dir: -1 | 1) {
  const order = [...loadFeaturedOrder()]
  const cleanId = id.replace(/^ig:/, '')
  const i = order.findIndex((x) => x === id || x === cleanId || x === `ig:${cleanId}`)
  if (i < 0) return order
  const j = i + dir
  if (j < 0 || j >= order.length) return order
  ;[order[i], order[j]] = [order[j], order[i]]
  return saveFeaturedOrder(order)
}

// Resuelve los elementos destacados comparando IDs con y sin el prefijo "ig:"
export function resolveFeaturedItems(
  feed: FeedItem[],
  order = loadFeaturedOrder(),
): FeedItem[] {
  const map = new Map<string, FeedItem>()
  for (const f of feed) {
    map.set(f.id, f)
    const cleanId = f.id.replace(/^ig:/, '')
    map.set(cleanId, f)
    map.set(`ig:${cleanId}`, f)
  }

  return order
    .map((id) => {
      const cleanId = id.replace(/^ig:/, '')
      return map.get(id) || map.get(cleanId) || map.get(`ig:${cleanId}`)
    })
    .filter(Boolean) as FeedItem[]
}

export function subscribeFeatured(onChange: () => void) {
  window.addEventListener(FEATURED_EVENT, onChange)
  return () => window.removeEventListener(FEATURED_EVENT, onChange)
}