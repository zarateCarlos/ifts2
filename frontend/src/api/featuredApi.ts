import { MAX_FEATURED } from '../data/siteSettings'
import { hasRemoteApi } from './config'
import { fetchDestacados } from './publicApi'
import { invalidatePublicCache } from './publicCache'
import { adminListDestacados, adminSaveDestacados } from './adminCms'
import { destacadosToOrderIds } from './mappers'
import { isLoggedIn } from './authToken'

export const FEATURED_EVENT = 'ifts2-featured-change'
const IG_FEATURED_KEY = 'ifts2-featured-ig-ids'

let cachedOrder: string[] = []

function emit() {
  window.dispatchEvent(new Event(FEATURED_EVENT))
}

function readIgFeatured(): string[] {
  try {
    const raw = localStorage.getItem(IG_FEATURED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((id): id is string => typeof id === 'string' && id.startsWith('ig:'))
      .slice(0, MAX_FEATURED)
  } catch {
    return []
  }
}

function writeIgFeatured(ids: string[]) {
  const next = ids
    .filter((id) => id.startsWith('ig:'))
    .slice(0, MAX_FEATURED)
  localStorage.setItem(IG_FEATURED_KEY, JSON.stringify(next))
}

/** Une nativos (API) + Instagram (local) respetando un orden preferido. */
function mergeFeaturedOrder(
  nativeIds: string[],
  igIds: string[],
  preferred?: string[],
): string[] {
  const allowed = new Set([...nativeIds, ...igIds])
  const out: string[] = []
  for (const id of preferred ?? []) {
    if (allowed.has(id) && !out.includes(id)) out.push(id)
  }
  for (const id of [...nativeIds, ...igIds]) {
    if (!out.includes(id)) out.push(id)
  }
  return out.slice(0, MAX_FEATURED)
}

export function readFeaturedOrderSync(): string[] {
  if (cachedOrder.length) return cachedOrder.slice(0, MAX_FEATURED)
  // Hidratar sync desde local (IG) para no perder estrellas al recargar UI
  const ig = typeof localStorage !== 'undefined' ? readIgFeatured() : []
  return ig.slice(0, MAX_FEATURED)
}

export async function fetchFeaturedOrder(): Promise<string[]> {
  const ig = readIgFeatured()
  if (!hasRemoteApi()) {
    // Preferir cache en memoria si ya hay orden optimista
    if (cachedOrder.length) return cachedOrder.slice(0, MAX_FEATURED)
    cachedOrder = ig.slice(0, MAX_FEATURED)
    return cachedOrder
  }
  try {
    const items = isLoggedIn()
      ? await adminListDestacados()
      : await fetchDestacados()
    const native = destacadosToOrderIds(items).slice(0, MAX_FEATURED)
    // preferred = cachedOrder (puede ser el optimista recién guardado)
    cachedOrder = mergeFeaturedOrder(native, ig, cachedOrder)
    return cachedOrder
  } catch {
    cachedOrder = mergeFeaturedOrder([], ig, cachedOrder)
    return cachedOrder
  }
}

/**
 * Guarda destacados (noticia / evento / meta) en el backend.
 * localStorage guarda ig: como respaldo offline y para hidratar al toque.
 * Meta debe estar visible en el backend o el PUT responde 409.
 */
export async function updateFeaturedOrder(order: string[]): Promise<string[]> {
  const payload = order.slice(0, MAX_FEATURED)
  const ig = payload.filter((id) => id.startsWith('ig:'))

  writeIgFeatured(ig)
  // Cache optimista YA: evita que un fetch en vuelo / FEATURED_EVENT
  // restaure el orden viejo y provoque el doble salto.
  cachedOrder = payload
  emit()

  if (!hasRemoteApi() || !isLoggedIn()) {
    return cachedOrder
  }

  try {
    const saved = await adminSaveDestacados(payload)
    const remote = destacadosToOrderIds(saved).slice(0, MAX_FEATURED)
    writeIgFeatured(remote.filter((id) => id.startsWith('ig:')))

    if (remote.join() !== cachedOrder.join()) {
      cachedOrder = remote
      invalidatePublicCache('destacados')
      emit()
    } else {
      invalidatePublicCache('destacados')
    }
    return cachedOrder
  } catch (err) {
    // Fallback: persistir al menos noticia/evento si Meta no está publicada
    const nativeOnly = payload.filter((id) => !id.startsWith('ig:'))
    if (nativeOnly.length) {
      try {
        const saved = await adminSaveDestacados(nativeOnly)
        cachedOrder = mergeFeaturedOrder(
          destacadosToOrderIds(saved),
          ig,
          payload,
        )
        invalidatePublicCache('destacados')
        emit()
      } catch {
        /* el caller marca el error original */
      }
    }
    throw err
  }
}
