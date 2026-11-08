import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  apiUploadPost,
  apiUploadPut,
} from './http'
import type {
  CambiarEstadoRequest,
  DatosSitioRequest,
  DestacadoPublicaResponse,
  DestacadosRequest,
  DocumentoAdminResponse,
  DocumentoRequest,
  EditorialEstado,
  EventoAdminResponse,
  EventoFotoAdminResponse,
  EventoFotoRequest,
  EventoRequest,
  InstitucionAdminResponse,
  InstitucionRequest,
  NewsArea,
  NoticiaAdminResponse,
  NoticiaPortadaResponse,
  NoticiaRequest,
  PageResponse,
  StorageUrlResponse,
} from './types'
import { orderIdsToReferencias } from './mappers'
import { MAX_FEATURED } from '../data/siteSettings'

async function listAllAdmin<T>(
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<T[]> {
  const items: T[] = []
  let page = 0
  let totalPages = 1
  while (page < totalPages) {
    const res = await apiGet<PageResponse<T>>(path, {
      query: { ...query, page, size: 50 },
    })
    items.push(...(res.content ?? []))
    totalPages = Math.max(1, res.totalPages ?? 1)
    page += 1
    if (!res.content?.length) break
  }
  return items
}

/* ── Institución ── */

export async function adminGetInstitucion(): Promise<InstitucionAdminResponse | null> {
  try {
    return await apiGet<InstitucionAdminResponse>('/api/admin/institucion')
  } catch (err) {
    const status = (err as { status?: number })?.status
    if (status === 404) return null
    throw err
  }
}

export async function adminSaveInstitucion(
  body: InstitucionRequest,
): Promise<InstitucionAdminResponse> {
  return apiPut<InstitucionAdminResponse>('/api/admin/institucion', body)
}

export async function adminSaveDatosSitio(
  body: DatosSitioRequest,
): Promise<InstitucionAdminResponse> {
  return apiPut<InstitucionAdminResponse>(
    '/api/admin/institucion/datos-sitio',
    body,
  )
}

export async function adminSetInstitucionEstado(
  estado: EditorialEstado,
): Promise<InstitucionAdminResponse> {
  return apiPut<InstitucionAdminResponse>('/api/admin/institucion/estado', {
    estado,
  } satisfies CambiarEstadoRequest)
}

/* ── Noticias ── */

export async function adminListNoticias(params?: {
  estado?: EditorialEstado
  area?: NewsArea
}): Promise<NoticiaAdminResponse[]> {
  return listAllAdmin<NoticiaAdminResponse>('/api/admin/noticias', {
    estado: params?.estado,
    area: params?.area,
  })
}

export async function adminGetNoticia(id: string): Promise<NoticiaAdminResponse> {
  return apiGet<NoticiaAdminResponse>(`/api/admin/noticias/${id}`)
}

export async function adminCreateNoticia(
  body: NoticiaRequest,
): Promise<NoticiaAdminResponse> {
  return apiPost<NoticiaAdminResponse>('/api/admin/noticias', body)
}

export async function adminUpdateNoticia(
  id: string,
  body: NoticiaRequest,
): Promise<NoticiaAdminResponse> {
  return apiPut<NoticiaAdminResponse>(`/api/admin/noticias/${id}`, body)
}

export async function adminSetNoticiaEstado(
  id: string,
  estado: EditorialEstado,
): Promise<NoticiaAdminResponse> {
  return apiPut<NoticiaAdminResponse>(`/api/admin/noticias/${id}/estado`, {
    estado,
  })
}

export async function adminUploadNoticiaPortada(
  id: string,
  file: File,
): Promise<NoticiaPortadaResponse> {
  const fd = new FormData()
  fd.append('file', file)
  return apiUploadPut<NoticiaPortadaResponse>(
    `/api/admin/noticias/${id}/portada`,
    fd,
  )
}

export async function adminDeleteNoticiaPortada(id: string): Promise<void> {
  await apiDelete(`/api/admin/noticias/${id}/portada`)
}

/* ── Eventos ── */

export async function adminListEventos(params?: {
  estado?: EditorialEstado
}): Promise<EventoAdminResponse[]> {
  return listAllAdmin<EventoAdminResponse>('/api/admin/eventos', {
    estado: params?.estado,
  })
}

export async function adminGetEvento(id: string): Promise<EventoAdminResponse> {
  return apiGet<EventoAdminResponse>(`/api/admin/eventos/${id}`)
}

export async function adminCreateEvento(
  body: EventoRequest,
): Promise<EventoAdminResponse> {
  return apiPost<EventoAdminResponse>('/api/admin/eventos', body)
}

export async function adminUpdateEvento(
  id: string,
  body: EventoRequest,
): Promise<EventoAdminResponse> {
  return apiPut<EventoAdminResponse>(`/api/admin/eventos/${id}`, body)
}

export async function adminSetEventoEstado(
  id: string,
  estado: EditorialEstado,
): Promise<EventoAdminResponse> {
  return apiPut<EventoAdminResponse>(`/api/admin/eventos/${id}/estado`, {
    estado,
  } satisfies CambiarEstadoRequest)
}

export async function adminUploadEventoPortada(
  id: string,
  file: File,
): Promise<StorageUrlResponse> {
  const fd = new FormData()
  fd.append('file', file)
  return apiUploadPut<StorageUrlResponse>(`/api/admin/eventos/${id}/portada`, fd)
}

export async function adminDeleteEventoPortada(id: string): Promise<void> {
  await apiDelete(`/api/admin/eventos/${id}/portada`)
}

/* ── Fotos / galería ── */

export async function adminListGaleria(params?: {
  eventoId?: string
  estado?: EditorialEstado
}): Promise<EventoFotoAdminResponse[]> {
  return listAllAdmin<EventoFotoAdminResponse>('/api/admin/galeria', {
    eventoId: params?.eventoId,
    estado: params?.estado,
  })
}

export async function adminListEventoFotos(
  eventoId: string,
): Promise<EventoFotoAdminResponse[]> {
  return listAllAdmin<EventoFotoAdminResponse>(
    `/api/admin/eventos/${eventoId}/fotos`,
  )
}

export async function adminAddEventoFoto(
  eventoId: string,
  datos: EventoFotoRequest,
  file: File,
): Promise<EventoFotoAdminResponse> {
  const fd = new FormData()
  fd.append(
    'datos',
    new Blob([JSON.stringify(datos)], { type: 'application/json' }),
  )
  fd.append('file', file)
  return apiUploadPost<EventoFotoAdminResponse>(
    `/api/admin/eventos/${eventoId}/fotos`,
    fd,
  )
}

export async function adminUpdateEventoFoto(
  eventoId: string,
  fotoId: string,
  datos: EventoFotoRequest,
): Promise<EventoFotoAdminResponse> {
  return apiPut<EventoFotoAdminResponse>(
    `/api/admin/eventos/${eventoId}/fotos/${fotoId}`,
    datos,
  )
}

export async function adminReplaceEventoFotoArchivo(
  eventoId: string,
  fotoId: string,
  file: File,
): Promise<StorageUrlResponse> {
  const fd = new FormData()
  fd.append('file', file)
  return apiUploadPut<StorageUrlResponse>(
    `/api/admin/eventos/${eventoId}/fotos/${fotoId}/archivo`,
    fd,
  )
}

export async function adminDeleteEventoFoto(
  eventoId: string,
  fotoId: string,
): Promise<void> {
  await apiDelete(`/api/admin/eventos/${eventoId}/fotos/${fotoId}`)
}

/* ── Documentos (PDF) ── */

export async function adminListDocumentos(params?: {
  estado?: EditorialEstado
}): Promise<DocumentoAdminResponse[]> {
  return listAllAdmin<DocumentoAdminResponse>('/api/admin/documentos', {
    estado: params?.estado,
  })
}

export async function adminGetDocumento(
  id: string,
): Promise<DocumentoAdminResponse> {
  return apiGet<DocumentoAdminResponse>(`/api/admin/documentos/${id}`)
}

export async function adminCreateDocumento(
  body: DocumentoRequest,
): Promise<DocumentoAdminResponse> {
  return apiPost<DocumentoAdminResponse>('/api/admin/documentos', body)
}

export async function adminUpdateDocumento(
  id: string,
  body: DocumentoRequest,
): Promise<DocumentoAdminResponse> {
  return apiPut<DocumentoAdminResponse>(`/api/admin/documentos/${id}`, body)
}

export async function adminSetDocumentoEstado(
  id: string,
  estado: EditorialEstado,
): Promise<DocumentoAdminResponse> {
  return apiPut<DocumentoAdminResponse>(`/api/admin/documentos/${id}/estado`, {
    estado,
  })
}

export async function adminUploadDocumentoArchivo(
  id: string,
  file: File,
): Promise<StorageUrlResponse> {
  const fd = new FormData()
  fd.append('file', file)
  return apiUploadPut<StorageUrlResponse>(
    `/api/admin/documentos/${id}/archivo`,
    fd,
  )
}

export async function adminDeleteDocumentoArchivo(id: string): Promise<void> {
  await apiDelete(`/api/admin/documentos/${id}/archivo`)
}

/* ── Destacados ── */

export async function adminListDestacados(): Promise<DestacadoPublicaResponse[]> {
  return apiGet<DestacadoPublicaResponse[]>('/api/admin/destacados')
}

export async function adminSaveDestacados(
  orderIds: string[],
): Promise<DestacadoPublicaResponse[]> {
  const body: DestacadosRequest = {
    items: orderIdsToReferencias(orderIds).slice(0, MAX_FEATURED),
  }
  return apiPut<DestacadoPublicaResponse[]>('/api/admin/destacados', body)
}
