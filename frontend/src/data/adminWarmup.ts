import { ensureInstituteBundle } from '../api/siteSettingsApi'
import { fetchFeaturedOrder } from '../api/featuredApi'
import { loadUnifiedFeed } from './feedStore'

/** Precarga en background tras login / al abrir el panel. */
export function warmupAdmin() {
  return Promise.allSettled([
    ensureInstituteBundle(),
    loadUnifiedFeed(),
    fetchFeaturedOrder(),
  ])
}
