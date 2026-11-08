import { ensureInstituteBundle } from '../api/siteSettingsApi'
import { fetchFeaturedOrder } from '../api/featuredApi'
import {
  fetchDestacados,
  fetchEnlaces,
  fetchEventos,
  fetchGaleria,
  fetchNoticias,
} from '../api/publicApi'
import { loadUnifiedFeed } from './feedStore'

/** Precarga del sitio público: redes, novedades, destacados, galería. */
export function warmupPublicSite() {
  return Promise.allSettled([
    ensureInstituteBundle(),
    fetchEnlaces(),
    fetchNoticias(),
    fetchEventos(),
    fetchGaleria(),
    fetchDestacados(),
    fetchFeaturedOrder(),
    loadUnifiedFeed(),
  ])
}
