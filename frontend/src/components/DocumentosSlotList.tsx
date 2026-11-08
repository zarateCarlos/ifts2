import { useEffect, useMemo, useState } from 'react'
import { useDocumentos } from '../data/cmsStore'
import {
  DOC_SLOTS_EVENT,
  resolveSlots,
  type DocumentoSeccion,
} from '../data/documentosSlots'

type Props = {
  seccion: DocumentoSeccion
  title?: string
  /** Mostrar iframe de vista previa (docentes / carrera) */
  embedPreview?: boolean
}

export function DocumentosSlotList({
  seccion,
  title = 'Documentos',
  embedPreview = false,
}: Props) {
  const { items, loading } = useDocumentos()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    function sync() {
      setTick((n) => n + 1)
    }
    window.addEventListener(DOC_SLOTS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(DOC_SLOTS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const resolved = useMemo(() => {
    void tick
    return resolveSlots(items).filter((s) => s.seccion === seccion)
  }, [items, seccion, tick])

  if (loading && resolved.length === 0) {
    return <p className="muted">Cargando documentos…</p>
  }

  if (resolved.length === 0) return null

  return (
    <div className="docs-panel panel">
      <h2 className="docs-panel__title">{title}</h2>
      <ul className="docs-panel__list">
        {resolved.map((doc) => (
          <li key={doc.key} className="docs-panel__item">
            <div className="docs-panel__row">
              <div className="docs-panel__text">
                <p className="docs-panel__name">
                  {doc.titulo}{' '}
                  <span className="docs-panel__year">{doc.anio}</span>
                </p>
                {doc.descripcion ? (
                  <p className="docs-panel__desc">{doc.descripcion}</p>
                ) : null}
              </div>
              <a
                className="btn docs-panel__open"
                href={doc.url}
                target="_blank"
                rel="noreferrer"
              >
                Abrir
              </a>
            </div>
            {embedPreview ? (
              <div className="docs-panel__frame-wrap">
                <iframe
                  title={doc.titulo}
                  src={doc.previewUrl}
                  className="docs-panel__frame"
                  loading="lazy"
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
