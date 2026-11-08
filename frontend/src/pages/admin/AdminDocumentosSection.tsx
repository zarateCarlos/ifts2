import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  adminCreateDocumento,
  adminListDocumentos,
  adminSetDocumentoEstado,
  adminUpdateDocumento,
  adminUploadDocumentoArchivo,
  ApiError,
  invalidatePublicCache,
  notifyStorageChanged,
} from '../../api'
import type { DocumentoAdminResponse } from '../../api/types'
import {
  pushAdminToast,
  replaceAdminToast,
} from '../../data/adminToast'
import {
  DOCUMENTOS_SLOTS,
  DOC_SLOTS_EVENT,
  SECCION_SLOT_LABEL,
  applyOverrides,
  buildSlotDescripcion,
  loadSlotOverrides,
  parseSlotDescripcionBody,
  parseSlotKey,
  saveSlotOverride,
  sortSlotsNewestFirst,
  type DocumentoSeccion,
  type DocumentoSlot,
} from '../../data/documentosSlots'
import { SITE_OFICIAL_URL } from '../../data/seccionesSite'
import { AdminSaveStatus } from '../../components/AdminSaveStatus'

type Draft = {
  key: string
  titulo: string
  anio: number
  descripcion: string
  file: File | null
}

const SECCIONES: DocumentoSeccion[] = ['alumnos', 'docentes', 'carrera']

function displayTitle(slot: DocumentoSlot) {
  return `${slot.titulo} (${slot.anio})`
}

