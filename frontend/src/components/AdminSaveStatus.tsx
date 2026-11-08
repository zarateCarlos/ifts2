type Status = 'idle' | 'saving' | 'saved' | 'error'

type Props = {
  status: Status
  message?: string
}

/** Indicador fijo de guardado: no empuja el layout. */
export function AdminSaveStatus({ status, message }: Props) {
  return (
    <div
      className={`admin-save-pill${status !== 'idle' ? ` is-${status}` : ''}`}
      role="status"
      aria-live="polite"
    >
      {status === 'saving' && (
        <>
          <span className="admin-save-pill__spin" aria-hidden />
          <span>Guardando</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <span className="admin-save-pill__dot" aria-hidden />
          <span>{message || 'Guardado'}</span>
        </>
      )}
      {status === 'error' && (
        <>
          <span
            className="admin-save-pill__dot admin-save-pill__dot--err"
            aria-hidden
          />
          <span>{message || 'Error'}</span>
        </>
      )}
    </div>
  )
}
