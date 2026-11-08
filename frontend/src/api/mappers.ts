import type { ContentArea, SiteContentItem } from '../data/contentTypes'
import type { SocialLink } from '../data/site'
import type { InstituteContact } from '../data/siteSettings'
import { emptySocialSlots } from '../data/siteSettings'
import type { FeedItem } from '../data/feedStore'
import type {
  DestacadoPublicaResponse,
  EventoFotoPublicaResponse,
  EventoPublicaResponse,
  InstitucionPublicaResponse,
  NewsArea,
  NoticiaPublicaResponse,
  NoticiaResumenResponse,
} from './types'

const AREA_MAP: Record<NewsArea, ContentArea | null> = {
  GENERAL: null,
  ALUMNOS: 'alumnos',
  DOCENTES: 'docentes',
  TUTORIA: 'tutoria',
  EVENTOS: null, // van a /admin/eventos + Vida → Eventos, no a comunidad
}

const AREA_TO_BACKEND: Record<ContentArea, NewsArea> = {
  alumnos: 'ALUMNOS',
  docentes: 'DOCENTES',
  tutoria: 'TUTORIA',
}

export function newsAreaToContentArea(area?: NewsArea): ContentArea | undefined {
  if (!area) return undefined
  return AREA_MAP[area] ?? undefined
}

export function contentAreaToNewsArea(area: ContentArea): NewsArea {
  return AREA_TO_BACKEND[area]
}

function toDateISO(value?: string) {
  if (!value) return '1970-01-01'
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  try {
    return new Date(value).toISOString().slice(0, 10)
  } catch {
    return '1970-01-01'
  }
}

