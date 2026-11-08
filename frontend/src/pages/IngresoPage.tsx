import { institute } from '../data/site'
import { useInstituteContact } from '../data/instituteStore'
import { useCarreras, useEnlaces } from '../data/cmsStore'
import {
  resolveSystemLinks,
  withPriorityDefaults,
} from '../data/site'
import { useMemo } from 'react'
import { DocumentosSlotList } from '../components/DocumentosSlotList'
import { INGRESO_SITE } from '../data/seccionesSite'

export function IngresoPage() {
  const { contact } = useInstituteContact()
  const { primary: carrera, loading: loadingCarrera } = useCarreras()
  const { items: enlaces, loading: loadingEnlaces } = useEnlaces()

  const systemLinks = useMemo(
    () => withPriorityDefaults(resolveSystemLinks(enlaces)),
    [enlaces],
  )

  return (
    <div className="page">
      <div className="container stack">
        <div>
          <p className="page-kicker">Información académica</p>
          <h1 className="page-title">Ingreso a la carrera</h1>
          <p className="page-lead">
            Fechas, requisitos y enlaces oficiales de preinscripción.
          </p>
        </div>

        <div className="panel stack">
          <h2>Ingreso {INGRESO_SITE.cicloActual}</h2>
          <ul style={{ margin: 0 }}>
            {INGRESO_SITE.fechas.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        <div className="panel stack">
          <h2>Examen de preingreso</h2>
          <p>
            <strong>Requisitos:</strong> {INGRESO_SITE.examen.requisitos}
          </p>
          <p>
            <strong>Qué se evalúa:</strong> {INGRESO_SITE.examen.evaluacion}
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Modalidad:</strong> {INGRESO_SITE.examen.modalidad}
          </p>
        </div>

        <div className="panel">
          <h2>Carrera</h2>
          {loadingCarrera ? (
            <p className="muted">Cargando…</p>
          ) : carrera ? (
            <>
              <p>
                <strong>{carrera.nombre}</strong>
              </p>
              {carrera.tituloOtorgado && <p>{carrera.tituloOtorgado}</p>}
              {carrera.requisitosIngreso && (
                <p style={{ whiteSpace: 'pre-wrap' }}>
                  {carrera.requisitosIngreso}
                </p>
              )}
            </>
          ) : (
            <>
              <p>
                <strong>{institute.career}</strong>
              </p>
            </>
          )}
        </div>

        <div className="panel stack">
          <h2>Enlaces</h2>
          <ul className="stack" style={{ paddingLeft: '1.1rem', margin: 0 }}>
            <li>
              <a
                href={INGRESO_SITE.ofertaUrl}
                target="_blank"
                rel="noreferrer"
              >
                Oferta educativa (CABA)
              </a>
            </li>
            <li>
              <a
                href={INGRESO_SITE.preinscripcionUrl}
                target="_blank"
                rel="noreferrer"
              >
                Preinscripción SIU Guaraní
              </a>
            </li>
            {loadingEnlaces
              ? null
              : systemLinks.map((e) => (
                  <li key={e.id}>
                    <a href={e.href} target="_blank" rel="noreferrer">
                      {e.label}
                    </a>
                    {e.desc && <span className="muted"> — {e.desc}</span>}
                  </li>
                ))}
          </ul>
        </div>

        <DocumentosSlotList seccion="ingreso" title="Documentos de ingreso" />

        {(contact.phone || contact.email) && (
          <div className="notice">
            Consultas:{' '}
            {contact.phone && <span>{contact.phone}</span>}
            {contact.phone && contact.email && ' · '}
            {contact.email && (
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            )}
            . También podés usar el formulario de bedelía.
          </div>
        )}
      </div>
    </div>
  )
}
