import { Link } from 'react-router-dom'

/** 404 dentro del layout público (navbar + footer visibles). */
export function NotFoundPage() {
  return (
    <div className="page">
      <div className="container stack not-found">
        <p className="page-kicker">Error 404</p>
        <h1 className="page-title">Página no encontrada</h1>
        <p className="page-lead">
          Esa ruta no existe o se movió. Podés volver al inicio o usar el menú
          de arriba.
        </p>
        <div className="row-actions">
          <Link className="btn btn--primary" to="/">
            Ir al inicio
          </Link>
          <Link className="btn btn--ghost" to="/vida/noticias">
            Ver eventos
          </Link>
          <Link className="btn btn--ghost" to="/contacto">
            Contacto
          </Link>
        </div>
      </div>
    </div>
  )
}
