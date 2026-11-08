import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  igToFeedItem,
  isFeatured,
  loadFeaturedOrder,
  loadUnifiedFeed,
  peekUnifiedFeed,
  MAX_FEATURED,
  resolveFeaturedItems,
  subscribeFeatured,
  type FeedItem,
} from '../data/feedStore'
import { adminListDestacados } from '../api/adminCms'
import { destacadoToFeedItem } from '../api/mappers'
import {
  igImageUrl,
  isIgPostVisible,
  isIgStoragePurged,
  loadIgStoragePurged,
  setIgPostVisible,
  setIgStoragePurged,
  type IgPost,
} from '../data/instagramFeed'
import {
  ApiError,
  adminListMetaPosts,
  adminPurgeMetaPostStorage,
  adminSetMetaPostVisibility,
  adminSyncMetaPosts,
  fetchFeaturedOrder,
  fetchMe,
  hasRemoteApi,
  isMetaEndpointMissing,
  login,
  normalizeMetaAdminPost,
  notifyStorageChanged,
  updateFeaturedOrder,
  visibilityMapFromMeta,
} from '../api'
import { AdminSaveStatus } from '../components/AdminSaveStatus'
import { AdminToastHost } from '../components/AdminToastHost'
import { AdminDocumentosSection } from './admin/AdminDocumentosSection'
import {
  dismissAdminToast,
  pushAdminToast,
  replaceAdminToast,
} from '../data/adminToast'
import {
  mapsEmbedUrl,
  useInstituteProfile,
  defaultContact,
} from '../data/instituteStore'
import { useSocialLinks } from '../data/socialStore'
import { warmupAdmin } from '../data/adminWarmup'
import type { SocialLink } from '../data/site'
import { institute } from '../data/site'
import { clearAuth, isAuthed, markLocalAuthed } from './admin/adminAuth'
import { StorageUsageCard } from '../components/StorageUsageCard'
import { FeaturedBentoSortable } from '../components/FeaturedBentoSortable'
import { SourceBadge, sourceKindFromFeedItem } from '../components/SourceBadge'
import {
  ADMIN_SECTIONS,
  canManageSection,
  canViewSection,
  firstAllowedAdminPath,
  hasAnySectionAccess,
  pathToSection,
  refreshPanelAccess,
  setSessionAdminEmail,
  usePanelAccess,
} from '../data/adminRolesStore'

