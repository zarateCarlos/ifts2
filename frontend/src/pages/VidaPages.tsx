import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MONTH_NAMES } from '../data/site'
import {
  ActivityFeed,
  formatCompactDate,
  interleaveIgInMiddle,
} from '../components/ActivityFeed'
import { MediaLightbox, type LightboxSlide } from '../components/MediaLightbox'
import { EVENT_COVER_FALLBACK } from '../data/eventCovers'
import {
  fetchEventoById,
  fetchEventos,
  fetchGaleria,
  fetchNoticiaById,
  peekCached,
} from '../api'
import {
  eventoToFeedItem,
  eventosToGalleryAlbums,
  groupFotosToAlbums,
  noticiaToFeedItem,
} from '../api/mappers'
import {
  loadUnifiedFeed,
  peekUnifiedFeed,
  subscribeFeed,
  type FeedItem,
} from '../data/feedStore'
import type {
  EventoFotoPublicaResponse,
  EventoPublicaResponse,
} from '../api/types'

const FEED_PAGE = 8
const GALLERY_PAGE = 12

const vidaLinks = [
  { to: '/vida/noticias', label: 'Eventos' },
  { to: '/vida/galeria', label: 'Galería' },
] as const

function useUnifiedFeed() {
  const [feed, setFeed] = useState<FeedItem[]>(
    () => peekUnifiedFeed() ?? [],
  )
  const [refreshing, setRefreshing] = useState(() => peekUnifiedFeed() == null)

  useEffect(() => {
    let cancelled = false
    function apply(items: FeedItem[]) {
      if (cancelled) return
      setFeed(items)
      setRefreshing(false)
    }
    // Cache primero; revalida en silencio (sin force en cada visita)
    if (!peekUnifiedFeed()) setRefreshing(true)
    void loadUnifiedFeed().then(apply)
    const onHardRefresh = () => {
      setRefreshing(true)
      void loadUnifiedFeed({ force: true }).then(apply)
    }
    window.addEventListener('ifts2-ig-visibility', onHardRefresh)
    window.addEventListener('ifts2-site-content-change', onHardRefresh)
    const unsub = subscribeFeed(() => {
      const cached = peekUnifiedFeed()
      if (!cancelled && cached) {
        setFeed(cached)
        setRefreshing(false)
      }
    })
    return () => {
      cancelled = true
      window.removeEventListener('ifts2-ig-visibility', onHardRefresh)
      window.removeEventListener('ifts2-site-content-change', onHardRefresh)
      unsub()
    }
  }, [])

  return { feed, refreshing }
}

function dateParts(iso: string) {
  const [y, m] = iso.split('-').map(Number)
  return { year: y, month: m }
}

