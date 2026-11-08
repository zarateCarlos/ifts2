/**
 * Uso de Storage.
 * Orden: backend → Edge Function Supabase → estimación CMS.
 */
import { apiGet, ApiError } from './http'
import { getCachedPosts, isIgStoragePurged, loadIgStoragePurged } from '../data/instagramFeed'
import {
  adminListEventos,
  adminListGaleria,
  adminListNoticias,
} from './adminCms'
import { isLoggedIn } from './authToken'

export const STORAGE_EVENT = 'ifts2-storage-usage-change'

/** Cupo free típico de Supabase Storage. */
export const DEMO_STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024
const AVG_IMAGE_BYTES = 380 * 1024

export type StorageBreakdownItem = {
  key: string
  label: string
  bytes: number
  files: number
}

export type StorageUsage = {
  usedBytes: number
  limitBytes: number
  breakdown: StorageBreakdownItem[]
  /** true = estimado en front */
  estimated: boolean
  source?: 'backend' | 'supabase' | 'estimate'
  updatedAt: string
}

export function notifyStorageChanged() {
  window.dispatchEvent(new Event(STORAGE_EVENT))
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${Math.round(bytes)} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let n = bytes / 1024
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i += 1
  }
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} ${units[i]}`
}

export function usagePercent(usage: StorageUsage): number {
  if (!usage.limitBytes) return 0
  return Math.min(100, Math.round((usage.usedBytes / usage.limitBytes) * 1000) / 10)
}

type ApiUsageBody = {
  usedBytes?: number
  used?: number
  limitBytes?: number
  limit?: number
  quotaBytes?: number
  source?: string
  breakdown?: Array<{
    key?: string
    label?: string
    bytes?: number
    size?: number
    files?: number
    count?: number
  }>
}

function mapApi(
  body: ApiUsageBody,
  source: StorageUsage['source'],
): StorageUsage {
  const usedBytes = Number(body.usedBytes ?? body.used ?? 0)
  const limitBytes = Number(
    body.limitBytes ?? body.limit ?? body.quotaBytes ?? DEMO_STORAGE_LIMIT_BYTES,
  )
  const breakdown: StorageBreakdownItem[] = (body.breakdown ?? []).map((b, i) => ({
    key: b.key || `item-${i}`,
    label: b.label || b.key || `Grupo ${i + 1}`,
    bytes: Number(b.bytes ?? b.size ?? 0),
    files: Number(b.files ?? b.count ?? 0),
  }))
  return {
    usedBytes,
    limitBytes,
    breakdown,
    estimated: source === 'estimate',
    source,
    updatedAt: new Date().toISOString(),
  }
}

async function fetchFromBackend(): Promise<StorageUsage | null> {
  try {
    const body = await apiGet<ApiUsageBody>('/api/admin/storage/usage', {
      auth: true,
    })
    return mapApi(body, 'backend')
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 501)) {
      return null
    }
    return null
  }
}

/** Edge Function `storage-usage` (cuando el proyecto Supabase esté activo). */
async function fetchFromSupabaseEdge(): Promise<StorageUsage | null> {
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '')
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!base || !anon) return null

  try {
    const res = await fetch(`${base}/functions/v1/storage-usage`, {
      headers: {
        Authorization: `Bearer ${anon}`,
        apikey: anon,
        Accept: 'application/json',
      },
    })
    if (!res.ok) return null
    const body = (await res.json()) as ApiUsageBody
    if (body.usedBytes == null && body.used == null) return null
    return mapApi(body, 'supabase')
  } catch {
    return null
  }
}

async function countCmsFiles(): Promise<{
  noticiaImages: number
  eventoPortadas: number
  galeriaFotos: number
}> {
  if (!isLoggedIn()) {
    return { noticiaImages: 0, eventoPortadas: 0, galeriaFotos: 0 }
  }
  try {
    const [noticias, eventos, galeria] = await Promise.all([
      adminListNoticias().catch(() => []),
      adminListEventos().catch(() => []),
      adminListGaleria().catch(() => []),
    ])
    return {
      noticiaImages: noticias.filter((n) => Boolean(n.portadaUrl)).length,
      eventoPortadas: eventos.filter((e) => Boolean(e.portadaUrl)).length,
      galeriaFotos: galeria.filter((f) => Boolean(f.imagenUrl)).length,
    }
  } catch {
    return { noticiaImages: 0, eventoPortadas: 0, galeriaFotos: 0 }
  }
}

export function estimateStorageUsage(input?: {
  noticiaImages?: number
  eventoPortadas?: number
  galeriaFotos?: number
}): StorageUsage {
  const purged = loadIgStoragePurged()
  const igKept = (getCachedPosts().posts ?? []).filter(
    (p) => !isIgStoragePurged(p.id, purged) && Boolean(p.media_url || p.thumbnail_url),
  ).length

  const noticias = input?.noticiaImages ?? 0
  const portadas = input?.eventoPortadas ?? 0
  const galeria = input?.galeriaFotos ?? 0

  const breakdown: StorageBreakdownItem[] = [
    {
      key: 'meta',
      label: 'Instagram / Meta',
      files: igKept,
      bytes: igKept * AVG_IMAGE_BYTES,
    },
    {
      key: 'noticias',
      label: 'Portadas de noticias',
      files: noticias,
      bytes: noticias * AVG_IMAGE_BYTES,
    },
    {
      key: 'eventos',
      label: 'Portadas de eventos',
      files: portadas,
      bytes: portadas * AVG_IMAGE_BYTES,
    },
    {
      key: 'galeria',
      label: 'Fotos de galería',
      files: galeria,
      bytes: galeria * AVG_IMAGE_BYTES,
    },
  ].filter((b) => b.files > 0 || b.bytes > 0)

  const usedBytes = breakdown.reduce((s, b) => s + b.bytes, 0)

  return {
    usedBytes,
    limitBytes: DEMO_STORAGE_LIMIT_BYTES,
    breakdown,
    estimated: true,
    source: 'estimate',
    updatedAt: new Date().toISOString(),
  }
}

export async function fetchStorageUsage(counts?: {
  noticiaImages?: number
  eventoPortadas?: number
  galeriaFotos?: number
}): Promise<StorageUsage> {
  const fromBackend = await fetchFromBackend()
  if (fromBackend) return fromBackend

  const fromEdge = await fetchFromSupabaseEdge()
  if (fromEdge) return fromEdge

  const cms =
    counts?.noticiaImages != null
      ? counts
      : await countCmsFiles()
  return estimateStorageUsage(cms)
}
