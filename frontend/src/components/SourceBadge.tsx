import type { FeedItem } from '../data/feedStore'
import type { ContentArea } from '../data/contentTypes'

export type SourceKind =
  | 'docentes'
  | 'alumnos'
  | 'tutoria'
  | 'evento'
  | 'instagram'
  | 'noticia'

const LABELS: Record<SourceKind, string> = {
  docentes: 'Docentes',
  alumnos: 'Alumnos',
  tutoria: 'Tutoría',
  evento: 'Evento',
  instagram: 'Instagram',
  noticia: 'Novedad',
}

export function resolveSourceKind(input: {
  id?: string
  area?: ContentArea | string
  source?: string
}): SourceKind {
  const id = input.id ?? ''
  if (id.startsWith('ig:') || input.source === 'instagram') return 'instagram'
  if (id.startsWith('evento:')) return 'evento'
  if (input.area === 'docentes') return 'docentes'
  if (input.area === 'alumnos') return 'alumnos'
  if (input.area === 'tutoria') return 'tutoria'
  return 'noticia'
}

export function sourceKindFromFeedItem(item: FeedItem): SourceKind {
  return resolveSourceKind(item)
}

type Props = {
  kind: SourceKind
  className?: string
}

export function SourceBadge({ kind, className = '' }: Props) {
  return (
    <span
      className={`source-badge source-badge--${kind}${className ? ` ${className}` : ''}`}
    >
      {LABELS[kind]}
    </span>
  )
}
