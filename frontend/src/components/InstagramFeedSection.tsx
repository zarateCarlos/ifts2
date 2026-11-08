import { useEffect, useState } from 'react'
import { hasRemoteApi } from '../api/config'
import {
  igImageUrl,
  isIgPostVisible,
  loadIgVisibility,
  loadInstagramPosts,
  type IgPost,
} from '../data/instagramFeed'

type Props = {
  limit?: number
}

export function InstagramFeedSection({ limit = 5 }: Props) {
  const [posts, setPosts] = useState<IgPost[]>([])
  const [visibility, setVisibility] = useState(loadIgVisibility)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle')
  const [error, setError] = useState('')
  const [fromCache, setFromCache] = useState(false)

  useEffect(() => {
    function onStorage() {
      setVisibility(loadIgVisibility())
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('ifts2-ig-visibility', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('ifts2-ig-visibility', onStorage)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    loadInstagramPosts(limit)
      .then((cache) => {
        if (cancelled) return
        setPosts(cache.posts)
        setFromCache(cache.source !== 'api')
        setStatus(cache.posts.length ? 'ready' : 'error')
        if (!cache.posts.length) setError('No hay publicaciones en caché.')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'No se pudo cargar Instagram')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [limit])

  // Backend ya filtra visibles; localStorage solo aplica en demo sin API.
  const visible = posts.filter((p) =>
    hasRemoteApi() ? true : isIgPostVisible(p.id, visibility),
  )

  if (status === 'loading' || status === 'idle') {
    return (
      <section className="ig-feed" aria-busy="true">
        <div className="section__head">
          <div>
            <p className="page-kicker">Instagram</p>
            <h2 className="section__title">En redes</h2>
          </div>
        </div>
        <p className="muted">Cargando publicaciones…</p>
      </section>
    )
  }

  if (status === 'error') {
    return (
      <section className="ig-feed">
        <div className="section__head">
          <div>
            <p className="page-kicker">Instagram</p>
            <h2 className="section__title">En redes</h2>
          </div>
        </div>
        <p className="muted" role="alert">
          {error}
        </p>
      </section>
    )
  }

  if (visible.length === 0) {
    return (
      <section className="ig-feed">
        <div className="section__head">
          <div>
            <p className="page-kicker">Instagram</p>
            <h2 className="section__title">En redes</h2>
          </div>
        </div>
        <p className="muted">No hay publicaciones visibles por ahora.</p>
      </section>
    )
  }

  return (
    <section className="ig-feed">
      <div className="section__head">
        <div>
          <p className="page-kicker">Instagram</p>
          <h2 className="section__title">En redes</h2>
        </div>
        <a
          className="link-row"
          href="https://www.instagram.com/charlyraack/"
          target="_blank"
          rel="noreferrer"
        >
          Ver perfil →
        </a>
      </div>

      {fromCache && (
        <p className="muted" style={{ marginTop: 0, fontSize: '0.8rem' }}>
          Mostrando caché local (API no disponible o token vencido).
        </p>
      )}

      <div className="ig-feed__grid">
        {visible.map((post) => (
          <IgFeedCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}

function IgFeedCard({ post }: { post: IgPost }) {
  const src = igImageUrl(post)
  const caption = (post.caption || 'Sin descripción').trim()

  return (
    <article className="ig-feed__card">
      <a href={post.permalink} target="_blank" rel="noreferrer" className="ig-feed__media">
        {src ? (
          <img src={src} alt="" loading="lazy" />
        ) : (
          <span className="ig-feed__placeholder">Sin imagen</span>
        )}
      </a>
      <p className="ig-feed__caption">{caption}</p>
    </article>
  )
}