export function AdminDocumentosSection() {
  const [cms, setCms] = useState<DocumentoAdminResponse[]>([])
  const [overridesTick, setOverridesTick] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<DocumentoSeccion | 'todas'>('alumnos')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [saveMsg, setSaveMsg] = useState('')

  const slots = useMemo(() => {
    void overridesTick
    return sortSlotsNewestFirst(applyOverrides(DOCUMENTOS_SLOTS)).filter((s) =>
      filter === 'todas' ? true : s.seccion === filter,
    )
  }, [filter, overridesTick])

  const cmsBySlot = useMemo(() => {
    const map = new Map<string, DocumentoAdminResponse>()
    for (const d of cms) {
      const key = parseSlotKey(d.descripcion)
      if (key) map.set(key, d)
    }
    return map
  }, [cms])

  async function reload() {
    setLoading(true)
    try {
      setCms(await adminListDocumentos())
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo listar'
      pushAdminToast({ kind: 'error', title: 'Documentos', message: msg })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  useEffect(() => {
    function sync() {
      setOverridesTick((n) => n + 1)
    }
    window.addEventListener(DOC_SLOTS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(DOC_SLOTS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    if (saveStatus !== 'saved' && saveStatus !== 'error') return
    const t = window.setTimeout(() => setSaveStatus('idle'), 1800)
    return () => window.clearTimeout(t)
  }, [saveStatus])

  function startEdit(slot: DocumentoSlot) {
    const cmsRow = cmsBySlot.get(slot.key)
    const o = loadSlotOverrides()[slot.key]
    setDraft({
      key: slot.key,
      titulo: o?.titulo?.trim() || slot.titulo,
      anio: o?.anio ?? slot.anio,
      descripcion:
        o?.descripcion ??
        (parseSlotDescripcionBody(cmsRow?.descripcion) ||
          slot.descripcion ||
          ''),
      file: null,
    })
  }

  async function ensureSlot(
    slot: DocumentoSlot,
    titulo: string,
    descripcion: string,
  ): Promise<DocumentoAdminResponse> {
    const existing = cmsBySlot.get(slot.key)
    const body = {
      titulo,
      descripcion: buildSlotDescripcion(slot.key, descripcion),
      tipo: slot.tipo,
    }
    if (existing) {
      return adminUpdateDocumento(existing.id, body)
    }
    return adminCreateDocumento(body)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!draft) return
    const slot = DOCUMENTOS_SLOTS.find((s) => s.key === draft.key)
    if (!slot) return

    const titulo = draft.titulo.trim()
    if (!titulo) {
      pushAdminToast({ kind: 'error', title: 'Falta el nombre' })
      return
    }
    if (!draft.anio || draft.anio < 2000 || draft.anio > 2100) {
      pushAdminToast({ kind: 'error', title: 'Año inválido' })
      return
    }

    const toastId = pushAdminToast({
      kind: 'loading',
      title: 'Guardando documento…',
    })
    setBusy(true)
    setSaveStatus('saving')
    setSaveMsg('')

    try {
      saveSlotOverride(draft.key, {
        titulo,
        anio: draft.anio,
        descripcion: draft.descripcion.trim(),
      })

      let item = await ensureSlot(slot, `${titulo} (${draft.anio})`, draft.descripcion)
      if (draft.file) {
        if (
          draft.file.type !== 'application/pdf' &&
          !/\.pdf$/i.test(draft.file.name)
        ) {
          throw new Error('El archivo de reemplazo debe ser PDF.')
        }
        await adminUploadDocumentoArchivo(item.id, draft.file)
        notifyStorageChanged()
      }
      if (item.estado !== 'PUBLICADA' && (draft.file || item.archivoUrl || item.archivoObjectKey)) {
        item = await adminSetDocumentoEstado(item.id, 'PUBLICADA')
      }

      invalidatePublicCache('documentos')
      await reload()
      setDraft(null)
      setSaveStatus('saved')
      setSaveMsg('Guardado')
      replaceAdminToast(toastId, {
        kind: 'success',
        title: 'Documento actualizado',
        message: `${titulo} (${draft.anio})`,
      })
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Error'
      setSaveStatus('error')
      setSaveMsg(msg)
      replaceAdminToast(toastId, {
        kind: 'error',
        title: 'No se pudo guardar',
        message: msg,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-docs">
      <div className="admin-docs__head">
        <div>
          <h2 className="admin-docs__title">Documentos</h2>
          <p className="muted admin-docs__lead">
            Listas fijas del{' '}
            <a href={SITE_OFICIAL_URL} target="_blank" rel="noreferrer">
              sitio oficial
            </a>
            . Editá nombre, año, descripción y PDF. Lo más reciente va arriba en
            la web.
          </p>
        </div>
        <AdminSaveStatus status={saveStatus} message={saveMsg} />
      </div>

      <div className="admin-docs__toolbar">
        <label className="admin-docs__filter">
          <span>Sección</span>
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as DocumentoSeccion | 'todas')
            }
          >
            <option value="todas">Todas</option>
            {SECCIONES.map((s) => (
              <option key={s} value={s}>
                {SECCION_SLOT_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {draft ? (
        <form className="admin-docs__editor panel" onSubmit={onSave}>
          <h3 className="admin-docs__editor-title">Editar documento</h3>
          <div className="admin-docs__grid">
            <div className="bedelia__field admin-docs__span-2">
              <label htmlFor="doc-nombre">Nombre</label>
              <input
                id="doc-nombre"
                value={draft.titulo}
                onChange={(e) =>
                  setDraft({ ...draft, titulo: e.target.value })
                }
                required
              />
            </div>
            <div className="bedelia__field">
              <label htmlFor="doc-anio">Año</label>
              <input
                id="doc-anio"
                type="number"
                min={2000}
                max={2100}
                value={draft.anio}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    anio: Number(e.target.value) || draft.anio,
                  })
                }
                required
              />
            </div>
            <div className="bedelia__field">
              <label htmlFor="doc-pdf">PDF (opcional)</label>
              <input
                id="doc-pdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    file: e.target.files?.[0] ?? null,
                  })
                }
              />
              {draft.file ? (
                <span className="muted admin-docs__file">{draft.file.name}</span>
              ) : null}
            </div>
            <div className="bedelia__field admin-docs__span-2">
              <label htmlFor="doc-desc">Descripción</label>
              <textarea
                id="doc-desc"
                rows={2}
                value={draft.descripcion}
                onChange={(e) =>
                  setDraft({ ...draft, descripcion: e.target.value })
                }
                placeholder="Ej. Llamado julio-agosto"
              />
            </div>
          </div>
          <div className="admin-docs__actions">
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => setDraft(null)}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : (
        <ul className="admin-docs__list">
          {slots.map((slot) => {
            const row = cmsBySlot.get(slot.key)
            const href =
              row?.archivoUrl ||
              slot.localPath ||
              `https://drive.google.com/open?id=${slot.driveFileId}`
            return (
              <li key={slot.key} className="admin-docs__card">
                <div className="admin-docs__card-main">
                  <p className="admin-docs__card-title">{displayTitle(slot)}</p>
                  <p className="admin-docs__card-meta">
                    {SECCION_SLOT_LABEL[slot.seccion]}
                    {slot.descripcion ? ` · ${slot.descripcion}` : ''}
                    {row?.archivoUrl ? ' · PDF en CMS' : ''}
                  </p>
                </div>
                <div className="admin-docs__card-actions">
                  <a className="btn" href={href} target="_blank" rel="noreferrer">
                    Ver
                  </a>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => startEdit(slot)}
                  >
                    Editar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