export function VidaPage() {
  const { pathname } = useLocation()
  const isHub = pathname === '/vida'

  return (
    <div className="page">
      <div className="container container--wide stack">
        <div>
          <p className="page-kicker">Vida IFTS</p>
          <h1 className="page-title">Vida en el instituto</h1>
          <p className="page-lead">
            Eventos y galería — lo que hace el IFTS formando microemprendedores.
          </p>
        </div>

        <nav className="hub-links" aria-label="Secciones Vida IFTS">
          {vidaLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="hub-links__item"
              aria-current={pathname.startsWith(l.to) ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {isHub ? (
          <p className="muted">Elegí Eventos o Galería.</p>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  )
}

export function NoticiasPage() {
  const { feed, refreshing } = useUnifiedFeed()
  const mixed = useMemo(
    () =>
      interleaveIgInMiddle(
        feed.filter(
          (i) =>
            i.source === 'instagram' ||
            i.id.startsWith('noticia:') ||
            i.id.startsWith('evento:'),
        ),
      ),
    [feed],
  )
  const [visibleCount, setVisibleCount] = useState(FEED_PAGE)
  const shown = mixed.slice(0, visibleCount)
  const hasMore = visibleCount < mixed.length

  return (
    <div className="stack">
      <div className="vida-toolbar">
        <p className="muted" style={{ margin: 0 }}>
          Eventos y publicaciones del instituto (más Instagram).
        </p>
        {refreshing && (
          <span className="vida-toolbar__busy" aria-live="polite">
            Actualizando…
          </span>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="muted">
          {refreshing
            ? 'Cargando eventos…'
            : 'Todavía no hay eventos publicados.'}
        </p>
      ) : (
        <ActivityFeed items={shown} />
      )}

      {hasMore ? (
        <div className="more-wrap">
          <button
            type="button"
            className="btn btn--more"
            onClick={() => setVisibleCount((n) => n + FEED_PAGE)}
          >
            Ver más
          </button>
        </div>
      ) : (
        mixed.length > 0 && (
          <p className="muted muted--center">No hay más publicaciones.</p>
        )
      )}
    </div>
  )
}

export function NoticiaDetallePage() {
  const { id } = useParams()
  const [remote, setRemote] = useState<{
    title: string
    body: string
    dateISO: string
    dateLabel: string
    imageUrl: string
    slides: LightboxSlide[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setRemote(null)
    ;(async () => {
      // Preferir evento si el id es de evento (Evita cache null de noticia).
      const [evento, noticia, fotos] = await Promise.all([
        fetchEventoById(id, { force: true }),
        fetchNoticiaById(id),
        fetchGaleria({ eventoId: id }),
      ])
      if (cancelled) return

      if (evento) {
        const item = eventoToFeedItem(evento)
        const albumSlides =
          fotos.length > 0
            ? fotos
                .filter((f) => f.imagenUrl)
                .map((f) => ({
                  id: f.id,
                  src: f.imagenUrl!,
                  title: evento.titulo,
                  caption: f.etiqueta || item.dateLabel,
                }))
            : [
                {
                  id: evento.id,
                  src: item.imageUrl || EVENT_COVER_FALLBACK,
                  title: item.title,
                  caption: item.dateLabel,
                },
              ]
        setRemote({
          title: item.title,
          body: item.body,
          dateISO: item.dateISO,
          dateLabel: item.dateLabel,
          imageUrl: item.imageUrl || albumSlides[0]?.src || EVENT_COVER_FALLBACK,
          slides: albumSlides,
        })
      } else if (noticia) {
        const item = noticiaToFeedItem(noticia)
        setRemote({
          title: item.title,
          body: item.body,
          dateISO: item.dateISO,
          dateLabel: item.dateLabel,
          imageUrl: item.imageUrl || EVENT_COVER_FALLBACK,
          slides: [
            {
              id: noticia.id,
              src: item.imageUrl || EVENT_COVER_FALLBACK,
              title: item.title,
              caption: item.dateLabel,
            },
          ],
        })
      } else {
        setRemote(null)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const openAt = useCallback((i: number) => setLightboxIndex(i), [])
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  if (loading) return <p className="muted">Cargando…</p>

  if (!remote) {
    return (
      <div className="activity-card">
        <div className="activity-card__copy">
          <h2 className="activity-card__title">No encontrada</h2>
          <p className="activity-card__body">Esa publicación no está disponible.</p>
          <Link className="link-row" to="/vida/noticias">
            ← Volver a eventos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <article className="stack detail-feed">
      <article className="activity-card activity-card--detail">
        <button
          type="button"
          className="activity-card__media activity-card__media--hit"
          onClick={() => openAt(0)}
          aria-label={`Ampliar foto de ${remote.title}`}
        >
          <img src={remote.imageUrl} alt="" />
        </button>
        <div className="activity-card__copy">
          <time className="activity-card__date" dateTime={remote.dateISO}>
            {remote.dateLabel}
          </time>
          <h1 className="activity-card__title activity-card__title--detail">
            {remote.title}
          </h1>
          <p
            className="activity-card__body activity-card__body--detail"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {remote.body}
          </p>
        </div>
      </article>

      {remote.slides.length > 0 && (
        <div className="stack">
          <h2 className="section__title detail-feed__photos-title">Fotos</h2>
          <div className="photo-grid">
            {remote.slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                className="photo-grid__item"
                onClick={() => openAt(i)}
                aria-label={`Ampliar ${slide.title || 'foto'}`}
              >
                <img src={slide.src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      <Link className="link-row" to="/vida/noticias">
        ← Volver a eventos
      </Link>

      <MediaLightbox
        slides={remote.slides}
        index={lightboxIndex}
        onClose={closeLightbox}
        onIndexChange={setLightboxIndex}
      />
    </article>
  )
}

type GalleryAlbum = {
  id: string
  title: string
  dateISO: string
  coverUrl: string
  imageCount: number
  slides: LightboxSlide[]
  isIg?: boolean
}

function buildCmsAlbums(
  fotos: EventoFotoPublicaResponse[],
  eventos: EventoPublicaResponse[],
): GalleryAlbum[] {
  const fromFotos = groupFotosToAlbums(fotos)
  const albumIds = new Set(fromFotos.map((a) => a.id))
  const fromPortadas = eventosToGalleryAlbums(eventos, albumIds)
  return [...fromFotos, ...fromPortadas]
}

function igAlbumsFromFeed(feed: FeedItem[]): GalleryAlbum[] {
  return feed
    .filter((i) => i.source === 'instagram' && i.imageUrl)
    .map((i) => ({
      id: i.id,
      title: i.title,
      dateISO: i.dateISO,
      coverUrl: i.imageUrl,
      imageCount: 1,
      isIg: true,
      slides: [
        {
          id: i.id,
          src: i.imageUrl,
          title: i.title,
          caption: formatCompactDate(i.dateISO),
        },
      ],
    }))
}

function mergeGalleryAlbums(
  cms: GalleryAlbum[],
  ig: GalleryAlbum[],
): GalleryAlbum[] {
  return [...cms, ...ig].sort((a, b) => b.dateISO.localeCompare(a.dateISO))
}

export function GaleriaPage() {
  const { feed, refreshing: feedRefreshing } = useUnifiedFeed()
  const [cmsAlbums, setCmsAlbums] = useState<GalleryAlbum[]>(() => {
    const fotos = peekCached<EventoFotoPublicaResponse[]>('galeria:all') ?? []
    const eventos = peekCached<EventoPublicaResponse[]>('eventos') ?? []
    return buildCmsAlbums(fotos, eventos)
  })
  const [year, setYear] = useState<number | 'all'>('all')
  const [month, setMonth] = useState<number | 'all'>('all')
  const [visibleCount, setVisibleCount] = useState(GALLERY_PAGE)
  const [lightboxSlides, setLightboxSlides] = useState<LightboxSlide[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(() => cmsAlbums.length === 0)

  useEffect(() => {
    let cancelled = false
    if (cmsAlbums.length === 0) setLoading(true)
    Promise.all([fetchGaleria(), fetchEventos()])
      .then(([fotos, eventos]) => {
        if (cancelled) return
        setCmsAlbums(buildCmsAlbums(fotos, eventos))
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // Solo al montar: el feed IG se mezcla aparte
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const albums = useMemo(
    () => mergeGalleryAlbums(cmsAlbums, igAlbumsFromFeed(feed)),
    [cmsAlbums, feed],
  )

  const withParts = useMemo(
    () =>
      albums.map((album) => {
        const { year: y, month: m } = dateParts(album.dateISO)
        return { album, year: y, month: m }
      }),
    [albums],
  )

  const years = useMemo(
    () =>
      [...new Set(withParts.map((x) => x.year).filter(Boolean))].sort(
        (a, b) => b - a,
      ),
    [withParts],
  )

  const filtered = useMemo(
    () =>
      withParts.filter((x) => {
        if (year !== 'all' && x.year !== year) return false
        if (month !== 'all' && x.month !== month) return false
        return Boolean(x.album.coverUrl)
      }),
    [withParts, year, month],
  )

  const monthsAvailable = useMemo(() => {
    const source =
      year === 'all' ? withParts : withParts.filter((x) => x.year === year)
    return [...new Set(source.map((x) => x.month).filter(Boolean))].sort(
      (a, b) => b - a,
    )
  }, [withParts, year])

  useEffect(() => {
    setVisibleCount(GALLERY_PAGE)
  }, [year, month])

  const shown = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  const busy = loading || feedRefreshing

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
    setLightboxSlides([])
  }, [])

  return (
    <div className="stack">
      <div className="vida-toolbar">
        <p className="muted" style={{ margin: 0 }}>
          Álbumes de eventos e Instagram. Tocá para ver en grande.
        </p>
        {busy && (
          <span className="vida-toolbar__busy" aria-live="polite">
            Actualizando…
          </span>
        )}
      </div>

      <div className="gallery-period" role="group" aria-label="Filtrar por fecha">
        <label className="gallery-period__field">
          <span>Año</span>
          <select
            value={year === 'all' ? 'all' : String(year)}
            onChange={(e) => {
              const v = e.target.value
              setYear(v === 'all' ? 'all' : Number(v))
              setMonth('all')
            }}
          >
            <option value="all">Todos</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="gallery-period__field">
          <span>Mes</span>
          <select
            value={month === 'all' ? 'all' : String(month)}
            onChange={(e) => {
              const v = e.target.value
              setMonth(v === 'all' ? 'all' : Number(v))
            }}
          >
            <option value="all">Todos</option>
            {monthsAvailable.map((m) => (
              <option key={m} value={m}>
                {MONTH_NAMES[m]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="muted">
          {loading ? 'Cargando fotos…' : 'No hay fotos para ese filtro.'}
        </p>
      ) : (
        <div className="gallery-album-grid">
          {shown.map(({ album }) => (
            <button
              key={album.id}
              type="button"
              className="gallery-album"
              onClick={() => {
                setLightboxSlides(album.slides)
                setLightboxIndex(0)
              }}
              aria-label={`${album.title}, ${album.imageCount} fotos`}
            >
              <div className="gallery-album__media">
                <img src={album.coverUrl} alt="" loading="lazy" />
                {album.isIg && (
                  <span className="gallery-album__ig" aria-hidden>
                    <img
                      src="/brand/social/instagram.svg"
                      alt=""
                      width={18}
                      height={18}
                    />
                  </span>
                )}
                <span className="gallery-album__count">
                  {album.imageCount}{' '}
                  {album.imageCount === 1 ? 'foto' : 'fotos'}
                </span>
              </div>
              <div className="gallery-album__meta">
                <time className="gallery-album__date" dateTime={album.dateISO}>
                  {formatCompactDate(album.dateISO)}
                </time>
                <h3 className="gallery-album__title">{album.title}</h3>
              </div>
            </button>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="more-wrap">
          <button
            type="button"
            className="btn btn--more"
            onClick={() => setVisibleCount((n) => n + GALLERY_PAGE)}
          >
            Ver más
          </button>
        </div>
      )}

      <MediaLightbox
        slides={lightboxSlides}
        index={lightboxIndex}
        onClose={closeLightbox}
        onIndexChange={setLightboxIndex}
      />
    </div>
  )
}

export function RedesPage() {
  return <Navigate to="/vida" replace />
}

export function InstagramPage() {
  return <RedesPage />
}
