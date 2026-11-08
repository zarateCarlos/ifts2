import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { SocialIcons } from '../components/SocialIcons'
import { FeaturedCarousel } from '../components/FeaturedCarousel'
import { ActivityFeed, interleaveIgInMiddle } from '../components/ActivityFeed'
import {
  loadFeaturedOrder,
  loadUnifiedFeed,
  peekUnifiedFeed,
  resolveFeaturedItems,
  subscribeFeatured,
  subscribeFeed,
  type FeedItem,
} from '../data/feedStore'
import { fetchFeaturedOrder } from '../api/featuredApi'
import { useEnlaces } from '../data/cmsStore'
import {
  institute,
  resolveSystemLinks,
  withPriorityDefaults,
} from '../data/site'

const FEED_PAGE = 8

export function HomePage() {
  const { items: enlaces } = useEnlaces()
  const [feed, setFeed] = useState<FeedItem[]>(
    () => peekUnifiedFeed() ?? [],
  )
  const [featuredOrder, setFeaturedOrder] = useState(loadFeaturedOrder)
  const [visibleCount, setVisibleCount] = useState(FEED_PAGE)

  const systemLinks = useMemo(
    () => withPriorityDefaults(resolveSystemLinks(enlaces)),
    [enlaces],
  )
  const heroSystem = systemLinks.filter((l) => l.priority)

  useEffect(() => {
    let cancelled = false
    function load(force = false) {
      void loadUnifiedFeed(force ? { force: true } : undefined).then((items) => {
        if (!cancelled) setFeed(items)
      })
      void fetchFeaturedOrder().then((order) => {
        if (!cancelled) setFeaturedOrder(order)
      })
    }
    load()
    const onChange = () => load(true)
    window.addEventListener('ifts2-ig-visibility', onChange)
    window.addEventListener('ifts2-site-content-change', onChange)
    const unsubFeed = subscribeFeed(() => {
      const cached = peekUnifiedFeed()
      if (!cancelled && cached) setFeed(cached)
    })
    return () => {
      cancelled = true
      window.removeEventListener('ifts2-ig-visibility', onChange)
      window.removeEventListener('ifts2-site-content-change', onChange)
      unsubFeed()
    }
  }, [])

  useEffect(
    () =>
      subscribeFeatured(() => {
        setFeaturedOrder(loadFeaturedOrder())
        void loadUnifiedFeed({ force: true }).then(setFeed)
        void fetchFeaturedOrder().then(setFeaturedOrder)
      }),
    [],
  )

  const featured = useMemo(
    () => resolveFeaturedItems(feed, featuredOrder),
    [feed, featuredOrder],
  )

  const mixed = useMemo(() => interleaveIgInMiddle(feed), [feed])
  const shown = mixed.slice(0, visibleCount)
  const hasMore = visibleCount < mixed.length

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__intro">
            <p className="page-kicker">Sitio institucional</p>
            <h1 className="hero__brand">{institute.name}</h1>
            <p className="hero__tagline">{institute.tagline}</p>
            <p className="hero__claim">
              <span className="hero__break">Técnico superior en</span>
              <span className="hero__break">emprendimientos gastronómicos</span>
            </p>
          </div>

          <nav className="hero-cards" aria-label="Atajos">
            <Link to="/ingreso" className="hero-card hero-card--verde">
              <span className="hero-card__label">Ingreso</span>
              <span className="hero-card__desc">Preinscripción</span>
            </Link>
            <Link to="/carrera" className="hero-card hero-card--manteca">
              <span className="hero-card__label">Carrera</span>
              <span className="hero-card__desc">Perfil profesional</span>
            </Link>
            <Link to="/contacto" className="hero-card hero-card--tomate">
              <span className="hero-card__label">Ubicación</span>
              <span className="hero-card__desc">Villa Lugano</span>
            </Link>
            <Link to="/vida/galeria" className="hero-card hero-card--crema">
              <span className="hero-card__label">Galería</span>
              <span className="hero-card__desc">Fotos del instituto</span>
            </Link>
            {heroSystem.map((q) => (
              <a
                key={q.id}
                className={`hero-card hero-card--system hero-card--${q.id}`}
                href={q.href}
                target="_blank"
                rel="noreferrer"
              >
                <span className="hero-card__label">{q.label}</span>
                <span className="hero-card__desc">{q.desc}</span>
              </a>
            ))}
          </nav>

          <SocialIcons variant="panel" className="hero__social" />
        </div>
      </section>

      {featured.length > 0 && <FeaturedCarousel items={featured} />}

      <section className="section section--after-hero">
        <div className="container container--narrow">
          <div className="section__head">
            <div>
              <p className="page-kicker">Actividades</p>
              <h2 className="section__title">Novedades</h2>
            </div>
            <Link className="link-row" to="/vida/noticias">
              Ver todo →
            </Link>
          </div>

          {shown.length === 0 ? (
            <p className="muted">Todavía no hay novedades publicadas.</p>
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
      </section>
    </>
  )
}