export function AdminLayout() {
  const { pathname } = useLocation()
  // Leer auth en cada render: el state diferido rebotaba al login tras un login OK.
  const ok = isAuthed()
  const [navOpen, setNavOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const isLogin = pathname.endsWith('/login')
  const access = usePanelAccess()
  const [accessError, setAccessError] = useState('')

  useEffect(() => {
    if (ok) void warmupAdmin()
  }, [ok])

  // Permisos frescos en cada entrada / cambio de ruta: el Admin puede haberlos
  // cambiado y el backend los aplica en la siguiente petición.
  useEffect(() => {
    if (!ok || isLogin) return
    let cancelled = false
    void refreshPanelAccess()
      .then(() => {
        if (!cancelled) setAccessError('')
      })
      .catch((err) => {
        if (cancelled) return
        setAccessError(
          err instanceof ApiError
            ? err.message
            : 'No se pudieron cargar tus permisos.',
        )
      })
    return () => {
      cancelled = true
    }
  }, [ok, isLogin, pathname])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 859px)')
    const sync = () => {
      setMobileNav(mq.matches)
      if (!mq.matches) setNavOpen(false)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Cerrar el drawer al cambiar de ruta
  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!navOpen || !mobileNav) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [navOpen, mobileNav])

  if (!ok && !isLogin) {
    return <Navigate to="/admin/login" replace />
  }

  if (isLogin) {
    return (
      <div className="admin-login-shell">
        <Outlet />
      </div>
    )
  }

  const section = pathToSection(pathname)
  // Sin permisos cacheados todavía: no redirigir hasta que responda el backend.
  const waitingAccess = !access.loaded && section != null
  if (access.loaded && section === 'configuracion') {
    return <Navigate to="/admin/mi-cuenta" replace />
  }
  if (
    access.loaded &&
    section &&
    section !== 'configuracion' &&
    !canViewSection(section, access)
  ) {
    return <Navigate to={firstAllowedAdminPath()} replace />
  }

  const readOnly =
    access.loaded &&
    section != null &&
    section !== 'configuracion' &&
    canViewSection(section, access) &&
    !canManageSection(section, access)

  const drawerHidden = mobileNav && !navOpen
  const navItems = [
    { to: '/admin/mi-cuenta', label: 'Mi cuenta' },
    ...ADMIN_SECTIONS.filter((s) => canViewSection(s.id, access)).map((s) => ({
      to: s.path,
      label: s.label,
    })),
  ]

  return (
    <>
      <div className={`admin-shell${navOpen ? ' is-nav-open' : ''}`}>
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-topbar__menu"
            aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={navOpen}
            aria-controls="admin-nav"
            onClick={() => setNavOpen((v) => !v)}
          >
            <span className="admin-topbar__burger" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </button>
          <p className="admin-topbar__title">Admin IFTS N°2</p>
        </header>

        <button
          type="button"
          className="admin-nav-backdrop"
          aria-label="Cerrar menú"
          tabIndex={navOpen ? 0 : -1}
          onClick={() => setNavOpen(false)}
        />

        <aside
          id="admin-nav"
          className="admin-nav"
          aria-hidden={drawerHidden}
        >
          <div className="admin-nav__top">
            <div className="admin-nav__head">
              <p className="admin-nav__brand">Ajustes IFTS N°2 DE 20</p>
              <button
                type="button"
                className="admin-nav__close"
                aria-label="Cerrar menú"
                onClick={() => setNavOpen(false)}
              >
                ×
              </button>
            </div>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}

            {hasAnySectionAccess(access) && (
              <div className="admin-nav__storage">
                <StorageUsageCard compact />
              </div>
            )}

            <p className="admin-nav__site">
              <Link to="/" style={{ color: '#d7ebe0' }}>
                ← Ver sitio
              </Link>
            </p>
          </div>
          {ok && (
            <div className="admin-nav__footer">
              <button
                type="button"
                className="btn btn--danger admin-nav__logout"
                onClick={() => {
                  clearAuth()
                  window.location.href = '/admin/login'
                }}
              >
                Salir
              </button>
            </div>
          )}
        </aside>
        <div
          className={`admin-main${readOnly ? ' is-readonly' : ''}`}
          onSubmitCapture={
            readOnly
              ? (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  pushAdminToast({
                    kind: 'error',
                    title: 'Solo lectura',
                    message:
                      'Tu rol puede ver esta sección pero no gestionarla.',
                  })
                }
              : undefined
          }
          onClickCapture={
            readOnly
              ? (e) => {
                  const t = e.target as HTMLElement | null
                  const btn = t?.closest?.(
                    'button.btn--primary, button.btn--danger, button.btn--ghost',
                  )
                  if (!btn) return
                  if (btn.closest('.admin-nav')) return
                  e.preventDefault()
                  e.stopPropagation()
                  pushAdminToast({
                    kind: 'error',
                    title: 'Solo lectura',
                    message:
                      'Tu rol puede ver esta sección pero no gestionarla.',
                  })
                }
              : undefined
          }
        >
          {readOnly && (
            <div className="notice admin-readonly-banner" role="status">
              Solo lectura: podés ver esta sección, pero tu rol no permite
              gestionarla.
            </div>
          )}
          {accessError && !access.loaded ? (
            <div className="notice" role="alert">
              {accessError}
            </div>
          ) : null}
          {waitingAccess ? (
            <p className="muted">Cargando permisos…</p>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
      <AdminToastHost />
    </>
  )
}

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState('')
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (isAuthed()) {
      navigate(firstAllowedAdminPath(), { replace: true })
    }
  }, [navigate])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const user = String(fd.get('user') ?? '').trim().toLowerCase()
    const pass = String(fd.get('pass') ?? '')
    setError('')
    setHint('')
    setBusy(true)
    const slow = window.setTimeout(() => {
      setHint(
        'El backend tarda en responder (Render en frío). Seguimos intentando…',
      )
    }, 4000)
    try {
      if (!hasRemoteApi()) {
        setError('Configurá VITE_API_BASE_URL para usar el panel.')
        return
      }
      await login(user, pass)
      setSessionAdminEmail(user)
      markLocalAuthed()
      await Promise.all([
        fetchMe()
          .then((me) => setSessionAdminEmail(me.email))
          .catch(() => {
            /* Mi cuenta reintenta */
          }),
        refreshPanelAccess().catch(() => {
          /* el layout reintenta al montar */
        }),
      ])
      void warmupAdmin()
      navigate(firstAllowedAdminPath(), { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'No se pudo iniciar sesión',
      )
    } finally {
      window.clearTimeout(slow)
      setHint('')
      setBusy(false)
    }
  }

  return (
    <div className="panel admin-login-card">
      <h1 className="page-title" style={{ fontSize: '1.55rem' }}>
        Ingresar
      </h1>
      <p className="muted">
        Acceso al CMS de la <strong>IFTS N°2 DE 20</strong> (correo y contraseña del
        backend).
      </p>
      <form className="stack" onSubmit={onSubmit}>
        <div className="bedelia__field">
          <label htmlFor="admin-user">Correo</label>
          <input
            id="admin-user"
            name="user"
            type="email"
            required
            autoComplete="username"
          />
        </div>
        <div className="bedelia__field">
          <label htmlFor="admin-pass">Contraseña</label>
          <div className="password-field">
            <input
              id="admin-pass"
              name="pass"
              type={showPass ? 'text' : 'password'}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-field__toggle"
              aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPass}
              onClick={() => setShowPass((v) => !v)}
            >
              {showPass ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {hint && !error && (
          <div className="notice" role="status">
            {hint}
          </div>
        )}
        {error && (
          <div className="notice" role="alert">
            {error}
          </div>
        )}
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? 'Ingresando…' : 'Entrar al panel'}
        </button>
      </form>
    </div>
  )
}

