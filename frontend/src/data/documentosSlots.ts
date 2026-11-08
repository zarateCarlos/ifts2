/**
 * Documentos institucionales fijos (origen Google Sites).
 * Alumnos: solo 2 más recientes por categoría (horario 1C/2C, mesas 1C/2C, agenda).
 * Admin edita título, año, descripción y PDF; no crea slots nuevos.
 */

import type { TipoDocumento } from '../api/types'

export type DocumentoSeccion =
  | 'docentes'
  | 'alumnos'
  | 'carrera'
  | 'ingreso'

/** Agrupa para “últimas 2” por tipo de documento de alumnos. */
export type DocumentoCategoria =
  | 'horario-1c'
  | 'horario-2c'
  | 'mesas-1c'
  | 'mesas-2c'
  | 'agenda'
  | 'docente'
  | 'carrera'
  | 'ingreso'

export type DocumentoSlot = {
  key: string
  seccion: DocumentoSeccion
  categoria: DocumentoCategoria
  titulo: string
  anio: number
  tipo: TipoDocumento
  driveFileId: string
  origen: 'file' | 'gdoc'
  localPath?: string
  descripcion?: string
}

export type DocumentoSlotOverride = {
  titulo?: string
  anio?: number
  descripcion?: string
}

const OVERRIDES_KEY = 'ifts2-doc-slot-overrides'
export const DOC_SLOTS_EVENT = 'ifts2-doc-slots-changed'

export const SLOT_MARKER = (key: string) => `[[slot:${key}]]`

export function parseSlotKey(descripcion?: string | null): string | null {
  if (!descripcion) return null
  const m = descripcion.match(/\[\[slot:([a-z0-9-]+)\]\]/i)
  return m?.[1] ?? null
}

/** Texto libre guardado junto al marker en el backend. */
export function buildSlotDescripcion(key: string, text?: string) {
  const body = (text ?? '').trim()
  return body ? `${SLOT_MARKER(key)}\n${body}` : SLOT_MARKER(key)
}

export function parseSlotDescripcionBody(descripcion?: string | null): string {
  if (!descripcion) return ''
  return descripcion.replace(/\[\[slot:[a-z0-9-]+\]\]\s*/i, '').trim()
}

export function drivePreviewUrl(id: string, origen: 'file' | 'gdoc') {
  return origen === 'gdoc'
    ? `https://docs.google.com/document/d/${id}/preview`
    : `https://drive.google.com/file/d/${id}/preview`
}

export function driveOpenUrl(id: string) {
  return `https://drive.google.com/open?id=${id}`
}

/**
 * Catálogo base reducido: 2 por categoría de alumnos + fijos docentes/carrera.
 * Orden natural: año descendente (lo más reciente primero).
 */
