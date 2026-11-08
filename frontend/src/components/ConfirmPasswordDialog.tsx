import { useEffect, useId, useState, type FormEvent } from 'react'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  busy?: boolean
  error?: string
  onCancel: () => void
  onConfirm: (password: string) => void
}

/** Diálogo simple: ¿estás seguro? + contraseña para confirmar. */
export function ConfirmPasswordDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  busy = false,
  error = '',
  onCancel,
  onConfirm,
}: Props) {
  const titleId = useId()
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!open) setPassword('')
  }, [open])

  if (!open) return null

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    onConfirm(password)
  }

  return (
    <div className="confirm-pass" role="presentation" onClick={onCancel}>
      <form
        className="confirm-pass__card panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2 id={titleId} className="confirm-pass__title">
          {title}
        </h2>
        <p className="muted confirm-pass__msg">{message}</p>
        <div className="bedelia__field">
          <label htmlFor="confirm-pass-input">Tu contraseña</label>
          <input
            id="confirm-pass-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
        </div>
        {error ? (
          <p className="confirm-pass__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="confirm-pass__actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn--danger"
            disabled={busy || !password.trim()}
          >
            {busy ? 'Confirmando…' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
