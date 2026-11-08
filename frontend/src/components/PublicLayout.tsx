import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'
import { BedeliaWidget } from './BedeliaWidget'
import { SiteSketchBackdrop } from './SiteSketchBackdrop'
import { BackToTop } from './BackToTop'
import { warmupPublicSite } from '../data/siteWarmup'

/** Al cambiar de ruta, arrancar siempre arriba (evita “entrar a mitad” de Eventos/Galería). */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

/**
 * Fondo → contenido → header fijo encima.
 * El frost del header debe poder muestrear el boceto sin un stacking
 * context opaco intermedio (Chromium mata backdrop-filter fácil).
 */
export function PublicLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    void warmupPublicSite()
  }, [])

  return (
    <>
      <ScrollToTop />
      <SiteSketchBackdrop />
      <div className="shell">
        <main className="shell-main">
          <div key={pathname} className="page-transition">
            <Outlet />
          </div>
        </main>
        <SiteFooter />
      </div>
      <SiteHeader />
      <BedeliaWidget />
      <BackToTop />
    </>
  )
}
