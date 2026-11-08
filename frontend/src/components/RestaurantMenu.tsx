import { Link } from 'react-router-dom'

/** Orden de producto: ingreso primero para quien llega a conocer el instituto. */
const items = [
  {
    to: '/ingreso',
    name: 'Ingreso',
    note: 'Información y enlaces oficiales',
  },
  {
    to: '/carrera',
    name: 'Carrera',
    note: 'Tecnicatura superior gastronómica',
  },
  {
    to: '/vida/noticias',
    name: 'Eventos',
    note: 'Noticias y actividades',
  },
  {
    to: '/vida/galeria',
    name: 'Galería',
    note: 'Fotos por año y mes',
  },
] as const

function DirectoryMark() {
  return (
    <svg
      className="menu-card__mark"
      viewBox="0 0 64 64"
      width="36"
      height="36"
      aria-hidden
    >
      <circle
        cx="32"
        cy="32"
        r="29"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.4"
      />
      <path
        d="M22 18v10c0 3 2 5 4 5v13M20 18v8M24 18v8M28 18v8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M40 18c4 6 4 12 0 18v10M40 18v28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function RestaurantMenu() {
  return (
    <nav className="menu-card" aria-label="Secciones principales">
      <header className="menu-card__head">
        <DirectoryMark />
        <p className="menu-card__label">Secciones</p>
        <div className="menu-card__rule" aria-hidden />
      </header>

      <ul className="menu-card__list">
        {items.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="menu-card__row">
              <span className="menu-card__line">
                <span className="menu-card__name">{item.name}</span>
                <span className="menu-card__dots" aria-hidden />
                <span className="menu-card__go">Ir</span>
              </span>
              <span className="menu-card__note">{item.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
