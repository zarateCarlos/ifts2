import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { Link, Navigate } from 'react-router-dom'
import { isAuthed } from './admin/adminAuth'
import {
  adminAddEventoFoto,
  adminCreateEvento,
  adminDeleteEventoFoto,
  adminDeleteEventoPortada,
  adminListEventoFotos,
  adminListEventos,
  adminSetEventoEstado,
  adminUpdateEvento,
  adminUploadEventoPortada,
} from '../api/adminCms'
import { ApiError, notifyStorageChanged, updateFeaturedOrder } from '../api'
import { bumpPublicFeed } from '../data/feedStore'
import { CONTENT_EVENT } from '../data/contentTypes'
import {
  pushAdminToast,
  replaceAdminToast,
} from '../data/adminToast'
import type {
  EventoAdminResponse,
  EventoFotoAdminResponse,
  EventoRequest,
} from '../api/types'
import { FileDropField } from '../components/FileDropField'
import { SourceBadge } from '../components/SourceBadge'
import { AdminSaveStatus } from '../components/AdminSaveStatus'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  isFeatured,
  loadFeaturedOrder,
  MAX_FEATURED,
  subscribeFeatured,
} from '../data/feedStore'
import { fetchFeaturedOrder } from '../api/featuredApi'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toLocalInputFromDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function localNowInput() {
  return toLocalInputFromDate(new Date())
}

/** Fin por defecto: 7 días después del inicio, a las 00:00 (el backend no acepta inicio = fin). */
function defaultFechaFin(fromInicio?: string) {
  const base = fromInicio ? new Date(fromInicio) : new Date()
  const start = Number.isNaN(base.getTime()) ? new Date() : base
  const fin = new Date(start)
  fin.setDate(fin.getDate() + 7)
  fin.setHours(0, 0, 0, 0)
  return toLocalInputFromDate(fin)
}

function emptyDraft(): EventoRequest & { id?: string; published: boolean } {
  const fechaInicio = localNowInput()
  return {
    titulo: '',
    resumen: '',
    descripcion: '',
    fechaInicio,
    fechaFin: defaultFechaFin(fechaInicio),
    lugar: '',
    published: true,
  }
}

function toLocalInput(iso?: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return iso.slice(0, 16)
  }
}

function toApiDate(local: string) {
  if (!local) return new Date().toISOString()
  return new Date(local).toISOString()
}

function notifyPublicRefresh() {
  window.dispatchEvent(new Event(CONTENT_EVENT))
  return bumpPublicFeed()
}

