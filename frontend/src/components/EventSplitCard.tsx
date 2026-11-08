import { Link } from 'react-router-dom'
import { useState } from 'react'
import { institute, type NewsItem } from '../data/site'
import { ImageCarousel } from './ImageCarousel'

const TEASER_CHARS = 160

type Props = {
  item: NewsItem
  to?: string
  compact?: boolean
}

export function EventSplitCard({ item, to, compact = true }: Props) {
  const needsMore = Boolean(to) && item.body.length > TEASER_CHARS
  const [shareNote, setShareNote] = useState('')

  async function onShare() {
    const path = to ?? `/vida/noticias/${item.id}`
    const url = `${window.location.origin}${path}`
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, text: item.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareNote('Enlace copiado')
      window.setTimeout(() => setShareNote(''), 2000)
    } catch {
      setShareNote('')
    }
  }

  return (
    <article
      className={`event-split news-card${compact ? ' event-split--compact' : ''}`}
    >
      <div className="event-split__media">
        <ImageCarousel
          images={item.images}
          compact={compact}
          fill
          aspect="16 / 9"
        />
      </div>

      <div className="event-split__copy">
        <div className="event-split__meta-row">
          <img
            className="event-split__mark"
            src="/brand/logo.svg"
            alt=""
            width={36}
            height={36}
          />
          <div className="event-split__meta-text">
            <span className="event-split__brand">{institute.name}</span>
            <time className="news-card__date" dateTime={item.dateISO}>
              {item.dateLabel}
            </time>
          </div>
        </div>

        {to ? (
          <Link to={to} className="event-split__title-link">
            <h3 className="news-card__title">{item.title}</h3>
          </Link>
        ) : (
          <h3 className="news-card__title">{item.title}</h3>
        )}

        <p className="news-card__body">{item.body}</p>

        <div className="event-split__actions">
          {needsMore && to ? (
            <Link to={to} className="link-row event-split__more">
              Ver más →
            </Link>
          ) : to ? (
            <Link to={to} className="link-row event-split__more">
              Ver detalle →
            </Link>
          ) : null}
          <button
            type="button"
            className="event-split__share"
            onClick={onShare}
            aria-label={`Compartir ${item.title}`}
          >
            Compartir
          </button>
          {shareNote && (
            <span className="event-split__share-note" role="status">
              {shareNote}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
