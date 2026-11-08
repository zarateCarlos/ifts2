import {
  type SiteContentItem,
  CONTENT_LOADED_EVENT,
} from '../data/contentTypes'
import { hasRemoteApi } from './config'
import { fetchNoticias } from './publicApi'
import { noticiaToContentItem } from './mappers'
import { adminListNoticias } from './adminCms'
import { isLoggedIn } from './authToken'

let cached: SiteContentItem[] = []
let inflight: Promise<SiteContentItem[]> | null = null

export function readSiteContentSync(): SiteContentItem[] {
  return cached
}

async function load(): Promise<SiteContentItem[]> {
  const noticias = isLoggedIn()
    ? await adminListNoticias().catch(() => fetchNoticias())
    : await fetchNoticias()
  return noticias
    .map((n) => {
      const item = noticiaToContentItem(n)
      if (!item) return null
      if ('estado' in n && (n as { estado?: string }).estado) {
        return {
          ...item,
          published: (n as { estado: string }).estado === 'PUBLICADA',
        }
      }
      return item
    })
    .filter(Boolean) as SiteContentItem[]
}

/** Noticias de comunidad desde API. Varias vistas montadas comparten un solo pedido. */
export async function fetchSiteContent(): Promise<SiteContentItem[]> {
  if (!hasRemoteApi()) {
    cached = []
    return []
  }
  if (inflight) return inflight
  inflight = load()
    .then((items) => {
      cached = items
      window.dispatchEvent(new Event(CONTENT_LOADED_EVENT))
      return cached
    })
    .catch(() => cached)
    .finally(() => {
      inflight = null
    })
  return inflight
}
