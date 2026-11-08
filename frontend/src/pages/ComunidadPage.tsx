import { Link, Outlet, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { ActivityFeed } from '../components/ActivityFeed'
import { DocumentosSlotList } from '../components/DocumentosSlotList'
import { contentToFeedItem, useSiteContent } from '../data/contentStore'
import type { ContentArea } from '../data/contentTypes'
import { CONTENT_AREA_LABELS } from '../data/contentTypes'
import { ALUMNOS_SITE, DOCENTES_SITE } from '../data/seccionesSite'

const SECTIONS = [
  { to: '/comunidad/docentes', area: 'docentes' as const },
  { to: '/comunidad/alumnos', area: 'alumnos' as const },
  { to: '/comunidad/tutoria', area: 'tutoria' as const },
] as const

export function ComunidadPage() {
  const { pathname } = useLocation()
  const isHub = pathname === '/comunidad'

  return (
    <div className="page">
      <div className="container stack">
        <div>
          <p className="page-kicker">Comunidad</p>
          <h1 className="page-title">Comunidad educativa</h1>
          <p className="page-lead">
            Elegí Docentes, Alumnos o Tutoría. Cada vista muestra solo su
            contenido.
          </p>
        </div>

        <nav className="hub-links" aria-label="Secciones comunidad">
          {SECTIONS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              aria-current={pathname.startsWith(s.to) ? 'page' : undefined}
            >
              {CONTENT_AREA_LABELS[s.area]}
            </Link>
          ))}
        </nav>

        {isHub ? (
          <p className="muted">Seleccioná un apartado arriba.</p>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  )
}

function AreaFeed({ area }: { area: ContentArea }) {
  const { items: rows, loading } = useSiteContent(area)
  const feed = useMemo(() => rows.map(contentToFeedItem), [rows])

  if (loading && feed.length === 0) {
    return <p className="muted">Cargando publicaciones…</p>
  }

  if (feed.length === 0) {
    return null
  }

  return (
    <div className="stack">
      <h2>Novedades</h2>
      <ActivityFeed items={feed} />
    </div>
  )
}

export function DocentesPage() {
  return (
    <div className="stack comunidad-area">
      <h2 className="comunidad-area__title">{CONTENT_AREA_LABELS.docentes}</h2>
      <div className="panel">
        <p style={{ margin: 0 }}>{DOCENTES_SITE.intro}</p>
      </div>
      <DocumentosSlotList seccion="docentes" title="Materiales" embedPreview />
      <AreaFeed area="docentes" />
    </div>
  )
}

export function AlumnosPage() {
  return (
    <div className="stack comunidad-area">
      <h2 className="comunidad-area__title">{CONTENT_AREA_LABELS.alumnos}</h2>

      <div className="panel stack">
        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Aulas Moodle</h3>
        <p style={{ margin: 0 }}>{ALUMNOS_SITE.aulasVirtualesTexto}</p>
        <p style={{ margin: 0 }}>
          <a
            href={ALUMNOS_SITE.aulasVirtualesUrl}
            target="_blank"
            rel="noreferrer"
          >
            {ALUMNOS_SITE.aulasVirtualesUrl.replace(/^https?:\/\//, '')}
          </a>
        </p>
      </div>

      <div className="panel stack">
        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Información importante</h3>
        <ul style={{ margin: 0 }}>
          {ALUMNOS_SITE.notasImportantes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <p className="muted" style={{ marginBottom: 0 }}>
          SIU Guaraní permite, entre otras cosas:
        </p>
        <ul style={{ margin: 0 }}>
          {ALUMNOS_SITE.siuNotas.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>

      <DocumentosSlotList
        seccion="alumnos"
        title="Horarios, mesas y agendas"
      />
      <AreaFeed area="alumnos" />
    </div>
  )
}

export function TutoriaPage() {
  const { items, loading } = useSiteContent('tutoria')
  return (
    <div className="stack comunidad-area">
      <h2 className="comunidad-area__title">{CONTENT_AREA_LABELS.tutoria}</h2>
      <AreaFeed area="tutoria" />
      {!loading && items.length === 0 ? (
        <p className="muted">
          Todavía no hay publicaciones en Tutoría. Cargalas en{' '}
          <Link to="/admin/contenido">Admin → Contenido</Link>.
        </p>
      ) : null}
    </div>
  )
}
