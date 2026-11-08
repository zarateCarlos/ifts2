import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import {
  ApiError,
  adminCreatePanelRole,
  adminCreateUsuario,
  adminDeletePanelRole,
  adminListPanelRoles,
  adminListUsuarios,
  adminUpdatePanelRole,
  changeOwnEmail,
  changeOwnPassword,
  fetchMe,
  verifyPassword,
  type PanelRolResponse,
  type UsuarioAdminResponse,
} from '../api'
import { AdminSaveStatus } from '../components/AdminSaveStatus'
import { ConfirmPasswordDialog } from '../components/ConfirmPasswordDialog'
import { pushAdminToast } from '../data/adminToast'
import {
  ADMIN_SECTIONS,
  newRoleDraft,
  normalizePermissions,
  setSessionAdminEmail,
  usePanelAccess,
  type AdminRole,
  type AdminSectionId,
  type SectionPermission,
} from '../data/adminRolesStore'
import { isAuthed } from './admin/adminAuth'

function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <label
      className={`admin-switch${disabled ? ' is-disabled' : ''}`}
      title={label}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="admin-switch__track" aria-hidden />
      <span className="admin-switch__label">{label}</span>
    </label>
  )
}

function setPerm(
  role: AdminRole,
  section: AdminSectionId,
  patch: Partial<SectionPermission>,
): AdminRole {
  const prev = role.permissions[section]
  let next: SectionPermission = { ...prev, ...patch }
  if (next.manage) next = { ...next, view: true }
  if (!next.view) next = { ...next, manage: false }
  return {
    ...role,
    permissions: { ...role.permissions, [section]: next },
  }
}

function toRole(r: PanelRolResponse): AdminRole {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    permissions: normalizePermissions(r.permissions),
  }
}

/** Datos para dar de alta el usuario EDITOR cuando el email no tiene cuenta. */
type NewUserFields = { nombre: string; apellido: string; password: string }

type PendingAction =
  | { kind: 'delete-role'; role: AdminRole }
  | { kind: 'save-role'; role: AdminRole; mode: 'create' | 'edit' }
  | { kind: 'create-user-and-role'; role: AdminRole; user: NewUserFields }

function errMessage(err: unknown, fallback: string) {
  return err instanceof ApiError || err instanceof Error ? err.message : fallback
}

