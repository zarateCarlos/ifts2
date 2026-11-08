import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import {
  CONTENT_AREA_LABELS,
  emptyContentDraft,
  type ContentArea,
  type SiteContentItem,
} from '../data/contentTypes'
import { useSiteContent } from '../data/contentStore'
import { isAuthed } from './admin/adminAuth'
import {
  adminCreateNoticia,
  adminDeleteNoticiaPortada,
  adminSetNoticiaEstado,
  adminUpdateNoticia,
  adminUploadNoticiaPortada,
} from '../api/adminCms'
import { contentAreaToNewsArea } from '../api/mappers'
import { ApiError, fetchSiteContent, notifyStorageChanged, updateFeaturedOrder } from '../api'
import { bumpPublicFeed } from '../data/feedStore'
import {
  pushAdminToast,
  replaceAdminToast,
} from '../data/adminToast'
import type { EditorialEstado, NoticiaRequest } from '../api/types'
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
import { AdminEventosPage } from './AdminEventosPage'

const AREAS = Object.keys(CONTENT_AREA_LABELS) as ContentArea[]
type ContenidoFilter = ContentArea | 'eventos'

function toRequest(item: SiteContentItem): NoticiaRequest {
  return {
    titulo: item.title.trim(),
    resumen: item.body.trim().slice(0, 280) || item.title.trim(),
    contenido: item.body.trim(),
    area: contentAreaToNewsArea(item.area),
    mostrarEnNovedades: item.showInNovedades,
    enlaceUrl: item.linkUrl.trim() || undefined,
    fecha: item.dateISO || undefined,
  }
}

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  )
}

