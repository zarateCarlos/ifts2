/** Navegación y utilidades de UI (no son contenido CMS). */

/** Marca fija del sitio (hero, logo, pie). No se edita desde admin. */
export const institute = {
  name: 'IFTS N°2 DE 20',
  fullName: 'Instituto de Formación Técnica N°2 de 20',
  career: 'Técnico superior en emprendimientos gastronómicos',
  tagline: 'Formamos microemprendedores gastronómicos',
  phone: '4638-5656',
  email: 'dfts_ifts2_de20@bue.edu.ar',
  address: 'Cañada de Gomez 3850, Villa Lugano',
  officialSite:
    'https://sites.google.com/bue.edu.ar/ifts-2-de-20/p%C3%A1gina-principal',
  /** Fallbacks públicos si el CMS aún no tiene URL / falla la API. */
  facebookUrl: 'https://www.facebook.com/iftsn2',
  instagramUrl: 'https://www.instagram.com/ifts_2_ok/',
} as const

export type SocialNetwork = 'instagram' | 'facebook' | 'youtube' | 'web'

export type SocialLink = {
  id: string
  network: SocialNetwork
  label: string
  href: string
  visible: boolean
}

/** Tipos legacy de media (componentes antiguos). */
export type EventImage = {
  id: string
  label: string
}

export type NewsItem = {
  id: string
  title: string
  dateLabel: string
  dateISO: string
  weekKey: string
  year: number
  month: number
  body: string
  images: EventImage[]
  featured: boolean
  published: boolean
}

export const MONTH_NAMES = [
  '',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

export type NavChild = {
  label: string
  to: string
  desc?: string
}

export type NavEntry =
  | { type: 'link'; label: string; to: string; end?: boolean }
  | { type: 'group'; label: string; children: NavChild[] }

/** Menú del sitio (estructura, no contenido editorial). */
export const navEntries: NavEntry[] = [
  {
    type: 'group',
    label: 'Información académica',
    children: [
      {
        label: 'Ingreso',
        to: '/ingreso',
        desc: 'Inscripción y enlaces',
      },
      {
        label: 'Carrera',
        to: '/carrera',
        desc: 'Plan y título',
      },
    ],
  },
  {
    type: 'group',
    label: 'Comunidad',
    children: [
      { label: 'Docentes', to: '/comunidad/docentes', desc: 'Espacio docentes' },
      { label: 'Alumnos', to: '/comunidad/alumnos', desc: 'Espacio alumnos' },
      { label: 'Tutoría', to: '/comunidad/tutoria', desc: 'Acompañamiento' },
    ],
  },
  {
    type: 'group',
    label: 'Vida IFTS',
    children: [
      {
        label: 'Eventos',
        to: '/vida/noticias',
        desc: 'Actividades del instituto',
      },
      { label: 'Galería', to: '/vida/galeria', desc: 'Fotos por fecha' },
    ],
  },
  { type: 'link', label: 'Contacto', to: '/contacto' },
]

/** Enlaces institucionales externos (SIU / Mi Argentina). Fallback si el CMS no tiene enlaces. */
export type SystemLink = {
  id: 'siu' | 'mi-argentina' | 'preinscripcion' | 'oferta' | string
  label: string
  href: string
  desc: string
  /** En desktop van al header; en mobile también al hero. */
  priority?: boolean
}

export const defaultSystemLinks: SystemLink[] = [
  {
    id: 'siu',
    label: 'SIU Guaraní',
    href: 'https://guarani-autogestionagencia.bue.edu.ar/',
    desc: 'Autogestión académica',
    priority: true,
  },
  {
    id: 'mi-argentina',
    label: 'Mi Argentina',
    href: 'https://mi.argentina.gob.ar/',
    desc: 'Trámites digitales',
    priority: true,
  },
  {
    id: 'preinscripcion',
    label: 'Preinscripción',
    href: 'https://guarani-autogestionagencia.bue.edu.ar/preinscripcion/SSAALV/acceso',
    desc: 'Guarani · ciclo lectivo',
  },
  {
    id: 'oferta',
    label: 'Oferta educativa',
    href: 'https://www.buenosaires.gob.ar/educacion/estudiantes/sistema-educativo/terciario/formacion-tecnica-superior',
    desc: 'FTS · GCBA',
  },
]

function guessSystemId(title: string, url: string): string {
  const t = title.toLowerCase()
  const u = url.toLowerCase()
  if (t.includes('siu') || u.includes('guarani')) return 'siu'
  if (t.includes('argentina') || u.includes('mi.argentina')) return 'mi-argentina'
  if (t.includes('preinscrip') || u.includes('preinscripcion')) return 'preinscripcion'
  if (t.includes('oferta')) return 'oferta'
  return `cms-${title.slice(0, 24)}`
}

/** Si el CMS no trae enlaces, usamos los defaults. Si trae, los mapeamos (con id para estilos). */
export function resolveSystemLinks(
  cms: { id: string; titulo: string; url: string; descripcion?: string; categoria?: string }[],
): SystemLink[] {
  if (!cms.length) return defaultSystemLinks.map((l) => ({ ...l }))

  return cms.map((e) => {
    const id = guessSystemId(e.titulo, e.url)
    const fallback = defaultSystemLinks.find((d) => d.id === id)
    return {
      id,
      label: e.titulo,
      href: e.url,
      desc: e.descripcion || e.categoria || fallback?.desc || '',
      priority: id === 'siu' || id === 'mi-argentina' || fallback?.priority,
    }
  })
}

/** Asegura SIU + Mi Argentina aunque el CMS traiga otros enlaces. */
export function withPriorityDefaults(links: SystemLink[]): SystemLink[] {
  const out = [...links]
  for (const required of defaultSystemLinks.filter((l) => l.priority)) {
    if (!out.some((l) => l.id === required.id)) {
      out.unshift({ ...required })
    }
  }
  return out
}
