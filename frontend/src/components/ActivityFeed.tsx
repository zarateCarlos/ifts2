import { Link } from 'react-router-dom'
import type { FeedItem } from '../data/feedStore'
import { SourceBadge, sourceKindFromFeedItem } from './SourceBadge'

type Props = {
  items: FeedItem[]
}

/** Mezcla posts IG en el medio del listado web para simular feed unificado. */
export function interleaveIgInMiddle(items: FeedItem[]): FeedItem[] {
  const web = items.filter((i) => i.source === 'web')
  const ig = items.filter((i) => i.source === 'instagram')
  if (ig.length === 0) return web
  if (web.length === 0) return ig
  const mid = Math.max(1, Math.floor(web.length / 2))
  return [...web.slice(0, mid), ...ig, ...web.slice(mid)]
}

/** Fecha compacta mobile/desktop cards: "16 06/2025" */
export function formatCompactDate(iso: string) {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${Number(d)} ${m}/${y}`
}

export function ActivityFeed({ items }: Props) {
  if (items.length === 0) {
    return <p className="muted muted--center">No hay actividades por ahora.</p>
  }

  return (
    <div className="activity-feed">
      {items.map((item) => (
        <ActivityCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function hasImage(url?: string) {
  return Boolean(url && url.trim())
}

function shouldShowMore(item: FeedItem) {
  const href = (item.href || '').trim()
  if (!href) return false
  if (/^\/comunidad\/?(docentes|alumnos|tutoria)?\/?$/i.test(href)) return false
  if (
    item.moreLabel &&
    /ver (sección|comunidad|tutoría|alumnos|docentes)/i.test(item.moreLabel)
  ) {
    return false
  }
  return true
}

function ActivityCard({ item }: { item: FeedItem }) {
  const isIg = item.source === 'instagram'
  const showMedia = hasImage(item.imageUrl)
  const showMore = shouldShowMore(item)
  const moreLabel =
    item.moreLabel || (isIg ? 'Ver en Instagram →' : 'Ver más →')
  const noMediaClass = showMedia ? '' : ' activity-card--text-only'
  const dateText = item.dateISO
    ? formatCompactDate(item.dateISO)
    : item.dateLabel || ''
  const kind = sourceKindFromFeedItem(item)

  return (
    <article
      className={`activity-card${isIg ? ' activity-card--ig' : ''}${noMediaClass}`}
    >
      {item.external ? (
        <a
          className="activity-card__stretch"
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={item.title}
        />
      ) : showMore ? (
        <Link
          className="activity-card__stretch"
          to={item.href}
          aria-label={item.title}
        />
      ) : null}

      {showMedia && (
        <div className="activity-card__media">
          <img src={item.imageUrl} alt="" loading="lazy" />
        </div>
      )}

      <div className="activity-card__copy">
        <div className="activity-card__meta">
          <SourceBadge kind={kind} />
          <time className="activity-card__date" dateTime={item.dateISO}>
            {dateText}
          </time>
        </div>
        <h3 className="activity-card__title">{item.title}</h3>
        {item.body?.trim() ? (
          <p className="activity-card__body">{item.body}</p>
        ) : null}

        {showMore &&
          (item.external ? (
            <a
              className="link-row activity-card__more"
              href={item.href}
              target="_blank"
              rel="noreferrer"
            >
              {moreLabel}
            </a>
          ) : (
            <Link className="link-row activity-card__more" to={item.href}>
              {moreLabel}
            </Link>
          ))}
      </div>
    </article>
  )
}