export const DOCUMENTOS_SLOTS: DocumentoSlot[] = [
  /* Docentes */
  {
    key: 'docentes-modelo-programa',
    seccion: 'docentes',
    categoria: 'docente',
    titulo: 'Modelo de programa y cronograma',
    anio: 2025,
    tipo: 'INSTRUCTIVO',
    driveFileId: '1SiYdCpqIJ4APt7wGvX3oVhURQeMmcyjp',
    origen: 'file',
    localPath: '/docs/1SiYdCpqIJ4APt7wGvX3oVhURQeMmcyjp.doc',
  },
  {
    key: 'docentes-modelo-plan-clases',
    seccion: 'docentes',
    categoria: 'docente',
    titulo: 'Modelo plan de clases',
    anio: 2025,
    tipo: 'INSTRUCTIVO',
    driveFileId: '1Rifdcv6Le_6uC6XPr5UCZtQyBhfac5waWbZbSABkKPc',
    origen: 'gdoc',
    localPath: '/docs/docentes-modelo-plan-clases.pdf',
  },

  /* Carrera */
  {
    key: 'carrera-plan-estudios',
    seccion: 'carrera',
    categoria: 'carrera',
    titulo: 'Plan de estudios',
    anio: 2025,
    tipo: 'PLAN_ESTUDIO',
    driveFileId: '1khDv3txkVHGUzEhzX3QxYQU8AFcG3SNL',
    origen: 'file',
    localPath: '/docs/1khDv3txkVHGUzEhzX3QxYQU8AFcG3SNL.pdf',
  },
  {
    key: 'carrera-listado-materias',
    seccion: 'carrera',
    categoria: 'carrera',
    titulo: 'Listado de materias por año y cuatrimestre',
    anio: 2025,
    tipo: 'PLAN_ESTUDIO',
    driveFileId: '1obFBdk3Z683UE7wFYtQLjLD81qzl5Yrq',
    origen: 'file',
    localPath: '/docs/1obFBdk3Z683UE7wFYtQLjLD81qzl5Yrq.pdf',
  },
  {
    key: 'carrera-correlatividades',
    seccion: 'carrera',
    categoria: 'carrera',
    titulo: 'Correlatividades',
    anio: 2025,
    tipo: 'CORRELATIVIDADES',
    driveFileId: '1An-S2Mmw7A9fQqK1gGjhatkiKxQDMH0w',
    origen: 'file',
    localPath: '/docs/1An-S2Mmw7A9fQqK1gGjhatkiKxQDMH0w.pdf',
  },
  {
    key: 'carrera-materias-promocionables',
    seccion: 'carrera',
    categoria: 'carrera',
    titulo: 'Materias promocionables',
    anio: 2025,
    tipo: 'PLAN_ESTUDIO',
    driveFileId: '15jqYGT-B1Lh050D9tPxWVdED5KeXuRKwXWYrkQIpCvk',
    origen: 'gdoc',
    localPath: '/docs/info-materias-promocionables.pdf',
  },
  {
    key: 'carrera-plantel-docente',
    seccion: 'carrera',
    categoria: 'carrera',
    titulo: 'Plantel docente',
    anio: 2025,
    tipo: 'OTRO',
    driveFileId: '1kXqVZ6ZjsFF_m9uVgUrqDqP5dZswjHdYRWDhAHLUUc8',
    origen: 'gdoc',
    localPath: '/docs/info-plantel-docente.pdf',
  },

  /* Alumnos — 2 últimos por categoría */
  {
    key: 'alumnos-horarios-1c-2026',
    seccion: 'alumnos',
    categoria: 'horario-1c',
    titulo: 'Horarios — 1º cuatrimestre',
    anio: 2026,
    tipo: 'HORARIO',
    driveFileId: '1FMEhurMUne3spL0q05XrmJBPrneOMrhn',
    origen: 'file',
    localPath: '/docs/1FMEhurMUne3spL0q05XrmJBPrneOMrhn.xlsx',
  },
  {
    key: 'alumnos-horarios-1c-2025',
    seccion: 'alumnos',
    categoria: 'horario-1c',
    titulo: 'Horarios — 1º cuatrimestre',
    anio: 2025,
    tipo: 'HORARIO',
    driveFileId: '1ZmCwnSp1Q115rSjNX2I1KzTrzbTogWad',
    origen: 'file',
    localPath: '/docs/1ZmCwnSp1Q115rSjNX2I1KzTrzbTogWad.xlsx',
  },
  {
    key: 'alumnos-mesas-2c-2025',
    seccion: 'alumnos',
    categoria: 'mesas-2c',
    titulo: 'Mesas de exámenes — 2º cuatrimestre',
    anio: 2025,
    tipo: 'CALENDARIO',
    driveFileId: '1u29kLupcg35j-HiDEq1L5iVvYWTF5RJt',
    origen: 'file',
    localPath: '/docs/1u29kLupcg35j-HiDEq1L5iVvYWTF5RJt.xlsx',
    descripcion: 'Llamado julio-agosto 2025',
  },
  {
    key: 'alumnos-mesas-1c-2025',
    seccion: 'alumnos',
    categoria: 'mesas-1c',
    titulo: 'Mesas de exámenes — 1º cuatrimestre',
    anio: 2025,
    tipo: 'CALENDARIO',
    driveFileId: '1Uo-m07sx94ghv8GmHl3ierH1w0tgql7H',
    origen: 'file',
    localPath: '/docs/1Uo-m07sx94ghv8GmHl3ierH1w0tgql7H.xlsx',
    descripcion: 'Llamado febrero-marzo 2025',
  },
  {
    key: 'alumnos-mesas-2c-2024',
    seccion: 'alumnos',
    categoria: 'mesas-2c',
    titulo: 'Mesas de exámenes — 2º cuatrimestre',
    anio: 2024,
    tipo: 'CALENDARIO',
    driveFileId: '17aAEBZYQPrtqcl4V_h5ks7qbXL69EKYP',
    origen: 'file',
    localPath: '/docs/17aAEBZYQPrtqcl4V_h5ks7qbXL69EKYP.xlsx',
    descripcion: 'Llamado julio-agosto 2024',
  },
  {
    key: 'alumnos-mesas-1c-2024',
    seccion: 'alumnos',
    categoria: 'mesas-1c',
    titulo: 'Mesas de exámenes — 1º cuatrimestre',
    anio: 2024,
    tipo: 'CALENDARIO',
    driveFileId: '1x-2LiMw9Ayy0r8Or8YEm2xUNT2kXTvZY',
    origen: 'file',
    localPath: '/docs/1x-2LiMw9Ayy0r8Or8YEm2xUNT2kXTvZY.xlsx',
    descripcion: 'Llamado diciembre 2024 / turno 1C',
  },
  {
    key: 'alumnos-agenda-2024',
    seccion: 'alumnos',
    categoria: 'agenda',
    titulo: 'Agenda para estudiantes',
    anio: 2024,
    tipo: 'CALENDARIO',
    driveFileId: '1XhHCXeMGm3DNMqakTDIhHSSLDNPkUzSg',
    origen: 'file',
    localPath: '/docs/1XhHCXeMGm3DNMqakTDIhHSSLDNPkUzSg.xlsx',
  },
  {
    key: 'alumnos-agenda-2023',
    seccion: 'alumnos',
    categoria: 'agenda',
    titulo: 'Agenda para estudiantes',
    anio: 2023,
    tipo: 'CALENDARIO',
    driveFileId: '1YRFILFbPDQN0s0d9_p2EwtHnPrNzgs7Y',
    origen: 'file',
    localPath: '/docs/1YRFILFbPDQN0s0d9_p2EwtHnPrNzgs7Y.pdf',
  },
]