export function AdminMiCuentaPage() {
  const access = usePanelAccess()
  const superAdmin = access.fullAccess

  const [loadedEmail, setLoadedEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [editingAccount, setEditingAccount] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailPass, setEmailPass] = useState('')
  const [emailStatus, setEmailStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [emailMsg, setEmailMsg] = useState('')

  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [passStatus, setPassStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [passMsg, setPassMsg] = useState('')

  const [roles, setRoles] = useState<AdminRole[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState('')
  const [usuarios, setUsuarios] = useState<UsuarioAdminResponse[]>([])
  /** Borrador de rol nuevo (cancelable sin guardar). */
  const [creating, setCreating] = useState<AdminRole | null>(null)
  /** Edición de un rol existente (cancelable). */
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null)
  const [formError, setFormError] = useState('')
  /** El email del borrador no tiene usuario: pedir datos para crearlo. */
  const [newUser, setNewUser] = useState<NewUserFields | null>(null)

  const [pending, setPending] = useState<PendingAction | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchMe()
      .then((me) => {
        if (cancelled) return
        setLoadedEmail(me.email)
        setNombre(`${me.nombre} ${me.apellido}`.trim())
        setSessionAdminEmail(me.email)
        setLoadError('')
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errMessage(err, 'No se pudo cargar el perfil'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function reloadRoles() {
    setRolesLoading(true)
    try {
      const [list, users] = await Promise.all([
        adminListPanelRoles(),
        adminListUsuarios().catch(() => [] as UsuarioAdminResponse[]),
      ])
      setRoles(list.map(toRole))
      setUsuarios(users)
      setRolesError('')
    } catch (err) {
      setRolesError(errMessage(err, 'No se pudieron cargar los roles'))
    } finally {
      setRolesLoading(false)
    }
  }

  useEffect(() => {
    if (superAdmin) void reloadRoles()
  }, [superAdmin])

  useEffect(() => {
    if (emailStatus !== 'saved' && emailStatus !== 'error') return
    const t = window.setTimeout(() => setEmailStatus('idle'), 1800)
    return () => window.clearTimeout(t)
  }, [emailStatus])

  useEffect(() => {
    if (passStatus !== 'saved' && passStatus !== 'error') return
    const t = window.setTimeout(() => setPassStatus('idle'), 1800)
    return () => window.clearTimeout(t)
  }, [passStatus])

  /** EDITOR activos sin rol asignado: sugerencias para el campo email. */
  const assignableEmails = useMemo(() => {
    const taken = new Set(roles.map((r) => r.email.toLowerCase()))
    return usuarios
      .filter((u) => u.rol === 'EDITOR' && u.activo)
      .map((u) => u.email.toLowerCase())
      .filter((e) => !taken.has(e))
  }, [roles, usuarios])

  if (!isAuthed()) return <Navigate to="/admin/login" replace />

  async function onSaveEmail(e: FormEvent) {
    e.preventDefault()
    const next = newEmail.trim().toLowerCase()
    if (!next.includes('@') || !emailPass) {
      setEmailStatus('error')
      setEmailMsg('Completá el nuevo email y tu contraseña actual.')
      return
    }
    setEmailStatus('saving')
    try {
      const me = await changeOwnEmail({
        email: next,
        currentPassword: emailPass,
      })
      setLoadedEmail(me.email)
      setNewEmail('')
      setEmailPass('')
      setSessionAdminEmail(me.email)
      setEmailStatus('saved')
      setEmailMsg('Email actualizado.')
      pushAdminToast({ kind: 'success', title: 'Email actualizado' })
    } catch (err) {
      setEmailStatus('error')
      setEmailMsg(
        err instanceof ApiError && err.status === 409
          ? 'Contraseña incorrecta o ese email ya está en uso.'
          : errMessage(err, 'Error'),
      )
    }
  }

  async function onSavePassword(e: FormEvent) {
    e.preventDefault()
    if (!currentPass || newPass.length < 12 || newPass !== confirmPass) {
      setPassStatus('error')
      setPassMsg(
        !currentPass
          ? 'Ingresá tu contraseña actual.'
          : newPass !== confirmPass
            ? 'La confirmación no coincide.'
            : 'Mínimo 12 caracteres.',
      )
      return
    }
    setPassStatus('saving')
    try {
      await changeOwnPassword({
        currentPassword: currentPass,
        newPassword: newPass,
      })
      setCurrentPass('')
      setNewPass('')
      setConfirmPass('')
      setPassStatus('saved')
      setPassMsg('Contraseña actualizada.')
      pushAdminToast({ kind: 'success', title: 'Contraseña actualizada' })
    } catch (err) {
      setPassStatus('error')
      setPassMsg(
        err instanceof ApiError && err.status === 409
          ? 'La contraseña actual es incorrecta.'
          : errMessage(err, 'Error'),
      )
    }
  }

  function closeForms() {
    setCreating(null)
    setEditingRole(null)
    setFormError('')
    setNewUser(null)
  }

  function startCreate() {
    closeForms()
    setCreating(newRoleDraft())
  }

  function startEdit(role: AdminRole) {
    closeForms()
    setEditingRole({ ...role, permissions: { ...role.permissions } })
  }

  function roleInput(role: AdminRole) {
    return {
      name: role.name.trim(),
      email: role.email.trim().toLowerCase(),
      permissions: role.permissions,
    }
  }

  async function confirmPending(password: string) {
    if (!pending) return
    const action = pending
    setConfirmBusy(true)
    setConfirmError('')
    try {
      if (action.kind === 'delete-role') {
        await adminDeletePanelRole(action.role.id, password)
        if (editingRole?.id === action.role.id) closeForms()
        pushAdminToast({
          kind: 'success',
          title: 'Rol eliminado',
          message: 'El usuario sigue existiendo, pero sin acceso al CMS.',
        })
      } else if (action.kind === 'create-user-and-role') {
        // Verificar antes de crear el usuario: si la contraseña está mal no
        // queremos dejar una cuenta huérfana sin rol.
        await verifyPassword(password)
        await adminCreateUsuario({
          nombre: action.user.nombre.trim(),
          apellido: action.user.apellido.trim(),
          email: action.role.email.trim().toLowerCase(),
          password: action.user.password,
          rol: 'EDITOR',
        })
        await adminCreatePanelRole(roleInput(action.role), password)
        closeForms()
        pushAdminToast({
          kind: 'success',
          title: 'Usuario y rol creados',
          message: 'Pasale el email y la contraseña inicial a la persona.',
        })
      } else if (action.mode === 'create') {
        await adminCreatePanelRole(roleInput(action.role), password)
        closeForms()
        pushAdminToast({ kind: 'success', title: 'Rol creado' })
      } else {
        await adminUpdatePanelRole(
          action.role.id,
          roleInput(action.role),
          password,
        )
        closeForms()
        pushAdminToast({ kind: 'success', title: 'Rol actualizado' })
      }
      setPending(null)
      await reloadRoles()
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0
      if (status === 401) {
        setConfirmError('Contraseña incorrecta.')
        return
      }
      setPending(null)
      if (
        status === 404 &&
        action.kind === 'save-role' &&
        action.mode === 'create'
      ) {
        setNewUser({ nombre: '', apellido: '', password: '' })
        setFormError(
          'Ese email no tiene usuario todavía. Completá sus datos para crearlo como Editor.',
        )
        return
      }
      const msg =
        status === 409
          ? 'Ese usuario ya tiene un rol, está inactivo o es Admin.'
          : errMessage(err, 'No se pudo guardar.')
      setFormError(msg)
      pushAdminToast({ kind: 'error', title: 'No se pudo guardar', message: msg })
    } finally {
      setConfirmBusy(false)
    }
  }

  function requestSaveRole(role: AdminRole, mode: 'create' | 'edit') {
    setFormError('')
    if (!role.name.trim()) {
      setFormError('Falta el nombre del rol.')
      return
    }
    if (!role.email.trim().includes('@')) {
      setFormError('Indicá un email válido.')
      return
    }
    if (newUser && mode === 'create') {
      if (!newUser.nombre.trim() || !newUser.apellido.trim()) {
        setFormError('Completá nombre y apellido del usuario.')
        return
      }
      if (newUser.password.length < 12) {
        setFormError('La contraseña inicial necesita al menos 12 caracteres.')
        return
      }
      setPending({ kind: 'create-user-and-role', role, user: newUser })
      return
    }
    setPending({ kind: 'save-role', role, mode })
  }

  function renderRoleForm(
    role: AdminRole,
    mode: 'create' | 'edit',
    onChange: (next: AdminRole) => void,
  ) {
    return (
      <div className="panel stack admin-mi-cuenta__role admin-mi-cuenta__role-form">
        <h3 className="admin-docs__editor-title">
          {mode === 'create' ? 'Nuevo rol' : 'Editar rol'}
        </h3>
        <div className="admin-mi-cuenta__role-fields">
          <div className="bedelia__field">
            <label htmlFor="role-name">Nombre</label>
            <input
              id="role-name"
              value={role.name}
              onChange={(e) => onChange({ ...role, name: e.target.value })}
              placeholder="Ej. Bedelía"
              maxLength={100}
            />
          </div>
          <div className="bedelia__field">
            <label htmlFor="role-email">Email del usuario</label>
            <input
              id="role-email"
              type="email"
              list="role-email-options"
              value={role.email}
              onChange={(e) => {
                onChange({ ...role, email: e.target.value })
                if (newUser) {
                  setNewUser(null)
                  setFormError('')
                }
              }}
              placeholder="usuario@ejemplo.com"
              maxLength={254}
            />
            <datalist id="role-email-options">
              {assignableEmails.map((e) => (
                <option key={e} value={e} />
              ))}
            </datalist>
          </div>
        </div>

        {newUser && mode === 'create' ? (
          <div className="admin-mi-cuenta__role-fields">
            <div className="bedelia__field">
              <label htmlFor="nu-nombre">Nombre de la persona</label>
              <input
                id="nu-nombre"
                value={newUser.nombre}
                onChange={(e) =>
                  setNewUser({ ...newUser, nombre: e.target.value })
                }
                maxLength={100}
              />
            </div>
            <div className="bedelia__field">
              <label htmlFor="nu-apellido">Apellido</label>
              <input
                id="nu-apellido"
                value={newUser.apellido}
                onChange={(e) =>
                  setNewUser({ ...newUser, apellido: e.target.value })
                }
                maxLength={100}
              />
            </div>
            <div className="bedelia__field">
              <label htmlFor="nu-pass">Contraseña inicial</label>
              <input
                id="nu-pass"
                type="password"
                autoComplete="new-password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                minLength={12}
                maxLength={72}
              />
            </div>
          </div>
        ) : null}

        <div className="admin-config__perms" role="group" aria-label="Permisos">
          <div className="admin-config__perms-head">
            <span>Sección</span>
            <span>Ver</span>
            <span>Gestionar</span>
          </div>
          {ADMIN_SECTIONS.map((s) => {
            const p = role.permissions[s.id]
            return (
              <div key={s.id} className="admin-config__perm-row">
                <span className="admin-config__perm-label">{s.label}</span>
                <Switch
                  label="Ver"
                  checked={p.view}
                  onChange={(v) => onChange(setPerm(role, s.id, { view: v }))}
                />
                <Switch
                  label="Gestionar"
                  checked={p.manage}
                  onChange={(v) => onChange(setPerm(role, s.id, { manage: v }))}
                />
              </div>
            )
          })}
        </div>

        {formError ? (
          <p className="confirm-pass__error" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="admin-docs__actions">
          <button
            type="button"
            className="btn btn--primary btn--inline"
            onClick={() => requestSaveRole(role, mode)}
          >
            {newUser && mode === 'create' ? 'Crear usuario y rol' : 'Guardar'}
          </button>
          <button type="button" className="btn btn--inline" onClick={closeForms}>
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  const confirmMessage =
    pending?.kind === 'delete-role'
      ? `Vas a quitar el rol «${pending.role.name || pending.role.email}». El usuario no se borra, pero pierde acceso al CMS. Ingresá tu contraseña de ingreso.`
      : pending?.kind === 'create-user-and-role'
        ? `Vas a crear el usuario ${pending.role.email} como Editor y asignarle este rol. Ingresá tu contraseña de ingreso.`
        : pending?.kind === 'save-role'
          ? pending.mode === 'create'
            ? 'Vas a crear este rol. Ingresá tu contraseña de ingreso para confirmar.'
            : 'Vas a guardar cambios en este rol. Ingresá tu contraseña de ingreso.'
          : ''

  return (
    <div className="stack admin-mi-cuenta">
      <div className="admin-page-head" style={{ flexDirection: 'column' }}>
        <p className="page-kicker">Admin</p>
        <h1 className="page-title">Mi cuenta</h1>
      </div>

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : loadError ? (
        <div className="notice" role="alert">
          {loadError}
        </div>
      ) : (
        <>
          <div className="panel stack admin-mi-cuenta__account">
            <div className="admin-mi-cuenta__account-head">
              <p className="admin-mi-cuenta__meta" style={{ margin: 0 }}>
                {nombre || loadedEmail}
                {superAdmin ? (
                  <span className="admin-role-badge"> · Admin</span>
                ) : access.roleName ? (
                  ` · ${access.roleName}`
                ) : null}
              </p>
              {!editingAccount ? (
                <button
                  type="button"
                  className="btn btn--primary btn--inline"
                  onClick={() => {
                    setEditingAccount(true)
                    setNewEmail('')
                    setEmailPass('')
                    setCurrentPass('')
                    setNewPass('')
                    setConfirmPass('')
                  }}
                >
                  Editar
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--inline"
                  onClick={() => setEditingAccount(false)}
                >
                  Cancelar
                </button>
              )}
            </div>

            {editingAccount ? (
              <div className="admin-mi-cuenta__edit-grid">
                <form
                  className="stack admin-mi-cuenta__edit-card"
                  onSubmit={onSaveEmail}
                >
                  <h2 className="admin-config__h2">Cambiar email</h2>
                  <div className="bedelia__field">
                    <label htmlFor="me-new-email">Nuevo email</label>
                    <input
                      id="me-new-email"
                      type="email"
                      autoComplete="off"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="nuevo@correo.com"
                      required
                    />
                  </div>
                  <div className="bedelia__field">
                    <label htmlFor="me-email-pass">Contraseña actual</label>
                    <input
                      id="me-email-pass"
                      type="password"
                      value={emailPass}
                      onChange={(e) => setEmailPass(e.target.value)}
                      required
                    />
                  </div>
                  <div className="admin-docs__actions">
                    <button
                      type="submit"
                      className="btn btn--primary btn--inline"
                      disabled={emailStatus === 'saving'}
                    >
                      Guardar email
                    </button>
                    <AdminSaveStatus status={emailStatus} message={emailMsg} />
                  </div>
                </form>

                <form
                  className="stack admin-mi-cuenta__edit-card"
                  onSubmit={onSavePassword}
                >
                  <h2 className="admin-config__h2">Cambiar contraseña</h2>
                  <div className="bedelia__field">
                    <label htmlFor="me-pass-current">Contraseña actual</label>
                    <input
                      id="me-pass-current"
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      required
                    />
                  </div>
                  <div className="bedelia__field">
                    <label htmlFor="me-pass-new">Nueva</label>
                    <input
                      id="me-pass-new"
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      minLength={12}
                      maxLength={72}
                      required
                    />
                  </div>
                  <div className="bedelia__field">
                    <label htmlFor="me-pass-confirm">Confirmar</label>
                    <input
                      id="me-pass-confirm"
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      minLength={12}
                      maxLength={72}
                      required
                    />
                  </div>
                  <div className="admin-docs__actions">
                    <button
                      type="submit"
                      className="btn btn--primary btn--inline"
                      disabled={passStatus === 'saving'}
                    >
                      Guardar contraseña
                    </button>
                    <AdminSaveStatus status={passStatus} message={passMsg} />
                  </div>
                </form>
              </div>
            ) : null}
          </div>

          <section className="stack">
            <h2 className="admin-config__h2">Mi rol</h2>
            {!access.loaded ? (
              <p className="muted">Cargando permisos…</p>
            ) : superAdmin ? (
              <p className="muted" style={{ margin: 0 }}>
                Admin: acceso total. Solo vos podés crear, editar o quitar roles
                de otros (con tu contraseña).
              </p>
            ) : access.roleName ? (
              <ul className="admin-perms-readonly">
                {ADMIN_SECTIONS.map((s) => {
                  const p = access.permissions[s.id]
                  const label = !p.view
                    ? 'Sin acceso'
                    : p.manage
                      ? 'Ver y gestionar'
                      : 'Solo ver'
                  return (
                    <li key={s.id}>
                      <span>{s.label}</span>
                      <span className="muted">{label}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="muted">
                Todavía no tenés un rol asignado. Pedile al Admin.
              </p>
            )}
          </section>

          {superAdmin ? (
            <section className="stack">
              <div className="admin-config__roles-head">
                <h2 className="admin-config__h2">Roles del panel</h2>
                {!creating && !editingRole ? (
                  <button
                    type="button"
                    className="btn btn--inline"
                    onClick={startCreate}
                  >
                    + Agregar rol
                  </button>
                ) : null}
              </div>

              {rolesError ? (
                <div className="notice" role="alert">
                  {rolesError}
                </div>
              ) : null}

              <div
                className={`admin-mi-cuenta__roles-layout${
                  creating || editingRole ? ' is-editing' : ''
                }`}
              >
                <div className="admin-mi-cuenta__roles-list">
                  {rolesLoading && roles.length === 0 ? (
                    <p className="muted">Cargando roles…</p>
                  ) : roles.length === 0 ? (
                    <p className="muted">No hay roles todavía.</p>
                  ) : (
                    <ul className="admin-docs__list">
                      {roles.map((r) => (
                        <li key={r.id} className="admin-docs__card">
                          <div className="admin-docs__card-main">
                            <p className="admin-docs__card-title">
                              {r.name || 'Sin nombre'}
                            </p>
                            <p className="admin-docs__card-meta">
                              {r.email || 'Sin email'}
                            </p>
                          </div>
                          <div className="admin-docs__card-actions">
                            <button
                              type="button"
                              className="btn btn--small btn--inline"
                              disabled={Boolean(creating || editingRole)}
                              onClick={() => startEdit(r)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger btn--small btn--inline"
                              disabled={Boolean(creating || editingRole)}
                              onClick={() =>
                                setPending({ kind: 'delete-role', role: r })
                              }
                            >
                              Eliminar
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {creating
                  ? renderRoleForm(creating, 'create', setCreating)
                  : null}
                {editingRole
                  ? renderRoleForm(editingRole, 'edit', setEditingRole)
                  : null}
              </div>
            </section>
          ) : null}
        </>
      )}

      <ConfirmPasswordDialog
        open={Boolean(pending)}
        title="¿Estás seguro?"
        message={confirmMessage}
        confirmLabel={
          pending?.kind === 'delete-role' ? 'Sí, quitar' : 'Sí, guardar'
        }
        busy={confirmBusy}
        error={confirmError}
        onCancel={() => {
          setPending(null)
          setConfirmError('')
        }}
        onConfirm={(pwd) => void confirmPending(pwd)}
      />
    </div>
  )
}