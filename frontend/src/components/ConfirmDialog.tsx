import { useId } from 'react'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Diálogo ¿estás seguro? (sin contraseña). Reusa el estilo de confirm-pass. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true,
  busy = false,
  onCancel,
  onConfirm,
}: Props) {
  const titleId = useId()

  if (!open) return null

  return (
    <div className="confirm-pass" role="presentation" onClick={onCancel}>
      <div
        className="confirm-pass__card panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="confirm-pass__title">
          {title}
        </h2>
        <p className="muted confirm-pass__msg">{message}</p>
        <div className="confirm-pass__actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? 'btn btn--danger' : 'btn btn--primary'}
            disabled={busy}
            autoFocus
            onClick={onConfirm}
          >
            {busy ? 'Confirmando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
