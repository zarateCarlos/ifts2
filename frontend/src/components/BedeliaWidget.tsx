import { useEffect, useId, useState, type FormEvent } from 'react'
import { useInstituteContact } from '../data/instituteStore'

const MOBILE_MQ = '(max-width: 699px)'

export function BedeliaWidget() {
  const { contact } = useInstituteContact()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const titleId = useId()

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)

    const update = () => {
      if (!mq.matches) {
        setCollapsed(false)
        return
      }
      setCollapsed(window.scrollY >= window.innerHeight * 0.5)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    mq.addEventListener('change', update)

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      mq.removeEventListener('change', update)
    }
  }, [])

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const nombre = String(fd.get('nombre') ?? '').trim()
    const email = String(fd.get('email') ?? '').trim()
    const consulta = String(fd.get('consulta') ?? '').trim()
    const to = contact.email.trim()
    if (!to) return

    const subject = encodeURIComponent(`Consulta bedelía — ${nombre}`)
    const body = encodeURIComponent(
      `Nombre: ${nombre}\nEmail: ${email}\n\nConsulta:\n${consulta}\n`,
    )
    // Sin endpoint de mail en el backend: abre el cliente de correo del usuario.
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <div className="bedelia">
      <div
        className="bedelia__panel"
        hidden={!open}
        role="dialog"
        aria-labelledby={titleId}
        aria-modal="false"
      >
        <h2 id={titleId} className="bedelia__title">
          Consultar a bedelía
        </h2>
        <p className="bedelia__hint">
          Se abre tu correo para enviar a <strong>{contact.email}</strong>. No
          hay envío automático desde el servidor todavía.
        </p>

        {sent ? (
          <div className="notice" role="status">
            Si no se abrió el correo, escribí a{' '}
            <a href={`mailto:${contact.email}`}>{contact.email}</a>.
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="bedelia__field">
              <label htmlFor="bedelia-nombre">Nombre</label>
              <input
                id="bedelia-nombre"
                name="nombre"
                required
                autoComplete="name"
              />
            </div>
            <div className="bedelia__field">
              <label htmlFor="bedelia-email">Email</label>
              <input
                id="bedelia-email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </div>
            <div className="bedelia__field">
              <label htmlFor="bedelia-duda">Consulta</label>
              <textarea id="bedelia-duda" name="consulta" required />
            </div>
            <div className="bedelia__actions">
              <button type="submit" className="btn btn--primary">
                Abrir correo
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </form>
        )}

        {sent && (
          <div className="bedelia__actions" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setSent(false)
                setOpen(false)
              }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        className={`bedelia__trigger${collapsed ? ' bedelia__trigger--collapsed' : ''}`}
        aria-expanded={open}
        aria-label="Consultar a bedelía"
        onClick={() => {
          setOpen((v) => !v)
          setSent(false)
        }}
      >
        <span className="bedelia__bubble" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a8 8 0 0 1-11.3 7.3L4 20l1-4.2A8 8 0 1 1 21 12Z" />
          </svg>
        </span>
        {!collapsed && (
          <span className="bedelia__trigger-label">Consultar a bedelía</span>
        )}
      </button>
    </div>
  )
}