export function AdminDashboardPage() {
  return <Navigate to={firstAllowedAdminPath()} replace />
}

export function AdminSinAccesoPage() {
  if (!isAuthed()) return <Navigate to="/admin/login" replace />
  return <Navigate to={firstAllowedAdminPath()} replace />
}

export function AdminDatosPage() {
  if (!isAuthed()) return <Navigate to="/admin/login" replace />

  const { profile, save } = useInstituteProfile()
  const { all: socialAll } = useSocialLinks()
  const [horarios, setHorarios] = useState(profile.hours)
  const [form, setForm] = useState(profile.contact)
  const [social, setSocial] = useState<SocialLink[]>(socialAll)
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [saveMsg, setSaveMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setHorarios(profile.hours)
    setForm(profile.contact)
  }, [profile])

  useEffect(() => setSocial(socialAll), [socialAll])

  useEffect(() => {
    if (saveStatus !== 'saved' && saveStatus !== 'error') return
    const t = window.setTimeout(() => setSaveStatus('idle'), 1800)
    return () => window.clearTimeout(t)
  }, [saveStatus])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const toastId = pushAdminToast({
      kind: 'loading',
      title: 'Guardando información…',
    })
    setBusy(true)
    setSaveStatus('saving')
    setSaveMsg('')
    try {
      const saved = await save({
        hours: horarios.trim(),
        contact: form,
        social,
      })
      setHorarios(saved.hours)
      setForm(saved.contact)
      setSocial(social)
      setSaveStatus('saved')
      setSaveMsg('Guardado')
      replaceAdminToast(toastId, {
        kind: 'success',
        title: 'Información guardada',
        message: 'Ya se refleja en el sitio público.',
      })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error'
      setSaveStatus('error')
      setSaveMsg(msg)
      replaceAdminToast(toastId, {
        kind: 'error',
        title: 'No se pudo guardar',
        message: msg,
      })
    } finally {
      setBusy(false)
    }
  }

  function patchSocial(id: string, patch: Partial<SocialLink>) {
    setSocial((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    )
  }

  return (
    <div className="stack">
      <div className="admin-page-head">
        <div>
          <p className="page-kicker">Admin</p>
          <h1 className="page-title">Información</h1>
          <p className="muted">
            Contacto, redes y documentos fijos (solo reemplazo de PDF). El nombre
            del instituto es fijo ({institute.name}).
          </p>
        </div>
        <AdminSaveStatus status={saveStatus} message={saveMsg} />
      </div>

      <form className="panel admin-form-compact" onSubmit={onSubmit} noValidate>
        <div className="admin-form-compact__grid">
          <div className="bedelia__field">
            <label htmlFor="admin-phone">Teléfono</label>
            <input
              id="admin-phone"
              value={form.phone}
              placeholder={defaultContact.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="bedelia__field">
            <label htmlFor="admin-email">Correo</label>
            <input
              id="admin-email"
              type="email"
              value={form.email}
              placeholder={defaultContact.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="bedelia__field">
            <label htmlFor="admin-hours">Horarios</label>
            <input
              id="admin-hours"
              value={horarios}
              placeholder="Ej. Lun a vie 8 a 16 hs"
              onChange={(e) => setHorarios(e.target.value)}
            />
          </div>
          <div className="bedelia__field admin-form-compact__span-2">
            <label htmlFor="admin-address">Dirección</label>
            <input
              id="admin-address"
              value={form.address}
              placeholder={defaultContact.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
          </div>
          <div className="bedelia__field">
            <label htmlFor="admin-map">Búsqueda del mapa</label>
            <input
              id="admin-map"
              value={form.mapQuery}
              placeholder={defaultContact.mapQuery}
              onChange={(e) => setForm({ ...form, mapQuery: e.target.value })}
            />
          </div>
          <div className="bedelia__field admin-form-compact__full">
            <label htmlFor="admin-site">Sitio oficial</label>
            <input
              id="admin-site"
              value={form.officialSite}
              placeholder={defaultContact.officialSite}
              onChange={(e) =>
                setForm({ ...form, officialSite: e.target.value })
              }
            />
          </div>
        </div>

        <h2 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0' }}>Redes</h2>
        <div className="admin-form-compact__grid">
          {social.map((l) => (
            <div key={l.id} className="bedelia__field">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={l.visible}
                  onChange={(e) =>
                    patchSocial(l.id, { visible: e.target.checked })
                  }
                />
                {l.label} visible
              </label>
              <input
                value={l.href}
                onChange={(e) => patchSocial(l.id, { href: e.target.value })}
                placeholder={
                  l.network === 'facebook'
                    ? 'https://www.facebook.com/iftsn2'
                    : 'https://www.instagram.com/ifts_2_ok/'
                }
              />
            </div>
          ))}
        </div>

        <iframe
          title="Vista previa mapa"
          src={mapsEmbedUrl(form.mapQuery || form.address)}
          style={{
            width: '100%',
            height: 140,
            border: 0,
            borderRadius: 8,
            display: form.mapQuery || form.address ? 'block' : 'none',
          }}
          loading="lazy"
        />

        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar información'}
        </button>
      </form>

      <AdminDocumentosSection />
    </div>
  )
}

export function AdminAjustesPage() {
  if (!isAuthed()) return <Navigate to="/admin/login" replace />

  const [feed, setFeed] = useState<FeedItem[]>(() => peekUnifiedFeed() ?? [])
  const [order, setOrder] = useState(loadFeaturedOrder)
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [saveMsg, setSaveMsg] = useState('')
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({})
  // Ignora respuestas viejas de fetch que llegarían después de un reorder
  const orderGen = useRef(0)
  const pendingOrder = useRef<string[] | null>(null)
  const feedGen = useRef(0)

  async function hydrateFeed() {
    const gen = ++feedGen.current
    const [base, destacados, meta] = await Promise.all([
      loadUnifiedFeed({ force: true }),
      adminListDestacados().catch(() => []),
      adminListMetaPosts(50).catch(() => []),
    ])
    if (gen !== feedGen.current) return

    const byId = new Map<string, FeedItem>()
    function put(item: FeedItem) {
      byId.set(item.id, item)
      const clean = item.id.replace(/^ig:/, '')
      byId.set(clean, item)
      byId.set(`ig:${clean}`, item)
    }
    for (const f of base) put(f)
    for (const d of destacados) {
      const item = destacadoToFeedItem(d)
      if (item) put(item)
    }
    for (const p of meta) {
      put(igToFeedItem(normalizeMetaAdminPost(p) as IgPost))
    }
    // Deduplicar por id canónico
    const seen = new Set<string>()
    const merged: FeedItem[] = []
    for (const f of byId.values()) {
      if (seen.has(f.id)) continue
      seen.add(f.id)
      merged.push(f)
    }
    setFeed(merged)
  }

  useEffect(() => {
    void hydrateFeed()
    const gen = orderGen.current
    void fetchFeaturedOrder().then((remote) => {
      // No pisar si el usuario ya reordenó o hay un save en curso
      if (orderGen.current !== gen || pendingOrder.current) return
      setOrder(remote)
    })
    return subscribeFeatured(() => {
      if (pendingOrder.current) {
        setOrder(pendingOrder.current)
        return
      }
      setOrder(loadFeaturedOrder())
      void hydrateFeed()
    })
  }, [])

  useEffect(() => {
    if (saveStatus !== 'saved' && saveStatus !== 'error') return
    const t = window.setTimeout(() => setSaveStatus('idle'), 1800)
    return () => window.clearTimeout(t)
  }, [saveStatus])

  const featured = useMemo(
    () => resolveFeaturedItems(feed, order),
    [feed, order],
  )

  const candidates = useMemo(
    () =>
      feed.filter(
        (i) =>
          i.id.startsWith('noticia:') ||
          i.id.startsWith('evento:') ||
          i.id.startsWith('ig:'),
      ),
    [feed],
  )

  const archiveByMonth = useMemo(() => {
    const rest = candidates.filter((c) => !order.includes(c.id))
    const map = new Map<string, FeedItem[]>()
    for (const item of rest) {
      const key = (item.dateISO || '1970-01-01').slice(0, 7)
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, items]) => ({
        key,
        label: monthLabelEs(key),
        items: items.sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
      }))
  }, [candidates, order])

  useEffect(() => {
    if (!archiveByMonth.length) return
    setOpenMonths((prev) => {
      if (Object.keys(prev).length) return prev
      return { [archiveByMonth[0].key]: true }
    })
  }, [archiveByMonth])

  function nextToggle(id: string) {
    if (order.includes(id)) return order.filter((x) => x !== id)
    if (order.length >= MAX_FEATURED) {
      setSaveStatus('error')
      setSaveMsg(`Máx. ${MAX_FEATURED}`)
      pushAdminToast({
        kind: 'error',
        title: 'Límite de ★',
        message: `Máximo ${MAX_FEATURED} destacados.`,
      })
      return order
    }
    return [...order, id]
  }

  async function persist(next: string[]) {
    orderGen.current += 1
    const gen = orderGen.current
    pendingOrder.current = next
    setOrder(next)
    setSaveStatus('saving')
    setSaveMsg('')
    const toastId = pushAdminToast({
      kind: 'loading',
      title: 'Guardando destacados…',
    })
    try {
      const remote = await updateFeaturedOrder(next)
      if (orderGen.current !== gen) {
        dismissAdminToast(toastId)
        return
      }
      pendingOrder.current = null
      // Solo sincronizar si el server filtró algo; si no, ya estamos en `next`
      if (remote.join() !== next.join()) setOrder(remote)
      setSaveStatus('saved')
      setSaveMsg('Guardado')
      void hydrateFeed()
      replaceAdminToast(toastId, {
        kind: 'success',
        title: 'Destacados actualizados',
        message: 'El carrusel del inicio ya refleja el orden.',
      })
    } catch (err) {
      if (orderGen.current !== gen) {
        dismissAdminToast(toastId)
        return
      }
      pendingOrder.current = null
      const msg = err instanceof ApiError ? err.message : 'Error al guardar'
      setSaveStatus('error')
      setSaveMsg(msg)
      // Rehidratar por si el backend aceptó solo parte (nativos)
      void hydrateFeed()
      void fetchFeaturedOrder().then((remote) => {
        if (orderGen.current === gen && !pendingOrder.current) setOrder(remote)
      })
      replaceAdminToast(toastId, {
        kind: 'error',
        title: 'No se pudieron guardar',
        message: msg,
      })
    }
  }

  return (
    <div className="stack">
      <div className="admin-page-head">
        <div>
          <p className="page-kicker">Admin</p>
          <h1 className="page-title">Destacados</h1>
          <p className="muted">
            Arrastrá con el asa ⠿ (fluido en celu y web). ✕ saca del carrusel. ★
            en el archivo suma un post.
          </p>
        </div>
        <div
          className={`admin-save-pill${saveStatus !== 'idle' ? ` is-${saveStatus}` : ''}`}
          role="status"
          aria-live="polite"
        >
          {saveStatus === 'saving' && (
            <>
              <span className="admin-save-pill__spin" aria-hidden />
              <span>Guardando</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <span className="admin-save-pill__dot" aria-hidden />
              <span>{saveMsg || 'Guardado'}</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <span className="admin-save-pill__dot admin-save-pill__dot--err" aria-hidden />
              <span>{saveMsg || 'Error'}</span>
            </>
          )}
        </div>
      </div>

      <section className="admin-featured-panel">
        <div className="admin-featured-head">
          <h2>Carrusel ({featured.length}/{MAX_FEATURED})</h2>
          <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
            Arrastrá por el asa ⠿
          </p>
        </div>

        {featured.length === 0 ? (
          <p className="muted">Todavía vacío. Abrí un mes abajo y tocá ★.</p>
        ) : null}

        <FeaturedBentoSortable
          items={featured}
          onReorder={(ids) => void persist(ids)}
          onRemove={(id) => void persist(nextToggle(id))}
        />
      </section>

      <section className="admin-archive">
        <h2>Archivo por mes</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Abrí un mes y tocá ★ para mandarlo al bento.
        </p>
        <div className="admin-month-acc">
          {archiveByMonth.map((group) => {
            const open = Boolean(openMonths[group.key])
            return (
              <div
                key={group.key}
                className={`admin-month-acc__item${open ? ' is-open' : ''}`}
              >
                <button
                  type="button"
                  className="admin-month-acc__btn"
                  aria-expanded={open}
                  onClick={() =>
                    setOpenMonths((prev) => ({
                      ...prev,
                      [group.key]: !prev[group.key],
                    }))
                  }
                >
                  <span className="admin-month-acc__label">
                    {group.label}
                    <span className="admin-month-acc__count">
                      {' '}
                      ({group.items.length})
                    </span>
                  </span>
                  <span
                    className={`admin-month-acc__chevron${open ? ' is-open' : ''}`}
                    aria-hidden
                  >
                    ▾
                  </span>
                </button>
                <div className="admin-month-acc__panel" aria-hidden={!open}>
                  <div className="admin-month-acc__panel-inner">
                    <ul className="ig-admin-list admin-month-acc__list">
                      {group.items.map((item) => {
                        const starred = isFeatured(item.id, order)
                        return (
                          <li key={item.id} className="ig-admin-row">
                            {item.imageUrl ? (
                              <img
                                className="ig-admin-row__thumb"
                                src={item.imageUrl}
                                alt=""
                              />
                            ) : (
                              <span className="ig-admin-row__thumb ig-admin-row__thumb--empty" />
                            )}
                            <div className="ig-admin-row__body">
                              <p className="ig-admin-row__caption">
                                <SourceBadge kind={sourceKindFromFeedItem(item)} />{' '}
                                {item.title}
                              </p>
                            </div>
                            <div className="ig-admin-row__actions">
                              <button
                                type="button"
                                className={`admin-star${starred ? ' is-on' : ''}`}
                                title={
                                  starred
                                    ? 'Quitar del carrusel'
                                    : 'Agregar al carrusel'
                                }
                                onClick={() => void persist(nextToggle(item.id))}
                              >
                                ★
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
          {archiveByMonth.length === 0 && (
            <p className="muted">No hay más posts fuera del carrusel.</p>
          )}
        </div>
      </section>
    </div>
  )
}

function monthLabelEs(ym: string) {
  const [y, m] = ym.split('-')
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]
  const mi = Number(m) - 1
  if (!y || mi < 0 || mi > 11) return ym
  return `${months[mi]} ${y}`
}

export function AdminRedesPage() {
  if (!isAuthed()) return <Navigate to="/admin/login" replace />

  const [posts, setPosts] = useState<IgPost[]>([])
  const [visibility, setVisibility] = useState<Record<string, boolean>>({})
  const [purged, setPurged] = useState(loadIgStoragePurged)
  const [order, setOrder] = useState(loadFeaturedOrder)
  const [busy, setBusy] = useState(false)
  const [purgingId, setPurgingId] = useState<string | null>(null)
  const [starBusy, setStarBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')

  async function reloadFromBackend() {
    const rows = await adminListMetaPosts(50)
    setPosts(rows.map((p) => normalizeMetaAdminPost(p) as IgPost))
    setVisibility(visibilityMapFromMeta(rows))
    for (const p of rows) {
      setIgStoragePurged(p.id, p.tieneStorage === false)
    }
    setPurged(loadIgStoragePurged())
    return rows
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    reloadFromBackend()
      .then(() => {
        if (!cancelled) setNote('')
      })
      .catch((err) => {
        if (cancelled) return
        setPosts([])
        const msg =
          err instanceof ApiError
            ? err.message
            : 'No se pudo cargar Instagram desde el backend.'
        setNote(
          err instanceof ApiError && err.status === 403
            ? 'Sin permiso para listar Instagram (403). Entrá con un usuario ADMIN o EDITOR.'
            : msg,
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    void fetchFeaturedOrder().then((o) => {
      if (!cancelled) setOrder(o)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => subscribeFeatured(() => setOrder(loadFeaturedOrder())), [])

  async function onSyncMeta() {
    const toastId = pushAdminToast({
      kind: 'loading',
      title: 'Sincronizando Instagram…',
    })
    setBusy(true)
    setNote('')
    try {
      const res = await adminSyncMetaPosts()
      const count = res.sincronizados ?? res.posts?.length
      const okMsg =
        count != null
          ? `Sync Meta OK: ${count} post(s). Quedan ocultos hasta que los marques Disponibles.`
          : res.message || 'Sync Meta OK.'
      setNote(okMsg)
      await reloadFromBackend()
      notifyStorageChanged()
      replaceAdminToast(toastId, {
        kind: 'success',
        title: 'Instagram actualizado',
        message: okMsg,
      })
    } catch (err) {
      if (isMetaEndpointMissing(err)) {
        const msg =
          'El backend no expone /api/admin/meta/sync. Revisá el deploy de Meta.'
        setNote(msg)
        replaceAdminToast(toastId, {
          kind: 'error',
          title: 'Endpoint Meta ausente',
          message: msg,
        })
      } else {
        const status = err instanceof ApiError ? err.status : 0
        const msg =
          err instanceof Error ? err.message : 'No se pudo sincronizar con Meta.'
        setNote(
          status === 403
            ? '403: tu usuario no puede sincronizar Meta (hace falta ADMIN/EDITOR).'
            : msg,
        )
        replaceAdminToast(toastId, {
          kind: 'error',
          title: 'No se pudo sincronizar',
          message: status === 403 ? 'Sin permiso (403)' : msg,
        })
      }
    } finally {
      setBusy(false)
    }
  }

  async function onToggleDisponible(post: IgPost) {
    const next = !isIgPostVisible(post.id, visibility)
    const toastId = pushAdminToast({
      kind: 'loading',
      title: next ? 'Publicando…' : 'Ocultando…',
    })
    try {
      const updated = await adminSetMetaPostVisibility(post.id, next)
      const normalized = normalizeMetaAdminPost(updated)
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? (normalized as IgPost) : p)),
      )
      setVisibility((prev) => ({ ...prev, [post.id]: updated.visible === true }))
      setIgPostVisible(post.id, updated.visible === true)
      if (updated.tieneStorage === false) setIgStoragePurged(post.id, true)
      else setIgStoragePurged(post.id, false)
      setPurged(loadIgStoragePurged())
      notifyStorageChanged()
      window.dispatchEvent(new Event('ifts2-ig-visibility'))
      const msg = next
        ? 'Disponible en el sitio (preview en Storage).'
        : 'Oculto del sitio. Ya podés borrar su Storage si hace falta.'
      setNote(msg)
      replaceAdminToast(toastId, {
        kind: 'success',
        title: next ? 'Visible en el sitio' : 'Oculto del sitio',
        message: msg,
      })
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'No se pudo cambiar la visibilidad.'
      setNote(msg)
      replaceAdminToast(toastId, {
        kind: 'error',
        title: 'Error de visibilidad',
        message: msg,
      })
    }
  }

  async function onToggleStar(post: IgPost) {
    const feedId = `ig:${post.id}`
    const next = order.includes(feedId)
      ? order.filter((x) => x !== feedId)
      : order.length >= MAX_FEATURED
        ? order
        : [...order, feedId]
    if (!order.includes(feedId) && order.length >= MAX_FEATURED) {
      const msg = `Máximo ${MAX_FEATURED} destacados. Sacá uno en Destacados.`
      setNote(msg)
      pushAdminToast({ kind: 'error', title: 'Límite de ★', message: msg })
      return
    }
    setStarBusy(true)
    const toastId = pushAdminToast({
      kind: 'loading',
      title: 'Actualizando ★…',
    })
    try {
      const remote = await updateFeaturedOrder(next)
      setOrder(remote)
      const on = remote.includes(feedId)
      const msg = on
        ? '★ Instagram en el carrusel. Podés ordenarlo en Destacados.'
        : 'Sacado del carrusel.'
      setNote(msg)
      replaceAdminToast(toastId, {
        kind: 'success',
        title: on ? 'Agregado al carrusel' : 'Sacado del carrusel',
        message: msg,
      })
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 409
            ? 'Primero poné el post en Disponible (tiene que estar publicado).'
            : err.message
          : 'No se pudo actualizar ★'
      setNote(msg)
      replaceAdminToast(toastId, {
        kind: 'error',
        title: 'Error ★',
        message: msg,
      })
    } finally {
      setStarBusy(false)
    }
  }

  async function onDeleteStorage(post: IgPost) {
    if (isIgPostVisible(post.id, visibility)) {
      const msg = 'Pasá el switch a “No disponible” antes de borrar el Storage.'
      setNote(msg)
      pushAdminToast({ kind: 'error', title: 'Primero ocultalo', message: msg })
      return
    }
    const ok = window.confirm(
      '¿Seguro que querés borrar este archivo del Storage?\n\nLibera espacio del plan free. El post sigue en la lista; si lo volvés a poner disponible, hay que sincronizar Meta para recuperar la imagen.',
    )
    if (!ok) return

    setPurgingId(post.id)
    setNote('')
    const toastId = pushAdminToast({
      kind: 'loading',
      title: 'Borrando del Storage…',
    })
    try {
      const res = await adminPurgeMetaPostStorage(post.id)
      setIgStoragePurged(post.id, true)
      setPurged(loadIgStoragePurged())
      notifyStorageChanged()
      const msg = res.message || 'Storage liberado.'
      setNote(msg)
      replaceAdminToast(toastId, {
        kind: 'success',
        title: 'Storage liberado',
        message: msg,
      })
    } catch (err) {
      if (
        isMetaEndpointMissing(err) ||
        (err instanceof ApiError && err.status === 0)
      ) {
        setIgStoragePurged(post.id, true)
        setPurged(loadIgStoragePurged())
        notifyStorageChanged()
        const msg =
          'Marcado liberado en demo. Backend: DELETE /api/admin/meta/posts/{id}/storage.'
        setNote(msg)
        replaceAdminToast(toastId, {
          kind: 'success',
          title: 'Marcado liberado',
          message: msg,
        })
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : 'No se pudo borrar del Storage.'
        setNote(msg)
        replaceAdminToast(toastId, {
          kind: 'error',
          title: 'No se pudo borrar',
          message: msg,
        })
      }
    } finally {
      setPurgingId(null)
    }
  }

  return (
    <div className="stack">
      <div>
        <p className="page-kicker">Admin</p>
        <h1 className="page-title">Instagram</h1>
        <p className="muted">
          Switch: disponible en el sitio. ★: va al carrusel (máx. {MAX_FEATURED}).
          Botón rojo: borra la imagen del Storage (con confirmación).
        </p>
      </div>

      <div className="row-actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={() => void onSyncMeta()}
        >
          {busy ? 'Sincronizando…' : 'Buscar posts nuevos en Meta'}
        </button>
        <Link className="btn btn--ghost" to="/admin/ajustes">
          Ordenar destacados
        </Link>
      </div>

      {note && (
        <div className="notice" role="status">
          {note}
        </div>
      )}

      {loading ? (
        <p className="muted">Cargando posts…</p>
      ) : posts.length === 0 ? (
        <p className="muted">
          No hay posts. Usá “Buscar posts nuevos en Meta”.
        </p>
      ) : (
        <ul className="ig-admin-list">
          {posts.map((post) => {
            const src = igImageUrl(post)
            const caption = (post.caption || '').slice(0, 120)
            const disponible = isIgPostVisible(post.id, visibility)
            const storageGone = isIgStoragePurged(post.id, purged)
            const feedId = `ig:${post.id}`
            const starred = isFeatured(feedId, order)
            const canDelete = !disponible && !storageGone
            return (
              <li key={post.id} className="ig-admin-row">
                {src && !storageGone ? (
                  <img className="ig-admin-row__thumb" src={src} alt="" />
                ) : (
                  <span className="ig-admin-row__thumb ig-admin-row__thumb--empty" />
                )}
                <div className="ig-admin-row__body">
                  <p className="ig-admin-row__caption">{caption || post.id}</p>
                  <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                    {storageGone
                      ? 'Storage liberado'
                      : disponible
                        ? 'Disponible en el sitio'
                        : 'No disponible'}
                    {starred ? ' · ★ en carrusel' : ''}
                  </p>
                </div>
                <div className="ig-admin-row__actions ig-admin-row__actions--row">
                  <label className="admin-switch" title="Disponible en el sitio">
                    <input
                      type="checkbox"
                      checked={disponible}
                      onChange={() => onToggleDisponible(post)}
                    />
                    <span className="admin-switch__track" aria-hidden />
                    <span className="admin-switch__label">
                      {disponible ? 'Disponible' : 'No disponible'}
                    </span>
                  </label>
                  <button
                    type="button"
                    className={`admin-star${starred ? ' is-on' : ''}`}
                    disabled={starBusy}
                    title={starred ? 'Quitar del carrusel' : 'Agregar al carrusel'}
                    onClick={() => void onToggleStar(post)}
                  >
                    ★
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--small"
                    disabled={!canDelete || purgingId === post.id}
                    title={
                      disponible
                        ? 'Pasá a No disponible primero'
                        : storageGone
                          ? 'Ya borrado'
                          : 'Borrar del Storage'
                    }
                    onClick={() => void onDeleteStorage(post)}
                  >
                    {purgingId === post.id ? '…' : 'Borrar'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
