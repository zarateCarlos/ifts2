import { useEffect, useState } from 'react'
import type { EventImage } from '../data/site'

type Props = {
  images: EventImage[]
  aspect?: string
  className?: string
  autoPlayMs?: number
  compact?: boolean
  fill?: boolean
}

/** Carrusel liviano: dots abajo, sin barra que tape la foto. */
export function ImageCarousel({
  images,
  aspect = '4 / 3',
  className = '',
  autoPlayMs = 4500,
  compact = false,
  fill = false,
}: Props) {
  const [index, setIndex] = useState(0)
  const total = images.length

  useEffect(() => {
    if (total <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % total)
    }, autoPlayMs)
    return () => window.clearInterval(id)
  }, [total, autoPlayMs])

  const rootClass = [
    'carousel',
    compact ? 'carousel--compact' : '',
    fill ? 'carousel--fill' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (total === 0) {
    return (
      <div className={rootClass} style={fill ? undefined : { aspectRatio: aspect }}>
        <div className="carousel__slide carousel__slide--empty">Sin imágenes</div>
      </div>
    )
  }

  const current = images[index]

  return (
    <div className={rootClass} aria-roledescription="carrusel">
      <div
        className="carousel__viewport"
        style={fill ? undefined : { aspectRatio: aspect }}
      >
        {images.map((img, i) => (
          <div
            key={img.id}
            className={`carousel__slide${i === index ? ' is-active' : ''}`}
            aria-hidden={i !== index}
          >
            <span className="carousel__label">Simulación · {img.label}</span>
          </div>
        ))}

        {total > 1 && (
          <>
            <button
              type="button"
              className="carousel__edge carousel__edge--prev"
              aria-label="Anterior"
              onClick={() => setIndex((i) => (i - 1 + total) % total)}
            >
              ‹
            </button>
            <button
              type="button"
              className="carousel__edge carousel__edge--next"
              aria-label="Siguiente"
              onClick={() => setIndex((i) => (i + 1) % total)}
            >
              ›
            </button>
            <div className="carousel__pager" role="tablist" aria-label="Fotos">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Foto ${i + 1}: ${img.label}`}
                  className={`carousel__dot${i === index ? ' is-active' : ''}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {!compact && (
        <p className="carousel__caption muted">
          {current.label} · {index + 1}/{total}
        </p>
      )}
    </div>
  )
}