export const SECCION_SLOT_LABEL: Record<DocumentoSeccion, string> = {
  docentes: 'Docentes',
  alumnos: 'Alumnos',
  carrera: 'Información académica',
  ingreso: 'Ingreso',
}

export function loadSlotOverrides(): Record<string, DocumentoSlotOverride> {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, DocumentoSlotOverride>
  } catch {
    return {}
  }
}

export function saveSlotOverride(
  key: string,
  patch: DocumentoSlotOverride,
): Record<string, DocumentoSlotOverride> {
  const all = loadSlotOverrides()
  const prev = all[key] ?? {}
  all[key] = {
    titulo: patch.titulo?.trim() || prev.titulo,
    anio:
      typeof patch.anio === 'number' && patch.anio > 2000
        ? patch.anio
        : prev.anio,
    descripcion:
      patch.descripcion !== undefined ? patch.descripcion : prev.descripcion,
  }
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all))
  window.dispatchEvent(new Event(DOC_SLOTS_EVENT))
  return all
}

export function applyOverrides(
  slots: DocumentoSlot[] = DOCUMENTOS_SLOTS,
  overrides = loadSlotOverrides(),
): DocumentoSlot[] {
  return slots.map((s) => {
    const o = overrides[s.key]
    if (!o) return s
    return {
      ...s,
      titulo: o.titulo?.trim() || s.titulo,
      anio: typeof o.anio === 'number' ? o.anio : s.anio,
      descripcion:
        o.descripcion !== undefined ? o.descripcion : s.descripcion,
    }
  })
}

export function sortSlotsNewestFirst(slots: DocumentoSlot[]): DocumentoSlot[] {
  return [...slots].sort((a, b) => {
    if (b.anio !== a.anio) return b.anio - a.anio
    return a.titulo.localeCompare(b.titulo, 'es')
  })
}

export function slotsBySeccion(seccion: DocumentoSeccion): DocumentoSlot[] {
  return sortSlotsNewestFirst(
    applyOverrides().filter((s) => s.seccion === seccion),
  )
}

export type ResolvedDocumento = DocumentoSlot & {
  url: string
  previewUrl: string
  cmsId?: string
  cmsArchivoUrl?: string
  replaced: boolean
}

export function resolveSlots(
  cmsDocs: { id: string; descripcion?: string; archivoUrl?: string; titulo?: string }[],
): ResolvedDocumento[] {
  const bySlot = new Map<string, (typeof cmsDocs)[0]>()
  for (const d of cmsDocs) {
    const key = parseSlotKey(d.descripcion)
    if (key) bySlot.set(key, d)
  }
  return sortSlotsNewestFirst(applyOverrides()).map((slot) => {
    const cms = bySlot.get(slot.key)
    const cmsUrl = cms?.archivoUrl || undefined
    const url = cmsUrl || slot.localPath || driveOpenUrl(slot.driveFileId)
    return {
      ...slot,
      url,
      previewUrl: cmsUrl || drivePreviewUrl(slot.driveFileId, slot.origen),
      cmsId: cms?.id,
      cmsArchivoUrl: cmsUrl,
      replaced: Boolean(cmsUrl),
    }
  })
}
