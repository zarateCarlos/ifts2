/**
 * Tipos alineados al OpenAPI del backend
 * https://ifts2-backend.onrender.com/v3/api-docs
 */

export type NewsArea = 'GENERAL' | 'ALUMNOS' | 'DOCENTES' | 'TUTORIA' | 'EVENTOS'

export type EditorialEstado = 'BORRADOR' | 'PUBLICADA' | 'ARCHIVADA'

export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export type MeResponse = {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: 'ADMIN' | 'EDITOR'
  activo: boolean
}

export type ChangeOwnPasswordRequest = {
  currentPassword: string
  newPassword: string
}

export type ChangeOwnEmailRequest = {
  email: string
  currentPassword: string
}

export type ApiErrorBody = {
  timestamp?: string
  status?: number
  error?: string
  message?: string
  path?: string
}

export type NoticiaResumenResponse = {
  id: string
  titulo: string
  resumen: string
  publicadaAt?: string
  portadaUrl?: string
  area?: NewsArea
  mostrarEnNovedades?: boolean
  enlaceUrl?: string
  fecha?: string
}

export type NoticiaPublicaResponse = NoticiaResumenResponse & {
  contenido?: string
}

export type EventoPublicaResponse = {
  id: string
  titulo: string
  resumen: string
  descripcion?: string
  fechaInicio?: string
  fechaFin?: string
  lugar?: string
  portadaUrl?: string
  publicadaAt?: string
}

export type EventoFotoPublicaResponse = {
  id: string
  eventoId: string
  eventoTitulo: string
  fechaInicio?: string
  etiqueta?: string
  orden?: number
  imagenUrl?: string
}

export type InstitucionPublicaResponse = {
  id: string
  nombre?: string
  descripcion?: string
  direccion?: string
  email?: string
  telefono?: string
  horariosAtencion?: string
  publicadaAt?: string
  busquedaMapa?: string
  sitioOficialUrl?: string
  instagramUrl?: string
  facebookUrl?: string
}

export type InstitucionAdminResponse = InstitucionPublicaResponse & {
  estado?: EditorialEstado
  instagramVisible?: boolean
  facebookVisible?: boolean
  createdAt?: string
  updatedAt?: string
}

export type DatosSitioRequest = {
  direccion: string
  email: string
  telefono?: string
  busquedaMapa?: string
  sitioOficialUrl?: string
  instagramUrl?: string
  instagramVisible: boolean
  facebookUrl?: string
  facebookVisible: boolean
}

export type DestacadoPublicaResponse = {
  posicion?: number
  noticiaId?: string
  eventoId?: string
  /** Post de Instagram/Meta (contrato propuesto) */
  metaPostId?: string
  tipo?: 'NOTICIA' | 'EVENTO' | 'META' | string
  titulo?: string
  resumen?: string
  portadaUrl?: string
  enlaceUrl?: string
}

export type Referencia = {
  noticiaId?: string
  eventoId?: string
  metaPostId?: string
}

export type DestacadosRequest = {
  items: Referencia[]
}

export type CarreraPublicaResponse = {
  id: string
  nombre: string
  tituloOtorgado?: string
  descripcion?: string
  duracion?: string
  modalidad?: string
  requisitosIngreso?: string
  orden?: number
  imagenUrl?: string
  publicadaAt?: string
}

export type AutoridadPublicaResponse = {
  id: string
  nombre: string
  apellido: string
  cargo: string
  descripcion?: string
  orden?: number
  fotoUrl?: string
  publicadaAt?: string
}

export type TipoDocumento =
  | 'PLAN_ESTUDIO'
  | 'CORRELATIVIDADES'
  | 'REGLAMENTO'
  | 'CALENDARIO'
  | 'HORARIO'
  | 'RESOLUCION'
  | 'FORMULARIO'
  | 'INSTRUCTIVO'
  | 'OTRO'

export type DocumentoPublicaResponse = {
  id: string
  titulo: string
  descripcion?: string
  tipo?: TipoDocumento | string
  archivoUrl?: string
  publicadaAt?: string
}

export type DocumentoRequest = {
  titulo: string
  descripcion?: string
  tipo: TipoDocumento
}

export type DocumentoAdminResponse = {
  id: string
  titulo: string
  descripcion?: string
  tipo: TipoDocumento
  archivoUrl?: string
  estado: EditorialEstado
  publicadaAt?: string
  createdAt?: string
  updatedAt?: string
  archivoObjectKey?: string
}

export type EnlacePublicaResponse = {
  id: string
  titulo: string
  descripcion?: string
  url: string
  categoria?: string
  orden?: number
  publicadaAt?: string
}

export type StatusResponse = {
  status: string
}

export type CambiarEstadoRequest = {
  estado: EditorialEstado
}

export type InstitucionRequest = {
  nombre: string
  descripcion: string
  direccion: string
  email: string
  telefono?: string
  horariosAtencion?: string
}

export type NoticiaRequest = {
  titulo: string
  resumen: string
  contenido: string
  area?: NewsArea
  mostrarEnNovedades?: boolean
  enlaceUrl?: string
  fecha?: string
}

export type NoticiaAdminResponse = {
  id: string
  titulo: string
  resumen: string
  contenido?: string
  estado: EditorialEstado
  publicadaAt?: string
  createdAt?: string
  updatedAt?: string
  portadaObjectKey?: string
  portadaUrl?: string
  area?: NewsArea
  mostrarEnNovedades?: boolean
  enlaceUrl?: string
  fecha?: string
}

export type NoticiaPortadaResponse = {
  objectKey?: string
  publicUrl?: string
}

export type EventoRequest = {
  titulo: string
  resumen: string
  descripcion: string
  fechaInicio: string
  fechaFin: string
  lugar: string
}

export type EventoAdminResponse = {
  id: string
  titulo: string
  resumen: string
  descripcion?: string
  fechaInicio?: string
  fechaFin?: string
  lugar?: string
  portadaUrl?: string
  estado: EditorialEstado
  publicadaAt?: string
  createdAt?: string
  updatedAt?: string
  portadaObjectKey?: string
}

export type EventoFotoRequest = {
  etiqueta: string
  orden: number
}

export type EventoFotoAdminResponse = {
  id: string
  eventoId: string
  eventoTitulo?: string
  fechaInicio?: string
  estado?: EditorialEstado
  etiqueta?: string
  orden?: number
  imagenUrl?: string
  objectKey?: string
  createdAt?: string
  updatedAt?: string
}

export type StorageUrlResponse = {
  objectKey?: string
  publicUrl?: string
}

/** Post Meta/Instagram curado en el CMS (contrato propuesto). */
export type MetaPostAdminResponse = {
  id: string
  texto?: string
  caption?: string
  imagenUrl?: string
  thumbnailUrl?: string
  mediaType?: string
  fechaPublicacion?: string
  linkOriginal?: string
  permalink?: string
  visible?: boolean
  tieneStorage?: boolean
  objectKey?: string
}

