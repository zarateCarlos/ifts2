import { useMemo } from 'react'

export type ParsedInstagram = {
  permalink: string
  code: string
  kind: string
}

function cleanCode(raw: string) {
  const code = decodeURIComponent(raw).replace(/\/+$/, '').split('?')[0]
  if (/^[A-Za-z0-9_-]{7,15}$/.test(code)) return code
  const head = code.slice(0, 11)
  if (/^[A-Za-z0-9_-]{11}$/.test(head)) return head
  return null
}

/**
 * Acepta permalink O el HTML de Instagram → ⋯ → Incorporar.
 */
export function normalizeInstagramUrl(raw: string): ParsedInstagram | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const fromEmbed =
    trimmed.match(/data-instgrm-permalink=["']([^"']+)["']/i)?.[1] ||
    trimmed.match(
      /href=["'](https?:\/\/(?:www\.)?instagram\.com\/(?:[\w.-]+\/)?(?:p|reel|tv)\/[^"'?\s]+)/i,
    )?.[1]

  const candidate = fromEmbed || trimmed

  try {
    const href = candidate.startsWith('http')
      ? candidate
      : `https://www.instagram.com${candidate.startsWith('/') ? '' : '/'}${candidate}`
    const u = new URL(href)
    const host = u.hostname.replace(/^www\./i, '').toLowerCase()
    if (host !== 'instagram.com') return null

    const m = u.pathname.match(/\/(?:[\w.-]+\/)?(p|reel|tv)\/([^/?#]+)/i)
    if (!m) return null

    const kind = m[1].toLowerCase()
    const code = cleanCode(m[2])
    if (!code) return null

    const permalink = `https://www.instagram.com/${kind}/${code}/`
    return { permalink, code, kind }
  } catch {
    return null
  }
}

type Props = {
  url: string
  caption?: string
}

/**
 * Card de post (sin iframe).
 * Instagram suele responder “enlace dañado” en embeds de terceros; el CTA abre el post real.
 * En Admin se puede pegar el link o el HTML de “Incorporar”.
 */
export function InstagramEmbed({ url, caption }: Props) {
  const parsed = useMemo(() => normalizeInstagramUrl(url), [url])

  if (!parsed) {
    return (
      <div className="ig-embed ig-embed--fallback">
        <p className="muted">
          No reconocimos el link. Usá <strong>⋯ → Copiar enlace</strong> o{' '}
          <strong>⋯ → Incorporar</strong> en Instagram.
        </p>
      </div>
    )
  }

  return (
    <div className="ig-embed">
      <a
        className="ig-embed__card"
        href={parsed.permalink}
        target="_blank"
        rel="noreferrer"
      >
        <span className="ig-embed__card-brand">instagram</span>
        <span className="ig-embed__card-kind">{parsed.kind}</span>
        {caption ? <span className="ig-embed__card-cap">{caption}</span> : null}
        <span className="ig-embed__card-hint">Tocá para ver el post</span>
      </a>
      <div className="ig-embed__meta">
        <a
          className="btn btn--primary ig-embed__cta"
          href={parsed.permalink}
          target="_blank"
          rel="noreferrer"
        >
          Abrir en Instagram ↗
        </a>
      </div>
    </div>
  )
}