function toDateLabel(iso: string) {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function noticiaId(id: string) {
  return `noticia:${id}`
}

export function eventoId(id: string) {
  return `evento:${id}`
}

export function metaFeedId(id: string) {
  return id.startsWith('ig:') ? id : `ig:${id}`
}

export function parseFeedRef(id: string): {
  kind: 'noticia' | 'evento' | 'meta' | 'other'
  uuid?: string
} {
  if (id.startsWith('noticia:')) return { kind: 'noticia', uuid: id.slice(8) }
  if (id.startsWith('evento:')) return { kind: 'evento', uuid: id.slice(7) }
  if (id.startsWith('ig:')) return { kind: 'meta', uuid: id.slice(3) }
  return { kind: 'other' }
}

export function noticiaToFeedItem(
  n: NoticiaResumenResponse | NoticiaPublicaResponse,
): FeedItem {
  const dateISO = toDateISO(n.fecha || n.publicadaAt)
  const body =
    ('contenido' in n && n.contenido) || n.resumen || ''
  const link = (n.enlaceUrl || '').trim()
  const external = /^https?:\/\//i.test(link)
  return {
    id: noticiaId(n.id),
    source: 'web',
    title: n.titulo,
    body,
    dateISO,
    dateLabel: toDateLabel(dateISO),
    imageUrl: n.portadaUrl || '',
    href: link || `/vida/noticias/${n.id}`,
    external: Boolean(link && external),
    area: newsAreaToContentArea(n.area),
  }
}

export function eventoToFeedItem(e: EventoPublicaResponse): FeedItem {
  const dateISO = toDateISO(e.fechaInicio || e.publicadaAt)
  const body = [e.resumen, e.descripcion, e.lugar].filter(Boolean).join('\n\n')
  return {
    id: eventoId(e.id),
    source: 'web',
    title: e.titulo,
    body,
    dateISO,
    dateLabel: toDateLabel(dateISO),
    imageUrl: e.portadaUrl || '',
    href: `/vida/noticias/${e.id}`,
    external: false,
    area: 'eventos',
  }
}

export function destacadoToFeedItem(d: DestacadoPublicaResponse): FeedItem | null {
  const id = d.noticiaId
    ? noticiaId(d.noticiaId)
    : d.eventoId
      ? eventoId(d.eventoId)
      : d.metaPostId
        ? metaFeedId(d.metaPostId)
        : null
  if (!id) return null
  const dateISO = toDateISO()
  const isMeta = Boolean(d.metaPostId) || d.tipo === 'META'
  return {
    id,
    source: isMeta ? 'instagram' : 'web',
    title: d.titulo || 'Destacado',
    body: d.resumen || '',
    dateISO,
    dateLabel: toDateLabel(dateISO),
    imageUrl: d.portadaUrl || '',
    href: d.enlaceUrl || (d.noticiaId
      ? `/vida/noticias/${d.noticiaId}`
      : d.eventoId
        ? `/vida/noticias/${d.eventoId}`
        : d.enlaceUrl || '#'),
    external: isMeta || /^https?:\/\//i.test(d.enlaceUrl || ''),
  }
}

export function noticiaToContentItem(
  n: NoticiaResumenResponse | NoticiaPublicaResponse,
): SiteContentItem | null {
  // Si el backend no manda area, no descartar: cae en alumnos.
  const area = newsAreaToContentArea(n.area) ?? 'alumnos'
  const dateISO = toDateISO(n.fecha || n.publicadaAt)
  return {
    id: n.id,
    area,
    title: n.titulo,
    body: ('contenido' in n && n.contenido) || n.resumen || '',
    dateISO,
    dateLabel: toDateLabel(dateISO),
    imageUrl: n.portadaUrl || '',
    linkUrl: n.enlaceUrl || '',
    linkLabel: n.enlaceUrl ? 'Ver más' : '',
    published: true,
    showInNovedades: Boolean(n.mostrarEnNovedades),
    allowFeatured: true,
  }
}

export function institucionToContact(
  inst: InstitucionPublicaResponse,
): InstituteContact {
  return {
    phone: String(inst.telefono || ''),
    email: String(inst.email || ''),
    address: String(inst.direccion || ''),
    mapQuery: String(inst.busquedaMapa || ''),
    officialSite: String(inst.sitioOficialUrl || ''),
  }
}

export function institucionToProfile(inst: InstitucionPublicaResponse) {
  return {
    name: String(inst.nombre || ''),
    description: String(inst.descripcion || ''),
    hours: String(inst.horariosAtencion || ''),
    contact: institucionToContact(inst),
  }
}

export function institucionToSocial(
  inst: InstitucionPublicaResponse & {
    instagramVisible?: boolean
    facebookVisible?: boolean
  },
): SocialLink[] {
  const defaults = emptySocialSlots()
  const igDefault = defaults.find((l) => l.network === 'instagram')!
  const fbDefault = defaults.find((l) => l.network === 'facebook')!

  const igHref =
    String(inst.instagramUrl ?? '').trim() || igDefault.href.trim()
  const fbHref =
    String(inst.facebookUrl ?? '').trim() || fbDefault.href.trim()

  // Solo se oculta si el CMS manda explicitamente visible: false.
  // Si la API omite URL, conservamos el fallback para no “parpadear y desaparecer”.
  return [
    {
      id: 'instagram',
      network: 'instagram',
      label: 'Instagram',
      href: igHref,
      visible: inst.instagramVisible !== false && Boolean(igHref),
    },
    {
      id: 'facebook',
      network: 'facebook',
      label: 'Facebook',
      href: fbHref,
      visible: inst.facebookVisible !== false && Boolean(fbHref),
    },
  ]
}

export function destacadosToOrderIds(items: DestacadoPublicaResponse[]): string[] {
  return items
    .map((d) =>
      d.noticiaId
        ? noticiaId(d.noticiaId)
        : d.eventoId
          ? eventoId(d.eventoId)
          : d.metaPostId
            ? metaFeedId(d.metaPostId)
            : null,
    )
    .filter(Boolean) as string[]
}

export function orderIdsToReferencias(ids: string[]) {
  return ids
    .map((id) => {
      const ref = parseFeedRef(id)
      if (ref.kind === 'noticia' && ref.uuid) return { noticiaId: ref.uuid }
      if (ref.kind === 'evento' && ref.uuid) return { eventoId: ref.uuid }
      if (ref.kind === 'meta' && ref.uuid) return { metaPostId: ref.uuid }
      return null
    })
    .filter(Boolean) as {
    noticiaId?: string
    eventoId?: string
    metaPostId?: string
  }[]
}

export type GalleryAlbumRemote = {
  id: string
  title: string
  dateISO: string
  coverUrl: string
  imageCount: number
  slides: { id: string; src: string; title: string; caption: string }[]
}

export function groupFotosToAlbums(
  fotos: EventoFotoPublicaResponse[],
): GalleryAlbumRemote[] {
  const map = new Map<string, GalleryAlbumRemote>()
  const sorted = [...fotos].sort(
    (a, b) => (a.orden ?? 0) - (b.orden ?? 0),
  )
  for (const f of sorted) {
    if (!f.imagenUrl) continue
    const dateISO = toDateISO(f.fechaInicio)
    let album = map.get(f.eventoId)
    if (!album) {
      album = {
        id: `evento:${f.eventoId}`,
        title: f.eventoTitulo || 'Álbum',
        dateISO,
        coverUrl: f.imagenUrl,
        imageCount: 0,
        slides: [],
      }
      map.set(f.eventoId, album)
    }
    album.slides.push({
      id: f.id,
      src: f.imagenUrl,
      title: f.eventoTitulo || album.title,
      caption: `${toDateLabel(dateISO)}${f.etiqueta ? ` · ${f.etiqueta}` : ''}`,
    })
    album.imageCount = album.slides.length
    if (!album.coverUrl) album.coverUrl = f.imagenUrl
  }
  return [...map.values()].sort((a, b) => b.dateISO.localeCompare(a.dateISO))
}

/** Eventos con portada (sin fotos de álbum) también entran a Galería. */
export function eventosToGalleryAlbums(
  eventos: EventoPublicaResponse[],
  existingAlbumIds: Set<string>,
): GalleryAlbumRemote[] {
  return eventos
    .filter(
      (e) =>
        Boolean(e.portadaUrl) &&
        !existingAlbumIds.has(`evento:${e.id}`) &&
        !existingAlbumIds.has(e.id),
    )
    .map((e) => {
      const dateISO = toDateISO(e.fechaInicio || e.publicadaAt)
      const src = e.portadaUrl!
      return {
        id: `evento:${e.id}`,
        title: e.titulo,
        dateISO,
        coverUrl: src,
        imageCount: 1,
        slides: [
          {
            id: e.id,
            src,
            title: e.titulo,
            caption: toDateLabel(dateISO),
          },
        ],
      }
    })
}
