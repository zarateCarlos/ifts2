import { institute } from '../data/site'
import { useAutoridades, useCarreras } from '../data/cmsStore'
import { DocumentosSlotList } from '../components/DocumentosSlotList'
import { CARRERA_SITE } from '../data/seccionesSite'

export function CarreraPage() {
  const { items: carreras, loading } = useCarreras()
  const { items: autoridades, loading: loadingAuth } = useAutoridades()

  return (
    <div className="page">
      <div className="container stack">
        <div>
          <p className="page-kicker">Información académica</p>
          <h1 className="page-title">Carrera</h1>
          <p className="hero__tagline">{institute.tagline}</p>
          <p className="page-lead">
            {institute.fullName}: {CARRERA_SITE.tituloOficial}.
          </p>
        </div>

        <div className="panel stack">
          <h2>Título oficial</h2>
          <p>
            <strong>{CARRERA_SITE.tituloOficial}</strong>
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            {CARRERA_SITE.resolucion}
          </p>
        </div>

        {loading ? (
          <p className="muted">Cargando…</p>
        ) : carreras.length === 0 ? (
          <div className="panel">
            <h2>Qué ofrecemos</h2>
            <p>
              Formamos <strong>microemprendedores</strong> en el área
              gastronómica, con título oficial de técnico superior.
            </p>
          </div>
        ) : (
          carreras.map((c) => (
            <div key={c.id} className="panel stack">
              <h2>{c.nombre}</h2>
              {c.tituloOtorgado && (
                <p>
                  <strong>Título:</strong> {c.tituloOtorgado}
                </p>
              )}
              {c.descripcion && (
                <p style={{ whiteSpace: 'pre-wrap' }}>{c.descripcion}</p>
              )}
              <ul>
                {c.duracion && <li>Duración: {c.duracion}</li>}
                {c.modalidad && <li>Modalidad: {c.modalidad}</li>}
                {c.requisitosIngreso && (
                  <li>Requisitos: {c.requisitosIngreso}</li>
                )}
              </ul>
              {c.imagenUrl && (
                <img
                  src={c.imagenUrl}
                  alt=""
                  style={{ maxWidth: '100%', borderRadius: 8 }}
                />
              )}
            </div>
          ))
        )}

        <div className="panel">
          <h2>Materias promocionables</h2>
          <p style={{ marginBottom: 0 }}>
            {CARRERA_SITE.materiasPromocionablesNota}
          </p>
        </div>

        <DocumentosSlotList
          seccion="carrera"
          title="Plan de estudios y documentos"
        />

        <div className="panel stack">
          <h2>Autoridades</h2>
          {loadingAuth ? (
            <p className="muted">Cargando…</p>
          ) : autoridades.length === 0 ? (
            <p className="muted">No hay autoridades publicadas.</p>
          ) : (
            <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
              {autoridades.map((a) => (
                <li
                  key={a.id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                  }}
                >
                  {a.fotoUrl && (
                    <img
                      src={a.fotoUrl}
                      alt=""
                      width={64}
                      height={64}
                      style={{ borderRadius: 8, objectFit: 'cover' }}
                    />
                  )}
                  <div>
                    <strong>
                      {a.nombre} {a.apellido}
                    </strong>
                    <div className="muted">{a.cargo}</div>
                    {a.descripcion && (
                      <p style={{ margin: '0.35rem 0 0' }}>{a.descripcion}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
