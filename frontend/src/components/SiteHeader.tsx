import { NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  institute,
  navEntries,
  resolveSystemLinks,
  withPriorityDefaults,
  type NavEntry,
} from '../data/site'
import { SocialIcons } from './SocialIcons'
import { useEnlaces } from '../data/cmsStore'

function isGroupActive(entry: Extract<NavEntry, { type: 'group' }>, path: string) {
  return entry.children.some((c) => {
    const root = `/${c.to.split('/').filter(Boolean)[0] ?? ''}`
    return (
      path === c.to ||
      path.startsWith(`${c.to}/`) ||
      path === root ||
      path.startsWith(`${root}/`)
    )
  })
}

export function SiteHeader() {
  const { pathname } = useLocation()
  const { items: enlaces } = useEnlaces()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [mobileGroup, setMobileGroup] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)

  const systemLinks = useMemo(
    () => withPriorityDefaults(resolveSystemLinks(enlaces)),
    [enlaces],
  )
  const quick = systemLinks.filter((l) => l.priority)

  useEffect(() => {
    setMenuOpen(false)
    setOpenGroup(null)
    setMobileGroup(null)
  }, [pathname])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!navRef.current?.contains(e.target as Node)) setOpenGroup(null)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenGroup(null)
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <NavLink to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <img
            className="brand__logo"
            src="/brand/logo.jpg"
            alt={`Logo ${institute.name}`}
            width={44}
            height={44}
          />
          <span className="brand__text">
            <span className="brand__name">{institute.name}</span>
            <span className="brand__tag">{institute.career}</span>
          </span>
        </NavLink>

        <nav className="nav-desktop" aria-label="Principal" ref={navRef}>
          {navEntries.map((entry) => {
            if (entry.type === 'link') {
              return (
                <NavLink
                  key={entry.to}
                  to={entry.to}
                  end={entry.end}
                  onClick={() => setOpenGroup(null)}
                >
                  {entry.label}
                </NavLink>
              )
            }

            const active = isGroupActive(entry, pathname)
            const open = openGroup === entry.label
            return (
              <div
                key={entry.label}
                className={`nav-item${active ? ' is-active' : ''}${open ? ' is-open' : ''}`}
              >
                <button
                  type="button"
                  className="nav-item__btn"
                  aria-expanded={open}
                  onClick={() =>
                    setOpenGroup((g) => (g === entry.label ? null : entry.label))
                  }
                >
                  {entry.label}
                  <span className="nav-item__caret" aria-hidden>
                    {open ? '▴' : '▾'}
                  </span>
                </button>
                <div
                  className="nav-panel"
                  hidden={!open}
                  role="region"
                  aria-label={entry.label}
                >
                  {entry.children.map((child) => (
                    <Link
                      key={child.to}
                      to={child.to}
                      className="nav-panel__link"
                      onClick={() => setOpenGroup(null)}
                    >
                      <span className="nav-panel__title">{child.label}</span>
                      {child.desc && (
                        <span className="nav-panel__desc">{child.desc}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="nav-quick" aria-label="Enlaces">
            {quick.map((e) => (
              <a
                key={e.id}
                className={`nav-quick__link nav-quick__link--${e.id}`}
                href={e.href}
                target="_blank"
                rel="noreferrer"
              >
                {e.label}
              </a>
            ))}
            <Link className="nav-quick__login" to="/admin/login">
              Ingresar
            </Link>
          </div>
        </nav>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="nav-mobile"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="nav-toggle__bars" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <nav
        id="nav-mobile"
        className={`nav-mobile${menuOpen ? ' is-open' : ''}`}
        aria-label="Principal móvil"
      >
        {navEntries.map((entry) => {
          if (entry.type === 'link') {
            return (
              <NavLink
                key={entry.to}
                to={entry.to}
                end={entry.end}
                onClick={() => setMenuOpen(false)}
              >
                {entry.label}
              </NavLink>
            )
          }

          const expanded = mobileGroup === entry.label
          return (
            <div key={entry.label} className="nav-mobile__group">
              <button
                type="button"
                className="nav-mobile__group-btn"
                aria-expanded={expanded}
                onClick={() =>
                  setMobileGroup((g) => (g === entry.label ? null : entry.label))
                }
              >
                {entry.label}
                <span aria-hidden>{expanded ? '▴' : '▾'}</span>
              </button>
              {expanded && (
                <div className="nav-mobile__children">
                  {entry.children.map((child) => (
                    <Link
                      key={child.to}
                      to={child.to}
                      onClick={() => setMenuOpen(false)}
                    >
                      <strong>{child.label}</strong>
                      {child.desc && (
                        <span className="muted">{child.desc}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <div className="nav-mobile__quick">
          {systemLinks.map((e) => (
            <a key={e.id} href={e.href} target="_blank" rel="noreferrer">
              {e.label} ↗
            </a>
          ))}
          <Link to="/admin/login" onClick={() => setMenuOpen(false)}>
            Ingresar
          </Link>
        </div>
        <SocialIcons variant="panel" className="nav-mobile__social" />
      </nav>
    </header>
  )
}
