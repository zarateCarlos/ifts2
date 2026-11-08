import { apiGet } from './http'
import { hasRemoteApi } from './config'
import { cachedFetch, invalidatePublicCache, peekCached } from './publicCache'
import type {
  AutoridadPublicaResponse,
  CarreraPublicaResponse,
  DestacadoPublicaResponse,
  DocumentoPublicaResponse,
  EnlacePublicaResponse,
  EventoFotoPublicaResponse,
  EventoPublicaResponse,
  InstitucionPublicaResponse,
  NewsArea,
  NoticiaPublicaResponse,
  NoticiaResumenResponse,
  PageResponse,
  StatusResponse,
} from './types'

export { invalidatePublicCache, peekCached }

async function listAllPages<T>(
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
  pageSize = 50,
): Promise<T[]> {
  const items: T[] = []
  let page = 0
  let totalPages = 1
  while (page < totalPages) {
    const res = await apiGet<PageResponse<T>>(path, {
      auth: false,
      query: { ...query, page, size: pageSize },
    })
    items.push(...(res.content ?? []))
    totalPages = Math.max(1, res.totalPages ?? 1)
    page += 1
    if (!res.content?.length) break
  }
  return items
}

export async function fetchHealth(): Promise<StatusResponse | null> {
  if (!hasRemoteApi()) return null
  try {
    return await apiGet<StatusResponse>('/api/health', { auth: false })
  } catch {
    return null
  }
}

export async function fetchNoticias(params?: {
  area?: NewsArea
  mostrarEnNovedades?: boolean
}): Promise<NoticiaResumenResponse[]> {
  if (!hasRemoteApi()) return []
  const key = `noticias:${params?.area ?? 'all'}:${params?.mostrarEnNovedades ?? 'any'}`
  return cachedFetch(key, () =>
    listAllPages<NoticiaResumenResponse>('/api/noticias', {
      area: params?.area,
      mostrarEnNovedades: params?.mostrarEnNovedades,
    }).catch(() => [] as NoticiaResumenResponse[]),
  )
}

export async function fetchNoticiaById(
  id: string,
): Promise<NoticiaPublicaResponse | null> {
  if (!hasRemoteApi()) return null
  return cachedFetch(`noticia:${id}`, async () => {
    try {
      return await apiGet<NoticiaPublicaResponse>(`/api/noticias/${id}`, {
        auth: false,
      })
    } catch {
      return null
    }
  })
}

export async function fetchEventos(): Promise<EventoPublicaResponse[]> {
  if (!hasRemoteApi()) return []
  return cachedFetch('eventos', () =>
    listAllPages<EventoPublicaResponse>('/api/eventos').catch(
      () => [] as EventoPublicaResponse[],
    ),
  )
}

export async function fetchEventoById(
  id: string,
  opts?: { force?: boolean },
): Promise<EventoPublicaResponse | null> {
  if (!hasRemoteApi()) return null
  return cachedFetch(
    `evento:${id}`,
    async () => {
      try {
        return await apiGet<EventoPublicaResponse>(`/api/eventos/${id}`, {
          auth: false,
        })
      } catch {
        return null
      }
    },
    { force: opts?.force, ttlMs: opts?.force ? 0 : undefined },
  )
}

export async function fetchGaleria(params?: {
  eventoId?: string
}): Promise<EventoFotoPublicaResponse[]> {
  if (!hasRemoteApi()) return []
  const key = `galeria:${params?.eventoId ?? 'all'}`
  return cachedFetch(key, () =>
    listAllPages<EventoFotoPublicaResponse>('/api/galeria', {
      eventoId: params?.eventoId,
    }).catch(() => [] as EventoFotoPublicaResponse[]),
  )
}

export async function fetchInstitucion(): Promise<InstitucionPublicaResponse | null> {
  if (!hasRemoteApi()) return null
  return cachedFetch('institucion', async () => {
    try {
      return await apiGet<InstitucionPublicaResponse>('/api/institucion', {
        auth: false,
      })
    } catch {
      return null
    }
  })
}

export async function fetchDestacados(): Promise<DestacadoPublicaResponse[]> {
  if (!hasRemoteApi()) return []
  return cachedFetch('destacados', async () => {
    try {
      return await apiGet<DestacadoPublicaResponse[]>('/api/destacados', {
        auth: false,
      })
    } catch {
      return []
    }
  })
}

export async function fetchCarreras(): Promise<CarreraPublicaResponse[]> {
  if (!hasRemoteApi()) return []
  return cachedFetch('carreras', () =>
    listAllPages<CarreraPublicaResponse>('/api/carreras').catch(
      () => [] as CarreraPublicaResponse[],
    ),
  )
}

export async function fetchAutoridades(): Promise<AutoridadPublicaResponse[]> {
  if (!hasRemoteApi()) return []
  return cachedFetch('autoridades', () =>
    listAllPages<AutoridadPublicaResponse>('/api/autoridades').catch(
      () => [] as AutoridadPublicaResponse[],
    ),
  )
}

export async function fetchDocumentos(): Promise<DocumentoPublicaResponse[]> {
  if (!hasRemoteApi()) return []
  return cachedFetch('documentos', () =>
    listAllPages<DocumentoPublicaResponse>('/api/documentos').catch(
      () => [] as DocumentoPublicaResponse[],
    ),
  )
}

export async function fetchEnlaces(): Promise<EnlacePublicaResponse[]> {
  if (!hasRemoteApi()) return []
  return cachedFetch('enlaces', () =>
    listAllPages<EnlacePublicaResponse>('/api/enlaces').catch(
      () => [] as EnlacePublicaResponse[],
    ),
  )
}
