/**
 * Feed público de Instagram vía backend (solo posts visibles con preview).
 */
import { apiGet } from './http'
import { hasRemoteApi } from './config'

export type MetaPostPublic = {
  id: string
  texto?: string
  imagenUrl?: string | null
  thumbnailUrl?: string | null
  mediaType?: string
  fechaPublicacion?: string
  linkOriginal?: string
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

export function normalizeMetaPublicPost(p: MetaPostPublic) {
  return {
    id: p.id,
    caption: p.texto,
    media_type: p.mediaType || 'IMAGE',
    media_url: uriToString(p.imagenUrl),
    thumbnail_url: uriToString(p.thumbnailUrl),
    permalink: p.linkOriginal || '',
    timestamp: p.fechaPublicacion,
  }
}

export async function fetchPublicMetaPosts(limit = 25) {
  if (!hasRemoteApi()) return [] as ReturnType<typeof normalizeMetaPublicPost>[]
  const res = await apiGet<{ content?: MetaPostPublic[] } | MetaPostPublic[]>(
    '/api/meta/posts',
    { auth: false, query: { page: 0, size: Math.min(limit, 100) } },
  )
  const rows = Array.isArray(res) ? res : (res.content ?? [])
  return rows.map(normalizeMetaPublicPost)
}
