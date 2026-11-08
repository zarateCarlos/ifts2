import { Link } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FeedItem } from '../data/feedStore'
import { SourceBadge, sourceKindFromFeedItem } from './SourceBadge'

type Props = {
  items: FeedItem[]
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

export function FeaturedCarousel({ items }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)
  const animatingRef = useRef(false)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = Math.max(0, el.scrollWidth - el.clientWidth)
    setCanPrev(el.scrollLeft > 2)
    setCanNext(el.scrollLeft < max - 2)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    updateArrows()
    const onScroll = () => {
      if (!animatingRef.current) updateArrows()
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateArrows)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [items, updateArrows])

  function stepPx(el: HTMLDivElement) {
    const card = el.querySelector('.featured-card') as HTMLElement | null
    if (!card) return Math.max(el.clientWidth * 0.7, 160)
    const styles = getComputedStyle(el)
    const gap =
      Number.parseFloat(styles.columnGap || styles.gap || '0') || 0
    return card.getBoundingClientRect().width + gap
  }

  function animateTo(el: HTMLDivElement, target: number, ms = 480) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const max = Math.max(0, el.scrollWidth - el.clientWidth)
    const end = Math.max(0, Math.min(max, target))
    const start = el.scrollLeft
    const delta = end - start
    if (Math.abs(delta) < 1) {
      animatingRef.current = false
      updateArrows()
      return
    }

    animatingRef.current = true
    const t0 = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms)
      el.scrollLeft = start + delta * easeOutCubic(t)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        el.scrollLeft = end
        animatingRef.current = false
        rafRef.current = 0
        updateArrows()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function scrollByDir(dir: -1 | 1) {
    const el = trackRef.current
    if (!el) return
    const step = stepPx(el)
    animateTo(el, el.scrollLeft + dir * step)
  }

  if (items.length === 0) return null

  return (
    <section className="featured-rail" aria-label="Destacados">
      <div className="container">
        <div className="section__head">
          <h2 className="section__title featured-rail__title">
            Próximos eventos
          </h2>
          <Link className="link-row" to="/vida/noticias">
            Ver agenda completa →
          </Link>
        </div>

        <div className="featured-rail__wrap">
          <button
            type="button"
            className="featured-rail__arrow featured-rail__arrow--prev"
            aria-label="Anterior"
            disabled={!canPrev}
            onClick={() => scrollByDir(-1)}
          >
            ‹
          </button>

          <div className="featured-rail__track" ref={trackRef}>
            {items.map((item) => (
              <FeaturedCard key={item.id} item={item} />
            ))}
          </div>

          <button
            type="button"
            className="featured-rail__arrow featured-rail__arrow--next"
            aria-label="Siguiente"
            disabled={!canNext}
            onClick={() => scrollByDir(1)}
          >
            ›
          </button>
        </div>
      </div>
    </section>
  )
}

function FeaturedCard({ item }: { item: FeedItem }) {
  const media = (
    <div className="featured-card__media">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="featured-card__ph">Sin imagen</span>
      )}
      {item.source === 'instagram' && (
        <span className="featured-card__ig" aria-hidden>
          <img src="/brand/social/instagram.svg" alt="" width={20} height={20} />
        </span>
      )}
    </div>
  )

  const copy = (
    <div className="featured-card__copy">
      <div className="featured-card__meta">
        <SourceBadge kind={sourceKindFromFeedItem(item)} />
        <time className="featured-card__date" dateTime={item.dateISO}>
          {item.dateLabel || item.dateISO}
        </time>
      </div>
      <h3 className="featured-card__name">{item.title}</h3>
      <p className="featured-card__body">{item.body}</p>
    </div>
  )

  if (item.external) {
    return (
      <a
        className="featured-card"
        href={item.href}
        target="_blank"
        rel="noreferrer"
      >
        {media}
        {copy}
      </a>
    )
  }

  return (
    <Link className="featured-card" to={item.href}>
      {media}
      {copy}
    </Link>
  )
}
