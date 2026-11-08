import { useEffect, useState } from 'react'
import {
  dismissAdminToast,
  subscribeAdminToasts,
  type AdminToast,
} from '../data/adminToast'

export function AdminToastHost() {
  const [items, setItems] = useState<AdminToast[]>([])

  useEffect(() => subscribeAdminToasts(setItems), [])

  if (!items.length) return null

  return (
    <div className="admin-toast-host" aria-live="polite" aria-relevant="additions">
      {items.map((t) => (
        <div
          key={t.id}
          className={`admin-toast admin-toast--${t.kind}`}
          role={t.kind === 'error' ? 'alert' : 'status'}
        >
          <span className="admin-toast__icon" aria-hidden>
            {t.kind === 'loading'
              ? '…'
              : t.kind === 'success'
                ? '✓'
                : t.kind === 'error'
                  ? '!'
                  : 'i'}
          </span>
          <div className="admin-toast__body">
            <p className="admin-toast__title">{t.title}</p>
            {t.message ? (
              <p className="admin-toast__msg">{t.message}</p>
            ) : null}
          </div>
          {t.kind !== 'loading' && (
            <button
              type="button"
              className="admin-toast__close"
              aria-label="Cerrar"
              onClick={() => dismissAdminToast(t.id)}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
