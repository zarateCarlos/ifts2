import type { SocialLink, SocialNetwork } from '../data/site'
import { useSocialLinks } from '../data/socialStore'

const ICONS: Partial<
  Record<SocialNetwork, { src: string; alt: string; handle: string }>
> = {
  instagram: {
    src: 'brand/social/instagram.svg',
    alt: 'Instagram',
    handle: '@ifts_2_ok',
  },
  facebook: {
    src: 'brand/social/facebook.svg',
    alt: 'Facebook',
    handle: 'IFTS N°2',
  },
}

type Props = {
  variant?: 'row' | 'panel'
  className?: string
  links?: SocialLink[]
}

export function SocialIcons({ variant = 'row', className = '', links }: Props) {
  const { links: fromStore } = useSocialLinks()
  const items = (links ?? fromStore).filter(
    (l) => l.network === 'instagram' || l.network === 'facebook',
  )
  if (items.length === 0) return null

  const asset = (file: string) => {
    const base = import.meta.env.BASE_URL || '/'
    return `${base}${base.endsWith('/') ? '' : '/'}${file}`.replace(
      /([^:]\/)\/+/g,
      '$1',
    )
  }

  return (
    <nav
      className={`social-icons social-icons--${variant}${className ? ` ${className}` : ''}`}
      aria-label="Redes del IFTS"
    >
      {items.map((link) => {
        const icon = ICONS[link.network]
        if (!icon) return null
        return (
          <a
            key={link.id}
            className={`social-icons__link social-icons__link--${link.network}`}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            title={link.label}
          >
            <span className="social-icons__glyph" aria-hidden>
              <img
                className="social-icons__img"
                src={asset(icon.src.replace(/^\//, ''))}
                alt=""
                width={variant === 'panel' ? 22 : 44}
                height={variant === 'panel' ? 22 : 44}
                decoding="async"
              />
            </span>
            <span className="social-icons__text">
              <span className="social-icons__label">{link.label}</span>
              {variant === 'panel' && (
                <span className="social-icons__handle">{icon.handle}</span>
              )}
            </span>
            {variant === 'panel' && (
              <span className="social-icons__go" aria-hidden>
                →
              </span>
            )}
          </a>
        )
      })}
    </nav>
  )
}
