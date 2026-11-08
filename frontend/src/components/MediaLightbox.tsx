import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

export type LightboxSlide = {
  id: string
  src: string
  title?: string
  caption?: string
}

type Props = {
  slides: LightboxSlide[]
  index: number | null
  onClose: () => void
  onIndexChange: (index: number) => void
}

export function MediaLightbox({ slides, index, onClose, onIndexChange }: Props) {
  const titleId = useId()
  const open = index !== null && slides.length > 0 && index >= 0 && index < slides.length
  const current = open ? slides[index]! : null
  const total = slides.length
  const hasMany = total > 1

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (!hasMany) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        onIndexChange(((index ?? 0) + 1) % total)
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onIndexChange(((index ?? 0) - 1 + total) % total)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, index, total, hasMany, onClose, onIndexChange])

  if (!open || !current || typeof document === 'undefined') return null

  function go(dir: -1 | 1) {
    if (!hasMany || index === null) return
    onIndexChange((index + dir + total) % total)
  }

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        className="lightbox__backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <button
        type="button"
        className="lightbox__close"
        aria-label="Cerrar"
        onClick={onClose}
      >
        ×
      </button>

      {hasMany && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--prev"
          aria-label="Anterior"
          onClick={() => go(-1)}
        >
          ‹
        </button>
      )}

      {hasMany && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--next"
          aria-label="Siguiente"
          onClick={() => go(1)}
        >
          ›
        </button>
      )}

      <div className="lightbox__frame">
        <img
          className="lightbox__img"
          src={current.src}
          alt={current.title || ''}
        />
        <div className="lightbox__caption" id={titleId}>
          <span className="lightbox__count">
            {index + 1} / {total}
          </span>
          {current.title && (
            <strong className="lightbox__title">{current.title}</strong>
          )}
          {current.caption && (
            <span className="lightbox__text">{current.caption}</span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