function PendingThumbs({
  files,
  firstIsCover,
  onRemove,
}: {
  files: File[]
  firstIsCover: boolean
  onRemove: (index: number) => void
}) {
  const [urls, setUrls] = useState<string[]>([])

  useEffect(() => {
    const next = files.map((f) => URL.createObjectURL(f))
    setUrls(next)
    return () => next.forEach((u) => URL.revokeObjectURL(u))
  }, [files])

  if (!files.length) return null

  return (
    <div className="admin-pending-thumbs">
      {files.map((f, i) => (
        <figure key={`${f.name}-${f.size}-${i}`} className="admin-pending-thumb">
          {urls[i] && <img src={urls[i]} alt="" />}
          <button
            type="button"
            className="admin-pending-thumb__x"
            aria-label="Quitar"
            onClick={() => onRemove(i)}
          >
            ×
          </button>
          <figcaption>
            {firstIsCover && i === 0 ? 'Portada' : 'Álbum'}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

export function AdminEventosPage({ embedded = false }: { embedded?: boolean }) {
  if (!isAuthed()) return <Navigate to="/admin/login" replace />

  const [rows, setRows] = useState<EventoAdminResponse[]>([])
  const [draft, setDraft] = useState<
    (EventoRequest & { id?: string; published: boolean; portadaUrl?: string }) | null
  >(null)
  const [fotos, setFotos] = useState<EventoFotoAdminResponse[]>([])
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [saveMsg, setSaveMsg] = useState('')
  const [saving, setSaving] = useState(false)
  /** Cola de imágenes: la 1ª va a portada si falta; el resto al álbum. */
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [featuredOrder, setFeaturedOrder] = useState(loadFeaturedOrder)
  const [starBusy, setStarBusy] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<
    | null
    | { kind: 'foto'; fotoId: string }
    | { kind: 'portada'; eventoId: string }
  >(null)

  const load = useCallback(async () => {
    setRows(await adminListEventos())
  }, [])

  useEffect(() => {
    void load().catch((err) => {
      setSaveStatus('error')
      setSaveMsg(
        err instanceof ApiError ? err.message : 'No se pudieron cargar eventos',
      )
    })
  }, [load])

  useEffect(() => {
    void fetchFeaturedOrder().then(setFeaturedOrder)
    return subscribeFeatured(() => setFeaturedOrder(loadFeaturedOrder()))
  }, [])

  useEffect(() => {
    if (saveStatus !== 'saved' && saveStatus !== 'error') return
    const t = window.setTimeout(() => setSaveStatus('idle'), 1800)
    return () => window.clearTimeout(t)
  }, [saveStatus])

  function flash(status: 'saved' | 'error', msg: string) {
    setSaveStatus(status)
    setSaveMsg(msg)
  }

  function clearPending() {
    setPendingFiles([])
  }

  function addPending(files: File[]) {
    setPendingFiles((prev) => [...prev, ...files])
  }

  function removePending(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function openEdit(ev: EventoAdminResponse) {
    setDraft({
      id: ev.id,
      titulo: ev.titulo,
      resumen: ev.resumen,
      descripcion: ev.descripcion || '',
      fechaInicio: toLocalInput(ev.fechaInicio),
      fechaFin: toLocalInput(ev.fechaFin),
      lugar: ev.lugar || '',
      published: ev.estado === 'PUBLICADA',
      portadaUrl: ev.portadaUrl,
    })
    clearPending()
    try {
      setFotos(await adminListEventoFotos(ev.id))
    } catch {
      setFotos([])
    }
  }

  function startNew() {
    setDraft(emptyDraft())
    setFotos([])
    clearPending()
    setSaveStatus('idle')
  }

  async function uploadPendingImages(eventoId: string, hasPortada: boolean) {
    if (!pendingFiles.length) return { uploaded: 0, errors: 0, lastError: '' }
    let uploaded = 0
    let errors = 0
    let lastError = ''
    let needPortada = !hasPortada
    let albumOrden = fotos.length

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i]
      try {
        if (needPortada) {
          await adminUploadEventoPortada(eventoId, file)
          needPortada = false
          uploaded += 1
        } else {
          await adminAddEventoFoto(
            eventoId,
            {
              etiqueta:
                file.name.replace(/\.[^.]+$/, '') || `Foto ${albumOrden + 1}`,
              orden: albumOrden,
            },
            file,
          )
          albumOrden += 1
          uploaded += 1
        }
      } catch (err) {
        errors += 1
        lastError =
          err instanceof ApiError
            ? err.message
            : 'Error al subir imagen (¿espacio en Storage?)'
      }
    }
    if (uploaded) notifyStorageChanged()
    return { uploaded, errors, lastError }
  }

  function closeForm() {
    setDraft(null)
    setFotos([])
    clearPending()
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!draft?.titulo.trim()) {
      pushAdminToast({
        kind: 'error',
        title: 'Falta el título',
        message: 'Completá el título del evento.',
      })
      flash('error', 'Título obligatorio')
      return
    }
    const wasNew = !draft.id
    const inicioMs = new Date(draft.fechaInicio).getTime()
    let finLocal = draft.fechaFin
    let finMs = new Date(finLocal).getTime()
    if (
      Number.isNaN(inicioMs) ||
      Number.isNaN(finMs) ||
      finMs <= inicioMs
    ) {
      finLocal = defaultFechaFin(draft.fechaInicio)
      finMs = new Date(finLocal).getTime()
    }
    if (finMs <= inicioMs) {
      pushAdminToast({
        kind: 'error',
        title: 'Fechas inválidas',
        message:
          'La fecha de fin debe ser posterior al inicio (horario del evento, no lo borra).',
      })
      flash('error', 'Fin debe ser después del inicio')
      return
    }
    const toastId = pushAdminToast({
      kind: 'loading',
      title: wasNew ? 'Publicando evento…' : 'Guardando evento…',
    })
    setSaving(true)
    setSaveStatus('saving')
    setSaveMsg('')
    try {
      const body: EventoRequest = {
        titulo: draft.titulo.trim(),
        resumen: draft.resumen.trim() || draft.titulo.trim(),
        descripcion:
          draft.descripcion.trim() ||
          draft.resumen.trim() ||
          draft.titulo.trim(),
        fechaInicio: toApiDate(draft.fechaInicio),
        fechaFin: toApiDate(finLocal),
        lugar: draft.lugar.trim() || 'IFTS N°2 DE 20',
      }
      let id = draft.id
      if (id) {
        await adminUpdateEvento(id, body)
      } else {
        const created = await adminCreateEvento(body)
        id = created?.id
        if (!id) throw new ApiError('El servidor no devolvió el id del evento', 0)
      }
      await adminSetEventoEstado(
        id,
        draft.published ? 'PUBLICADA' : 'BORRADOR',
      )

      const { uploaded, errors, lastError } = await uploadPendingImages(
        id,
        Boolean(draft.portadaUrl),
      )
      clearPending()

      await load()
      await notifyPublicRefresh()
      closeForm()

      if (errors && !uploaded) {
        replaceAdminToast(toastId, {
          kind: 'error',
          title: 'Evento guardado sin imágenes',
          message: lastError || 'Revisá el espacio de Storage.',
        })
        flash('error', 'Evento guardado, pero no se pudieron subir las imágenes')
      } else if (errors) {
        replaceAdminToast(toastId, {
          kind: 'success',
          title: draft.published ? 'Evento publicado' : 'Evento guardado',
          message: `${uploaded} imagen(es) ok · ${errors} fallaron. ${lastError}`.trim(),
        })
        flash(
          'saved',
          `Guardado · ${uploaded} imagen(es); ${errors} fallaron`,
        )
      } else {
        replaceAdminToast(toastId, {
          kind: 'success',
          title: draft.published
            ? wasNew
              ? 'Evento publicado'
              : 'Cambios publicados'
            : 'Borrador guardado',
          message: uploaded
            ? `${uploaded} imagen(es) subidas. Ya está en el sitio.`
            : draft.published
              ? 'Ya debería verse en el inicio / galería.'
              : 'Quedó como borrador (no público).',
        })
        flash(
          'saved',
          uploaded ? `Guardado · ${uploaded} imagen(es)` : 'Guardado',
        )
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'No se pudo guardar el evento'
      replaceAdminToast(toastId, {
        kind: 'error',
        title: 'No se pudo publicar',
        message: msg,
      })
      flash('error', msg)
    } finally {
      setSaving(false)
    }
  }

  async function onUploadMoreNow() {
    if (!draft?.id || !pendingFiles.length) {
      pushAdminToast({
        kind: 'error',
        title: draft?.id ? 'Elegí imágenes' : 'Guardá el evento primero',
      })
      flash('error', draft?.id ? 'Elegí imágenes' : 'Guardá el evento primero')
      return
    }
    const toastId = pushAdminToast({
      kind: 'loading',
      title: 'Subiendo imágenes…',
    })
    setSaving(true)
    setSaveStatus('saving')
    try {
      const { uploaded, errors, lastError } = await uploadPendingImages(
        draft.id,
        Boolean(draft.portadaUrl),
      )
      clearPending()
      setFotos(await adminListEventoFotos(draft.id))
      await load()
      await notifyPublicRefresh()
      const refreshed = (await adminListEventos()).find((x) => x.id === draft.id)
      if (refreshed) {
        setDraft({
          ...draft,
          portadaUrl: refreshed.portadaUrl,
        })
      }
      if (errors && !uploaded) {
        replaceAdminToast(toastId, {
          kind: 'error',
          title: 'No se pudieron subir',
          message: lastError || '¿Sin espacio en Storage?',
        })
        flash('error', 'No se pudieron subir (¿sin espacio en Storage?)')
      } else if (errors) {
        replaceAdminToast(toastId, {
          kind: 'success',
          title: `${uploaded} subidas`,
          message: `${errors} fallaron. ${lastError}`.trim(),
        })
        flash('saved', `${uploaded} ok · ${errors} fallaron`)
      } else {
        replaceAdminToast(toastId, {
          kind: 'success',
          title: `${uploaded} imagen(es) subidas`,
        })
        flash('saved', `${uploaded} imagen(es) subidas`)
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'No se pudo subir'
      replaceAdminToast(toastId, {
        kind: 'error',
        title: 'No se pudo subir',
        message: msg,
      })
      flash('error', msg)
    } finally {
      setSaving(false)
    }
  }

  function requestDeleteFoto(fotoId: string) {
    if (!draft?.id) return
    setPendingDelete({ kind: 'foto', fotoId })
  }

  function requestPurgePortada(eventoId: string) {
    setPendingDelete({ kind: 'portada', eventoId })
  }

  async function runPendingDelete() {
    if (!pendingDelete) return
    const action = pendingDelete
    setPendingDelete(null)
    if (action.kind === 'foto') {
      if (!draft?.id) return
      const toastId = pushAdminToast({
        kind: 'loading',
        title: 'Borrando foto…',
      })
      setSaving(true)
      setSaveStatus('saving')
      try {
        await adminDeleteEventoFoto(draft.id, action.fotoId)
        setFotos(await adminListEventoFotos(draft.id))
        await load()
        notifyStorageChanged()
        await notifyPublicRefresh()
        replaceAdminToast(toastId, {
          kind: 'success',
          title: 'Foto borrada',
        })
        flash('saved', 'Foto borrada')
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message : 'No se pudo borrar'
        replaceAdminToast(toastId, {
          kind: 'error',
          title: 'No se pudo borrar',
          message: msg,
        })
        flash('error', msg)
      } finally {
        setSaving(false)
      }
      return
    }
    const eventoId = action.eventoId
    const toastId = pushAdminToast({
      kind: 'loading',
      title: 'Borrando portada…',
    })
    setSaving(true)
    setSaveStatus('saving')
    try {
      await adminDeleteEventoPortada(eventoId)
      if (draft?.id === eventoId) setDraft({ ...draft, portadaUrl: '' })
      await load()
      notifyStorageChanged()
      await notifyPublicRefresh()
      replaceAdminToast(toastId, {
        kind: 'success',
        title: 'Portada borrada',
      })
      flash('saved', 'Portada borrada')
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'No se pudo vaciar'
      replaceAdminToast(toastId, {
        kind: 'error',
        title: 'No se pudo borrar',
        message: msg,
      })
      flash('error', msg)
    } finally {
      setSaving(false)
    }
  }

  async function onToggleStar(ev: EventoAdminResponse) {
    const feedId = `evento:${ev.id}`
    const next = featuredOrder.includes(feedId)
      ? featuredOrder.filter((x) => x !== feedId)
      : featuredOrder.length >= MAX_FEATURED
        ? featuredOrder
        : [...featuredOrder, feedId]
    if (!featuredOrder.includes(feedId) && featuredOrder.length >= MAX_FEATURED) {
      pushAdminToast({
        kind: 'error',
        title: 'Límite de ★',
        message: `Máx. ${MAX_FEATURED}`,
      })
      flash('error', `Máx. ${MAX_FEATURED}`)
      return
    }
    setStarBusy(true)
    const toastId = pushAdminToast({
      kind: 'loading',
      title: 'Actualizando ★…',
    })
    try {
      const remote = await updateFeaturedOrder(next)
      setFeaturedOrder(remote)
      const on = remote.includes(feedId)
      replaceAdminToast(toastId, {
        kind: 'success',
        title: on ? 'En el carrusel' : 'Fuera del carrusel',
      })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error ★'
      replaceAdminToast(toastId, {
        kind: 'error',
        title: 'Error ★',
        message: msg,
      })
      flash('error', msg)
    } finally {
      setStarBusy(false)
    }
  }

  return (
    <div className={`stack${embedded ? ' admin-stack-tight' : ''}`}>
      {!embedded && (
        <div className="admin-page-head">
          <div>
            <p className="page-kicker">Admin</p>
            <h1 className="page-title">Eventos</h1>
            <p className="muted" style={{ marginBottom: 0 }}>
              ★ = carrusel. Inicio/Fin = horario del evento (no se borra solo).
            </p>
          </div>
          <AdminSaveStatus status={saveStatus} message={saveMsg} />
        </div>
      )}

      <div className="row-actions admin-eventos-toolbar">
        <button type="button" className="btn btn--primary" onClick={startNew}>
          Nuevo evento
        </button>
        {embedded && (
          <AdminSaveStatus status={saveStatus} message={saveMsg} />
        )}
        {!embedded && (
          <Link className="btn btn--ghost" to="/admin/contenido">
            Volver a Contenido
          </Link>
        )}
      </div>

      {draft && (
        <form
          className="panel admin-form-compact"
          onSubmit={onSave}
          noValidate
        >
          <div className="admin-form-compact__head">
            <h2>{draft.id ? 'Editar evento' : 'Nuevo evento'}</h2>
            <label className="check-row">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) =>
                  setDraft({ ...draft, published: e.target.checked })
                }
              />
              Publicado
            </label>
          </div>

          <div className="admin-form-compact__grid">
            <div className="bedelia__field admin-form-compact__full">
              <label htmlFor="e-title">Título</label>
              <input
                id="e-title"
                value={draft.titulo}
                onChange={(e) =>
                  setDraft({ ...draft, titulo: e.target.value })
                }
                required
              />
            </div>
            <div className="bedelia__field">
              <label htmlFor="e-lugar">Lugar</label>
              <input
                id="e-lugar"
                value={draft.lugar}
                onChange={(e) => setDraft({ ...draft, lugar: e.target.value })}
                placeholder="IFTS N°2 DE 20"
              />
            </div>
            <div className="bedelia__field">
              <label htmlFor="e-ini">Empieza</label>
              <input
                id="e-ini"
                type="datetime-local"
                value={draft.fechaInicio}
                onChange={(e) => {
                  const fechaInicio = e.target.value
                  const finActual = new Date(draft.fechaFin).getTime()
                  const iniMs = new Date(fechaInicio).getTime()
                  const needsBump =
                    Number.isNaN(finActual) ||
                    Number.isNaN(iniMs) ||
                    finActual <= iniMs
                  setDraft({
                    ...draft,
                    fechaInicio,
                    fechaFin: needsBump
                      ? defaultFechaFin(fechaInicio)
                      : draft.fechaFin,
                  })
                }}
              />
            </div>
            <div className="bedelia__field">
              <label htmlFor="e-fin">Termina (+1 semana · 00:00)</label>
              <input
                id="e-fin"
                type="datetime-local"
                value={draft.fechaFin}
                onChange={(e) =>
                  setDraft({ ...draft, fechaFin: e.target.value })
                }
              />
            </div>
            <p className="muted admin-form-compact__full admin-date-hint">
              Solo indica cuándo ocurre el evento en el sitio. No lo elimina al
              pasar la fecha. El fin debe ser después del inicio (por defecto:
              una semana después a las 00:00).
            </p>
            <div className="bedelia__field admin-form-compact__full">
              <label htmlFor="e-resumen">Resumen</label>
              <input
                id="e-resumen"
                value={draft.resumen}
                onChange={(e) =>
                  setDraft({ ...draft, resumen: e.target.value })
                }
                placeholder="Opcional"
              />
            </div>
            <div className="bedelia__field admin-form-compact__full">
              <label htmlFor="e-desc">Descripción</label>
              <textarea
                id="e-desc"
                rows={2}
                value={draft.descripcion}
                onChange={(e) =>
                  setDraft({ ...draft, descripcion: e.target.value })
                }
              />
            </div>
            <div className="admin-form-compact__full admin-form-compact__media">
              <FileDropField
                id="e-images"
                label={
                  draft.portadaUrl
                    ? 'Más fotos (álbum / galería)'
                    : 'Imágenes (1ª = portada, resto = galería)'
                }
                multiple
                onFiles={addPending}
                hint="Elegí o arrastrá varias a la vez"
                compact
              />
              {draft.portadaUrl && (
                <div className="admin-pending-thumbs">
                  <figure className="admin-pending-thumb">
                    <img src={draft.portadaUrl} alt="" />
                    <figcaption>Portada</figcaption>
                  </figure>
                  {draft.id && (
                    <button
                      type="button"
                      className="btn btn--danger btn--small"
                      disabled={saving}
                      onClick={() => requestPurgePortada(draft.id!)}
                    >
                      Borrar portada
                    </button>
                  )}
                </div>
              )}
              <PendingThumbs
                files={pendingFiles}
                firstIsCover={!draft.portadaUrl}
                onRemove={removePending}
              />
            </div>
          </div>

          <div className="row-actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar evento'}
            </button>
            {draft.id && pendingFiles.length > 0 && (
              <button
                className="btn btn--ghost"
                type="button"
                disabled={saving}
                onClick={() => void onUploadMoreNow()}
              >
                Subir {pendingFiles.length} ahora
              </button>
            )}
            <button
              className="btn btn--ghost"
              type="button"
              onClick={closeForm}
            >
              Cerrar
            </button>
          </div>

          {draft.id && fotos.length > 0 && (
            <div className="gallery-album-grid">
              {fotos.map((f) => (
                <div key={f.id} className="gallery-album">
                  <div className="gallery-album__media">
                    {f.imagenUrl && <img src={f.imagenUrl} alt="" />}
                  </div>
                  <div className="gallery-album__meta">
                    <p className="gallery-album__title">{f.etiqueta || 'Foto'}</p>
                    <button
                      type="button"
                      className="btn btn--danger btn--small"
                      disabled={saving}
                      onClick={() => requestDeleteFoto(f.id)}
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>
      )}

      <ul className="ig-admin-list">
        {rows.map((ev) => {
          const starred = isFeatured(`evento:${ev.id}`, featuredOrder)
          return (
            <li key={ev.id} className="ig-admin-row">
              {ev.portadaUrl ? (
                <img
                  className="ig-admin-row__thumb"
                  src={ev.portadaUrl}
                  alt=""
                />
              ) : (
                <span className="ig-admin-row__thumb ig-admin-row__thumb--empty" />
              )}
              <div className="ig-admin-row__body">
                <p className="ig-admin-row__caption ig-admin-row__caption--stack">
                  <SourceBadge kind="evento" />
                  <span className="ig-admin-row__title">{ev.titulo}</span>
                </p>
                <p className="ig-admin-row__meta">
                  {ev.lugar || 'IFTS N°2 DE 20'}
                  {starred ? ' · ★ carrusel' : ''}
                </p>
              </div>
              <div className="ig-admin-row__actions ig-admin-row__actions--row">
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => void openEdit(ev)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className={`admin-star${starred ? ' is-on' : ''}`}
                  disabled={starBusy}
                  title={
                    starred ? 'Quitar del carrusel' : 'Agregar al carrusel'
                  }
                  onClick={() => void onToggleStar(ev)}
                >
                  ★
                </button>
                {ev.portadaUrl && (
                  <button
                    type="button"
                    className="btn btn--danger btn--small"
                    disabled={saving}
                    title="Borrar portada del Storage"
                    onClick={() => requestPurgePortada(ev.id)}
                  >
                    Borrar
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {rows.length === 0 && (
        <p className="muted">Todavía no hay eventos en el CMS.</p>
      )}

      <ConfirmDialog
        open={pendingDelete != null}
        title={
          pendingDelete?.kind === 'foto'
            ? '¿Eliminar foto?'
            : '¿Borrar portada?'
        }
        message={
          pendingDelete?.kind === 'foto'
            ? 'Vas a eliminar esta foto del Storage. Esta acción requiere confirmación.'
            : 'Vas a borrar la portada del Storage y liberar espacio. Esta acción requiere confirmación.'
        }
        confirmLabel={
          pendingDelete?.kind === 'foto' ? 'Sí, eliminar' : 'Sí, borrar'
        }
        busy={saving}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void runPendingDelete()}
      />
    </div>
  )
}

/** Compat: /admin/noticias y /admin/galeria → contenido */
export function AdminNoticiasPage() {
  return <Navigate to="/admin/contenido" replace />
}

export function AdminGaleriaPage() {
  return <Navigate to="/admin/contenido?filtro=eventos" replace />
}
