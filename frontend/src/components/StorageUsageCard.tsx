import { useCallback, useEffect, useState } from 'react'
import {
  fetchStorageUsage,
  formatBytes,
  notifyStorageChanged,
  STORAGE_EVENT,
  usagePercent,
  type StorageUsage,
} from '../api/storageApi'

type Props = {
  counts?: {
    noticiaImages?: number
    eventoPortadas?: number
    galeriaFotos?: number
  }
  compact?: boolean
}

export function StorageUsageCard({ counts, compact }: Props) {
  const [usage, setUsage] = useState<StorageUsage | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setBusy(true)
    try {
      setUsage(await fetchStorageUsage(counts))
    } catch {
      setUsage(null)
    } finally {
      setBusy(false)
    }
  }, [counts?.noticiaImages, counts?.eventoPortadas, counts?.galeriaFotos])

  useEffect(() => {
    void load()
    const onChange = () => void load()
    window.addEventListener(STORAGE_EVENT, onChange)
    return () => window.removeEventListener(STORAGE_EVENT, onChange)
  }, [load])

  if (!usage) {
    return (
      <div className={`storage-card${compact ? ' storage-card--compact' : ''}`}>
        <p className="storage-card__title">Storage</p>
        <p className="storage-card__hint">{busy ? 'Midiendo…' : 'Sin datos'}</p>
      </div>
    )
  }

  const pct = usagePercent(usage)
  const tone =
    pct >= 90 ? 'is-critical' : pct >= 70 ? 'is-warn' : 'is-ok'
  const free = Math.max(0, usage.limitBytes - usage.usedBytes)
  const sourceHint =
    usage.source === 'supabase'
      ? 'Supabase'
      : usage.source === 'backend'
        ? 'API'
        : 'estimado'

  return (
    <div className={`storage-card${compact ? ' storage-card--compact' : ''}`}>
      <div className="storage-card__head">
        <p className="storage-card__title">Espacio Storage</p>
        <button
          type="button"
          className="storage-card__refresh"
          disabled={busy}
          onClick={() => {
            notifyStorageChanged()
            void load()
          }}
          title="Actualizar"
        >
          {busy ? '…' : '↻'}
        </button>
      </div>

      <div
        className={`storage-meter ${tone}`}
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="storage-meter__fill" style={{ width: `${pct}%` }} />
      </div>

      <p className="storage-card__stats">
        <strong>{formatBytes(usage.usedBytes)}</strong>
        {' / '}
        {formatBytes(usage.limitBytes)}
        <span className="storage-card__pct"> ({pct}%)</span>
      </p>
      <p className="storage-card__hint">
        Libre {formatBytes(free)} · {sourceHint}
      </p>

      {!compact && usage.breakdown.length > 0 && (
        <ul className="storage-card__breakdown">
          {usage.breakdown.map((b) => (
            <li key={b.key}>
              <span>{b.label}</span>
              <span>
                {b.files} · {formatBytes(b.bytes)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
