/**
 * Fondo fijo: blur con filter CSS en la foto (fiable en producción).
 * El header usa fondo mate opaco + backdrop-filter solo como plus.
 */
export function SiteSketchBackdrop() {
  return (
    <div className="site-sketch" aria-hidden>
      <img
        className="site-sketch__photo"
        src="/hero/cocina-boceto.jpg"
        alt=""
        width={1600}
        height={1000}
        decoding="async"
        fetchPriority="high"
      />
      <div className="site-sketch__wash" />
    </div>
  )
}
