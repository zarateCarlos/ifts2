/** Áreas de comunidad (no confundir con Eventos del CMS / vida). */
export type ContentArea = 'docentes' | 'alumnos' | 'tutoria'

export const CONTENT_AREA_LABELS: Record<ContentArea, string> = {
  docentes: 'Docentes',
  alumnos: 'Alumnos',
  tutoria: 'Tutoría',
}

export type SiteContentItem = {
  id: string
  area: ContentArea
  title: string
  body: string
  dateISO: string
  dateLabel: string
  imageUrl: string
  /** Enlace opcional (interno o externo). */
  linkUrl: string
  linkLabel: string
  published: boolean
  /** Aparece en Novedades del home / listados unificados. */
  showInNovedades: boolean
  /** Puede entrar al carrusel de Destacados. */
  allowFeatured: boolean
}

export const CONTENT_EVENT = 'ifts2-site-content-change'
/** Cache de contenido actualizado; quien escucha solo relee, no vuelve a pedir. */
export const CONTENT_LOADED_EVENT = 'ifts2-site-content-loaded'

export function defaultSiteContent(): SiteContentItem[] {
  return []
}

export function newContentId() {
  return `c-${Date.now().toString(36)}`
}

export function emptyContentDraft(area: ContentArea = 'alumnos'): SiteContentItem {
  const today = new Date()
  const iso = today.toISOString().slice(0, 10)
  return {
    id: newContentId(),
    area,
    title: '',
    body: '',
    dateISO: iso,
    dateLabel: today.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    imageUrl: '',
    linkUrl: '',
    linkLabel: '',
    published: true,
    showInNovedades: true,
    allowFeatured: false,
  }
}