export function AdminContenidoPage() {
  if (!isAuthed()) return <Navigate to="/admin/login" replace />

  const [params, setParams] = useSearchParams()
  const filterParam = params.get('filtro') ?? params.get('seccion')
  const filter: ContenidoFilter =
    filterParam === 'eventos' || AREAS.includes(filterParam as ContentArea)
      ? (filterParam as ContenidoFilter)
      : 'docentes'

  const { all, reload } = useSiteContent()
  const [rows, setRows] = useState<SiteContentItem[]>(all)
  const [draft, setDraft] = useState<SiteContentItem | null>(null)
  const [note, setNote] = useState('')
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [saving, setSaving] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [featuredOrder, setFeaturedOrder] = useState(loadFeaturedOrder)
  const [starBusy, setStarBusy] = useState(false)
  const [pendingAction, setPendingAction] = useState<
    | null
    | { kind: 'estado'; id: string; estado: EditorialEstado; title: string }
    | { kind: 'purge'; id: string; title: string }
  >(null)

  useEffect(() => setRows(all), [all])

  useEffect(() => {
    void fetchFeaturedOrder().then(setFeaturedOrder)
    return subscribeFeatured(() => setFeaturedOrder(loadFeaturedOrder()))
  }, [])

  useEffect(() => {
    if (saveStatus !== 'saved' && saveStatus !== 'error') return
    const t = window.setTimeout(() => setSaveStatus('idle'), 1800)
    return () => window.clearTimeout(t)
  }, [saveStatus])

  function flash(ok: boolean, msg: string) {
    setSaveStatus(ok ? 'saved' : 'error')
    setNote(msg)
  }

  function setFilter(next: ContenidoFilter) {
    const p = new URLSearchParams(params)
    p.set('filtro', next)
    p.delete('seccion')
    setParams(p, { replace: true })
  }

  const visible = useMemo(
    () =>
      rows
        .filter((r) => (filter === 'eventos' ? true : r.area === filter))
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
    [rows, filter],
  )

  function startNew(area: ContentArea = 'docentes') {
    setDraft(emptyContentDraft(area))
    setCoverFile(null)
    setNote('')
  }

  function startEdit(item: SiteContentItem) {
    setDraft({ ...item })
    setCoverFile(null)
    setNote('')
  }

  function cancelEdit() {
    setDraft(null)
    setCoverFile(null)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!draft?.title.trim()) {
      pushAdminToast({
        kind: 'error',
        title: 'Falta el título',
        message: 'Completá el título de la publicación.',
      })
      setNote('El título es obligatorio.')
      return
    }
    const wasNew = !isUuid(draft.id)
    const toastId = pushAdminToast({
      kind: 'loading',
      title: wasNew ? 'Publicando…' : 'Guardando…',
    })
    setSaving(true)
    setSaveStatus('saving')
    setNote('')
    try {
      const body = toRequest(draft)
      let id = draft.id
      if (isUuid(draft.id)) {
        await adminUpdateNoticia(draft.id, body)
      } else {
        const created = await adminCreateNoticia(body)
        id = created?.id
        if (!id) {
          throw new ApiError('El servidor no devolvió el id de la publicación', 0)
        }
      }

      const estado: EditorialEstado = draft.published ? 'PUBLICADA' : 'BORRADOR'
      await adminSetNoticiaEstado(id, estado)

      if (coverFile) {
        try {
          await adminUploadNoticiaPortada(id, coverFile)
          notifyStorageChanged()
        } catch (imgErr) {
          await fetchSiteContent()
          await reload()
          await bumpPublicFeed()
          const imgMsg =
            imgErr instanceof ApiError
              ? imgErr.message
              : 'No se pudo subir la portada'
          replaceAdminToast(toastId, {
            kind: 'error',
            title: 'Publicado sin imagen',
            message: imgMsg,
          })
          flash(false, imgMsg)
          cancelEdit()
          return
        }
      }

      await fetchSiteContent()
      await reload()
      await bumpPublicFeed()
      cancelEdit()
      replaceAdminToast(toastId, {
        kind: 'success',
        title: draft.published
          ? wasNew
            ? 'Publicación lista'
            : 'Cambios guardados'
          : 'Borrador guardado',
        message: draft.published
          ? 'Ya debería verse en el inicio / novedades.'
          : 'Quedó como borrador (no público).',
      })
      flash(true, 'Guardado')
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'No se pudo guardar.'
      replaceAdminToast(toastId, {
        kind: 'error',
        title: 'No se pudo publicar',
        message: msg,
      })
      flash(false, msg)
    } finally {
      setSaving(false)
    }
  }

  async function setEstado(id: string, estado: EditorialEstado) {
    const toastId = pushAdminToast({
      kind: 'loading',
      title: estado === 'PUBLICADA' ? 'Publicando…' : 'Actualizando…',
    })
    setSaving(true)
    try {
      await adminSetNoticiaEstado(id, estado)
      await fetchSiteContent()
      await reload()
      await bumpPublicFeed()
      replaceAdminToast(toastId, {
        kind: 'success',
        title:
          estado === 'PUBLICADA'
            ? 'Publicada'
            : estado === 'BORRADOR'
              ? 'Retirada'
              : 'Archivada',
        message:
          estado === 'PUBLICADA'
            ? 'Visible en el sitio.'
            : 'Ya no aparece en el feed público.',
      })
      setNote(`Estado → ${estado}`)
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Error al cambiar estado'
      replaceAdminToast(toastId, {
        kind: 'error',
        title: 'No se pudo cambiar el estado',
        message: msg,
      })
      setNote(msg)
    } finally {
      setSaving(false)
    }
  }

  function requestPurgePortada(id: string, title: string) {
    if (!isUuid(id)) {
      pushAdminToast({
        kind: 'error',
        title: 'Todavía no está guardada',
        message: 'Guardá la publicación antes de vaciar la portada.',
      })
      setNote('Guardá la publicación antes de vaciar la portada.')
      return
    }
    setPendingAction({ kind: 'purge', id, title })
  }

  function requestEstado(
    id: string,
    estado: EditorialEstado,
    title: string,
  ) {
    if (estado === 'PUBLICADA') {
      void setEstado(id, estado)
      return
    }
    setPendingAction({ kind: 'estado', id, estado, title })
  }

  async function runPendingAction() {
    if (!pendingAction) return
    const action = pendingAction
    setPendingAction(null)
    if (action.kind === 'estado') {
      await setEstado(action.id, action.estado)
      return
    }
    const toastId = pushAdminToast({
      kind: 'loading',
      title: 'Borrando portada…',
    })
    setSaving(true)
    setNote('')
    try {
      await adminDeleteNoticiaPortada(action.id)
      if (draft?.id === action.id) setDraft({ ...draft, imageUrl: '' })
      await fetchSiteContent()
      await reload()
      notifyStorageChanged()
      replaceAdminToast(toastId, {
        kind: 'success',
        title: 'Portada borrada',
        message: 'Espacio liberado en Storage.',
      })
      setNote('Portada borrada del Storage. Espacio liberado.')
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'No se pudo vaciar la portada (¿endpoint activo?).'
      replaceAdminToast(toastId, {
        kind: 'error',
        title: 'No se pudo borrar',
        message: msg,
      })
      setNote(msg)
    } finally {
      setSaving(false)
    }
  }

  async function onToggleStar(item: SiteContentItem) {
    if (!isUuid(item.id)) {
      pushAdminToast({
        kind: 'error',
        title: 'Guardá primero',
        message: 'Guardá la publicación antes de destacarla.',
      })
      setNote('Guardá la publicación antes de destacarla.')
      return
    }
    const feedId = `noticia:${item.id}`
    const next = featuredOrder.includes(feedId)
      ? featuredOrder.filter((x) => x !== feedId)
      : featuredOrder.length >= MAX_FEATURED
        ? featuredOrder
        : [...featuredOrder, feedId]
    if (!featuredOrder.includes(feedId) && featuredOrder.length >= MAX_FEATURED) {
      pushAdminToast({
        kind: 'error',
        title: 'Límite de ★',
        message: `Máximo ${MAX_FEATURED} destacados.`,
      })
      setNote(`Máximo ${MAX_FEATURED} destacados.`)
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
        message: on
          ? 'Podés reordenarlo en Destacados.'
          : 'Ya no aparece en destacados.',
      })
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'No se pudo actualizar ★'
      replaceAdminToast(toastId, {
        kind: 'error',
        title: 'Error ★',
        message: msg,
      })
      setNote(msg)
    } finally {
      setStarBusy(false)
    }
  }

  return (
    <div className={`stack${filter === 'eventos' ? ' admin-stack-tight' : ''}`}>
      <div className="admin-page-head admin-page-head--compact">
        <div>
          <p className="page-kicker">Admin</p>
          <h1 className="page-title">Contenido</h1>
          {filter !== 'eventos' && (
            <p className="muted">
              Publicaciones por área y eventos. ★ = carrusel.
            </p>
          )}
        </div>
        {filter !== 'eventos' && (
          <AdminSaveStatus
            status={saveStatus}
            message={saveStatus === 'idle' ? '' : note}
          />
        )}
      </div>

      <div className="gallery-filters" role="tablist" aria-label="Filtro">
        {AREAS.map((a) => (
          <button
            key={a}
            type="button"
            role="tab"
            aria-selected={filter === a}
            className={`chip${filter === a ? ' is-active' : ''}`}
            onClick={() => setFilter(a)}
          >
            {CONTENT_AREA_LABELS[a]}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'eventos'}
          className={`chip${filter === 'eventos' ? ' is-active' : ''}`}
          onClick={() => setFilter('eventos')}
        >
          Eventos
        </button>
      </div>

      {filter === 'eventos' ? (
        <AdminEventosPage embedded />
      ) : (
        <>
      <div className="row-actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => startNew(filter)}
        >
          Nueva publicación
        </button>
      </div>

      {draft && (
        <form
          className="panel admin-form-compact"
          onSubmit={onSave}
          noValidate
        >
          <h2>{isUuid(draft.id) ? 'Editar' : 'Nueva'} publicación</h2>
          <div className="admin-form-compact__grid">
            <div className="bedelia__field">
              <label htmlFor="c-area">Área</label>
              <select
                id="c-area"
                value={draft.area}
                onChange={(e) =>
                  setDraft({ ...draft, area: e.target.value as ContentArea })
                }
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {CONTENT_AREA_LABELS[a]}
                  </option>
                ))}
              </select>
            </div>
            <div className="bedelia__field">
              <label htmlFor="c-date">Fecha</label>
              <input
                id="c-date"
                type="date"
                value={draft.dateISO}
                onChange={(e) =>
                  setDraft({ ...draft, dateISO: e.target.value })
                }
              />
            </div>
            <div className="bedelia__field">
              <label htmlFor="c-link">Enlace</label>
              <input
                id="c-link"
                value={draft.linkUrl}
                onChange={(e) =>
                  setDraft({ ...draft, linkUrl: e.target.value })
                }
                placeholder="Opcional"
              />
            </div>
            <div className="bedelia__field admin-form-compact__full">
              <label htmlFor="c-title">Título</label>
              <input
                id="c-title"
                value={draft.title}
                onChange={(e) =>
                  setDraft({ ...draft, title: e.target.value })
                }
                required
              />
            </div>
            <div className="bedelia__field admin-form-compact__full">
              <label htmlFor="c-body">Texto</label>
              <textarea
                id="c-body"
                rows={4}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                required
              />
            </div>
            <div className="admin-form-compact__full admin-form-compact__media">
              <FileDropField
                id="c-cover"
                label="Portada"
                file={coverFile}
                onFile={setCoverFile}
                previewUrl={draft.imageUrl || undefined}
                compact
              />
              {draft.imageUrl && isUuid(draft.id) && (
                <button
                  type="button"
                  className="btn btn--danger btn--small"
                  disabled={saving}
                  onClick={() =>
                    requestPurgePortada(draft.id, draft.title || 'Sin título')
                  }
                >
                  Borrar portada del Storage
                </button>
              )}
            </div>
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) =>
                setDraft({ ...draft, published: e.target.checked })
              }
            />
            Publicada
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={draft.showInNovedades}
              onChange={(e) =>
                setDraft({ ...draft, showInNovedades: e.target.checked })
              }
            />
            Mostrar en novedades del inicio
          </label>
          <div className="row-actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button className="btn btn--ghost" type="button" onClick={cancelEdit}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <ul className="ig-admin-list">
        {visible.map((item) => (
          <li key={item.id} className="ig-admin-row">
            {item.imageUrl ? (
              <img className="ig-admin-row__thumb" src={item.imageUrl} alt="" />
            ) : (
              <span className="ig-admin-row__thumb ig-admin-row__thumb--empty" />
            )}
            <div className="ig-admin-row__body">
              <p className="ig-admin-row__caption">
                <SourceBadge kind={item.area} /> {item.title}
              </p>
              <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                {item.dateLabel || item.dateISO} ·{' '}
                {item.published ? 'PUBLICADA' : 'BORRADOR'}
              </p>
            </div>
            <div className="ig-admin-row__actions">
              <button
                type="button"
                className={`admin-star${isFeatured(`noticia:${item.id}`, featuredOrder) ? ' is-on' : ''}`}
                disabled={starBusy || !isUuid(item.id)}
                title="Destacar en carrusel"
                onClick={() => void onToggleStar(item)}
              >
                ★
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => startEdit(item)}
              >
                Editar
              </button>
              {item.imageUrl && isUuid(item.id) && (
                <button
                  type="button"
                  className="btn btn--danger btn--small"
                  disabled={saving}
                  title="Borrar imagen del Storage"
                  onClick={() => requestPurgePortada(item.id, item.title)}
                >
                  Borrar
                </button>
              )}
              {item.published ? (
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={saving}
                  onClick={() =>
                    requestEstado(item.id, 'BORRADOR', item.title)
                  }
                >
                  Retirar
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={saving}
                  onClick={() =>
                    requestEstado(item.id, 'PUBLICADA', item.title)
                  }
                >
                  Publicar
                </button>
              )}
              <button
                type="button"
                className="btn btn--ghost"
                disabled={saving}
                onClick={() =>
                  requestEstado(item.id, 'ARCHIVADA', item.title)
                }
              >
                Archivar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="muted">No hay publicaciones en esta vista.</p>
      )}
        </>
      )}

      <ConfirmDialog
        open={pendingAction != null}
        title={
          pendingAction?.kind === 'purge'
            ? '¿Borrar portada?'
            : pendingAction?.estado === 'ARCHIVADA'
              ? '¿Archivar publicación?'
              : '¿Retirar publicación?'
        }
        message={
          pendingAction?.kind === 'purge'
            ? `Vas a borrar la portada de «${pendingAction.title}» del Storage. Se libera espacio; podés subir otra después.`
            : pendingAction?.estado === 'ARCHIVADA'
              ? `«${pendingAction.title}» pasará a ARCHIVADA y dejará de mostrarse en el sitio. Esta acción requiere confirmación.`
              : `«${pendingAction?.title ?? ''}» pasará a BORRADOR y saldrá del listado público. Esta acción requiere confirmación.`
        }
        confirmLabel={
          pendingAction?.kind === 'purge'
            ? 'Sí, borrar'
            : pendingAction?.estado === 'ARCHIVADA'
              ? 'Sí, archivar'
              : 'Sí, retirar'
        }
        busy={saving}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void runPendingAction()}
      />
    </div>
  )
}
